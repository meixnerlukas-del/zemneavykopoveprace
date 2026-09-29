// Vysokoúrovňová fakturačná logika nad Účto+ klientom.
// - createProformaForOrder: predfaktúra hneď po objednávke
// - markOrderPaidAndInvoice: po „platba prijatá" → ostrá faktúra + stavy profilov
//
// Bez UCTOPLUS_API_KEY sa doklad v Účto+ nevystaví (Invoice ostane "pending"),
// ale záznamy aj stavy sa vytvoria — tok funguje aj pred dodaním kľúča.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeOrderAmounts, districtNetPrice, VAT_RATE } from "@/lib/pricing";
import {
  UctoPlusClient,
  uctoplusEnabled,
  type InvoiceIssuer,
  type InvoiceReceiver,
  type InvoiceItem,
} from "@/lib/uctoplus";

// Vystaviteľ = Metraco s.r.o. (verejné registračné údaje).
export const ISSUER: InvoiceIssuer = {
  name: "Metraco s.r.o.",
  street: "Dolné Obdokovce 64",
  city: "Dolné Obdokovce",
  zip: "951 02",
  country: "SVK",
  sk_ico: 50010221,
  vat: "SK2120143707",
};

export const OPERATOR_IBAN = "SK4602000000004565568056";
export const PAYMENT_DUE_DAYS = 14;

// Poradovníky (číselné rady) v Účto+ — číslo prideľuje Účto+ z tohto radu.
// Nastav vo Verceli: UCTOPLUS_PROFORMA_COUNTER_ID a UCTOPLUS_INVOICE_COUNTER_ID.
// Kým nie sú nastavené, fallback: appka pošle vlastné číslo (ako doteraz).
const PROFORMA_COUNTER_ID = process.env.UCTOPLUS_PROFORMA_COUNTER_ID
  ? Number(process.env.UCTOPLUS_PROFORMA_COUNTER_ID)
  : null;
const INVOICE_COUNTER_ID = process.env.UCTOPLUS_INVOICE_COUNTER_ID
  ? Number(process.env.UCTOPLUS_INVOICE_COUNTER_ID)
  : null;

export const CONFIGURED_COUNTERS = {
  proforma: PROFORMA_COUNTER_ID,
  invoice: INVOICE_COUNTER_ID,
};

// Výpis poradovníkov z Účto+ (pre admin, aby si používateľ vybral id číselného radu).
export async function listAllCounters() {
  if (!uctoplusEnabled()) {
    return { enabled: false, proforma: [], invoice: [], configured: CONFIGURED_COUNTERS };
  }
  const c = new UctoPlusClient();
  const [proforma, invoice] = await Promise.all([
    c.getCounters("PROFORMA_INVOICE").catch((e) => {
      console.error("[uctoplus] counters PROFORMA:", e);
      return [] as Awaited<ReturnType<typeof c.getCounters>>;
    }),
    c.getCounters("INVOICE").catch((e) => {
      console.error("[uctoplus] counters INVOICE:", e);
      return [] as Awaited<ReturnType<typeof c.getCounters>>;
    }),
  ]);
  return { enabled: true, proforma, invoice, configured: CONFIGURED_COUNTERS };
}

// Z odpovede Účto+ zloží update dáta (uloží pridelené číslo z poradovníka + VS).
function issuedData(created: { id: string; invoiceNumber: string; variableSymbol?: string }, markPaid = false) {
  const vs = created.variableSymbol || (created.invoiceNumber ? created.invoiceNumber.replace(/\D/g, "") : "");
  return {
    status: markPaid ? "paid" : "issued",
    uctoplusInvoiceId: created.id,
    uctoplusNumber: created.invoiceNumber || null,
    ...(vs ? { variableSymbol: vs } : {}),
    issuedAt: new Date(),
    ...(markPaid ? { paidAt: new Date() } : {}),
  };
}

type OrderRow = {
  id: string;
  companyName: string;
  ico: string;
  dic: string | null;
  icDph: string | null;
  billingAddr: string;
  districts: string;
  paidAt: Date | null;
  overrideTotalWithVat: Prisma.Decimal | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Sumy objednávky: buď manuálny override (zdarma/zľava/vlastná cena), alebo štandardný cenník.
function resolveAmounts(order: OrderRow, count: number) {
  if (order.overrideTotalWithVat != null) {
    const gross = Number(order.overrideTotalWithVat);
    const net = round2(gross / (1 + VAT_RATE / 100));
    return { net, gross, vat: round2(gross - net), overridden: true, free: gross <= 0 };
  }
  const a = computeOrderAmounts(count);
  return { ...a, overridden: false, free: false };
}

// Položky faktúry: pri override jedna súhrnná položka, inak po okresoch.
function itemsFor(names: string[], amounts: { overridden: boolean; net: number }): InvoiceItem[] {
  if (amounts.overridden) {
    return [
      {
        name: `Ročné zastúpenie zhotoviteľa — okresy: ${names.join(", ")} (zemneavykopoveprace.sk)`,
        quantity: 1,
        priceWithoutTax: amounts.net,
        taxPercentage: VAT_RATE,
        type: "ks",
        discount: 0,
      },
    ];
  }
  return buildItems(names);
}

function digits(s: string): number | null {
  const n = Number(String(s).replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Účto+ vyžaduje na príjemcovi samostatné pole `city` (inak HTTP 400
// "city: The city field is required."). Objednávka má adresu ako jeden reťazec,
// tak ju rozparsujeme na ulicu / PSČ / mesto s bezpečnými fallbackmi.
export function parseAddress(billingAddr: string): { street: string; city: string; zip: string | null } {
  const raw = (billingAddr ?? "").trim();
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const street = parts[0] || raw || "-";
  const rest = (parts.length > 1 ? parts.slice(1).join(", ") : raw).trim();
  const zipMatch = rest.match(/\d{3}\s?\d{2}/);
  const zip = zipMatch ? zipMatch[0] : null;
  let city = (zip ? rest.replace(zip, "") : rest).replace(/\s{2,}/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").trim();
  if (!city) city = rest || street || "-"; // Účto+ vyžaduje neprázdne mesto
  return { street, city, zip };
}

function buildReceiver(order: OrderRow): InvoiceReceiver {
  const addr = parseAddress(order.billingAddr);
  return {
    name: order.companyName,
    street: addr.street,
    city: addr.city,
    zip: addr.zip,
    country: "SVK",
    sk_ico: digits(order.ico),
    sk_dic: order.dic ? digits(order.dic) : null,
    vat: order.icDph ?? null,
  };
}

function buildItems(districtNames: string[]): InvoiceItem[] {
  return districtNames.map((name, i) => ({
    name: `Ročný profil zhotoviteľa — okres ${name} (zemneavykopoveprace.sk)`,
    quantity: 1,
    priceWithoutTax: districtNetPrice(i),
    taxPercentage: VAT_RATE,
    type: "ks",
    discount: 0,
  }));
}

const pad4 = (n: number) => String(n).padStart(4, "0");

// Ročná postupnosť. invoiceNumber je @unique → pri kolízii (súbeh) skúsi ďalšie.
async function allocateNumber(type: "proforma" | "final") {
  const prefix = type === "proforma" ? "PF" : "";
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  for (let bump = 0; bump < 6; bump++) {
    const count = await prisma.invoice.count({
      where: { type, createdAt: { gte: yearStart } },
    });
    const seq = count + 1 + bump;
    const invoiceNumber = `${prefix}${year}${pad4(seq)}`;
    const exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (!exists) return { invoiceNumber, variableSymbol: `${year}${pad4(seq)}` };
  }
  throw new Error("Nepodarilo sa vygenerovať jedinečné číslo faktúry");
}

async function loadOrderDistrictNames(order: OrderRow): Promise<string[]> {
  const slugs = order.districts.split(",").map((s) => s.trim()).filter(Boolean);
  const districts = await prisma.district.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, name: true },
  });
  // Zachovaj poradie zo slugov (kvôli zľave „prvý plný, ďalšie −25 %").
  const byslug = new Map(districts.map((d) => [d.slug, d.name]));
  return slugs.map((s) => byslug.get(s) ?? s);
}

/** Predfaktúra k objednávke (hneď po objednaní). Vracia Invoice záznam. */
export async function createProformaForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Objednávka neexistuje");

  const names = await loadOrderDistrictNames(order);
  const amounts = resolveAmounts(order, names.length);
  if (amounts.free) return null; // služba zdarma → predfaktúra sa nevystavuje
  const num = await allocateNumber("proforma");

  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      type: "proforma",
      status: "pending",
      invoiceNumber: num.invoiceNumber,
      variableSymbol: num.variableSymbol,
      amountWithoutVat: amounts.net,
      amountWithVat: amounts.gross,
      vatRate: VAT_RATE,
    },
  });

  if (!uctoplusEnabled()) return invoice; // bez kľúča ostane "pending"

  try {
    const created = await new UctoPlusClient().createInvoice({
      kind: "proforma",
      counterId: PROFORMA_COUNTER_ID,
      invoiceNumber: num.invoiceNumber, // fallback, keď poradovník nie je nastavený
      variableSymbol: num.variableSymbol,
      issuer: ISSUER,
      receiver: buildReceiver(order),
      items: itemsFor(names, amounts),
      paymentType: "TRANSFER",
    });
    return await prisma.invoice.update({
      where: { id: invoice.id },
      data: issuedData(created),
    });
  } catch (e) {
    return await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "failed", lastError: String(e).slice(0, 500) },
    });
  }
}

/** Zruší doterajšie (nezaplatené) predfaktúry objednávky a vystaví novú s aktuálnou cenou.
 *  Použi po manuálnej úprave ceny adminom. Pri službe zdarma vráti null. */
export async function reissueProformaForOrder(orderId: string) {
  await prisma.invoice.updateMany({
    where: { orderId, type: "proforma", status: { notIn: ["paid"] } },
    data: { status: "cancelled" },
  });
  return await createProformaForOrder(orderId);
}

/** Znovu sa pokúsi vystaviť existujúcu faktúru v Účto+ (pending/failed) — bez duplikátu. */
export async function retryInvoiceIssue(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: true },
  });
  if (!invoice) throw new Error("Faktúra neexistuje");
  if (!uctoplusEnabled()) throw new Error("UCTOPLUS_API_KEY nie je nastavený");
  if (invoice.status === "issued" || invoice.status === "paid") return invoice;

  const isFinal = invoice.type === "final";
  const names = await loadOrderDistrictNames(invoice.order);
  const amounts = resolveAmounts(invoice.order, names.length);
  const today = new Date().toISOString().slice(0, 10);
  try {
    const created = await new UctoPlusClient().createInvoice({
      kind: isFinal ? "issued" : "proforma",
      counterId: isFinal ? INVOICE_COUNTER_ID : PROFORMA_COUNTER_ID,
      invoiceNumber: invoice.invoiceNumber,
      variableSymbol: invoice.variableSymbol,
      issuer: ISSUER,
      receiver: buildReceiver(invoice.order),
      items: itemsFor(names, amounts),
      paymentType: "TRANSFER",
      dateDelivery: isFinal ? today : undefined,
    });
    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: issuedData(created, isFinal),
    });
  } catch (e) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "failed", lastError: String(e).slice(0, 500) },
    });
    throw e;
  }
}

/**
 * Označí objednávku ako zaplatenú: vystaví ostrú faktúru cez Účto+ (ak je kľúč),
 * predfaktúru označí paid, Order.paidAt, a profily okresov PENDING_PAYMENT → PENDING_CONTENT.
 *
 * Ak je Účto+ zapnuté a vystavenie ostrej faktúry zlyhá, NIČ sa nemení a chyba sa vyhodí,
 * aby admin videl problém a mohol to zopakovať. Bez kľúča sa stavy zmenia (admin potvrdil
 * platbu ručne) a ostrá faktúra sa dogeneruje po vložení kľúča.
 */
export async function markOrderPaidAndInvoice(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoices: true },
  });
  if (!order) throw new Error("Objednávka neexistuje");
  if (order.paidAt) return { alreadyPaid: true as const };

  const proforma = order.invoices.find((i) => i.type === "proforma") ?? null;
  const existingFinal = order.invoices.find((i) => i.type === "final") ?? null;

  const names = await loadOrderDistrictNames(order);
  const amounts = resolveAmounts(order, names.length);

  // Vytvor (alebo znovupoužiť) ostrú faktúru — pri službe zdarma sa faktúra nevystavuje.
  let final = existingFinal;
  if (!amounts.free) {
    if (!final) {
      const num = await allocateNumber("final");
      final = await prisma.invoice.create({
        data: {
          orderId,
          type: "final",
          status: "pending",
          relatedProformaId: proforma?.id ?? null,
          invoiceNumber: num.invoiceNumber,
          variableSymbol: num.variableSymbol,
          amountWithoutVat: amounts.net,
          amountWithVat: amounts.gross,
          vatRate: VAT_RATE,
        },
      });
    }

    if (uctoplusEnabled() && final.status !== "issued" && final.status !== "paid") {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const created = await new UctoPlusClient().createInvoice({
          kind: "issued",
          counterId: INVOICE_COUNTER_ID,
          invoiceNumber: final.invoiceNumber,
          variableSymbol: final.variableSymbol,
          issuer: ISSUER,
          receiver: buildReceiver(order),
          items: itemsFor(names, amounts),
          paymentType: "TRANSFER",
          dateDelivery: today,
        });
        final = await prisma.invoice.update({
          where: { id: final.id },
          data: issuedData(created, true),
        });
      } catch (e) {
        await prisma.invoice.update({
          where: { id: final.id },
          data: { status: "failed", lastError: String(e).slice(0, 500) },
        });
        throw new Error(`Ostrú faktúru sa nepodarilo vystaviť cez Účto+: ${String(e).slice(0, 200)}`);
      }
    }
  }

  // Stavy: predfaktúra paid, objednávka paid, profily → PENDING_CONTENT.
  const slugs = order.districts.split(",").map((s) => s.trim()).filter(Boolean);
  const districts = await prisma.district.findMany({
    where: { slug: { in: slugs } },
    include: { profile: { select: { id: true } } },
  });
  const profileIds = districts.map((d) => d.profile?.id).filter((x): x is string => !!x);

  await prisma.$transaction([
    ...(proforma
      ? [
          prisma.invoice.update({
            where: { id: proforma.id },
            data: { status: "paid", paidAt: new Date() },
          }),
        ]
      : []),
    prisma.order.update({ where: { id: orderId }, data: { paidAt: new Date() } }),
    prisma.profile.updateMany({
      where: { id: { in: profileIds }, status: "PENDING_PAYMENT" },
      data: { status: "PENDING_CONTENT" },
    }),
  ]);

  return { alreadyPaid: false as const, final, proforma };
}
