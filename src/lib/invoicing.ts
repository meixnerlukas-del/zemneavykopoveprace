// Vysokoúrovňová fakturačná logika nad Účto+ klientom.
// - createProformaForOrder: predfaktúra hneď po objednávke
// - markOrderPaidAndInvoice: po „platba prijatá" → ostrá faktúra + stavy profilov
//
// Bez UCTOPLUS_API_KEY sa doklad v Účto+ nevystaví (Invoice ostane "pending"),
// ale záznamy aj stavy sa vytvoria — tok funguje aj pred dodaním kľúča.

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

type OrderRow = {
  id: string;
  companyName: string;
  ico: string;
  dic: string | null;
  icDph: string | null;
  billingAddr: string;
  districts: string;
  paidAt: Date | null;
};

function digits(s: string): number | null {
  const n = Number(String(s).replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildReceiver(order: OrderRow): InvoiceReceiver {
  return {
    name: order.companyName,
    street: order.billingAddr,
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
  const amounts = computeOrderAmounts(names.length);
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
      invoiceNumber: num.invoiceNumber,
      variableSymbol: num.variableSymbol,
      issuer: ISSUER,
      receiver: buildReceiver(order),
      items: buildItems(names),
      paymentType: "TRANSFER",
    });
    return await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "issued",
        uctoplusInvoiceId: created.id,
        uctoplusNumber: created.invoiceNumber || null,
        issuedAt: new Date(),
      },
    });
  } catch (e) {
    return await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "failed", lastError: String(e).slice(0, 500) },
    });
  }
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
  const today = new Date().toISOString().slice(0, 10);
  try {
    const created = await new UctoPlusClient().createInvoice({
      kind: isFinal ? "issued" : "proforma",
      invoiceNumber: invoice.invoiceNumber,
      variableSymbol: invoice.variableSymbol,
      issuer: ISSUER,
      receiver: buildReceiver(invoice.order),
      items: buildItems(names),
      paymentType: "TRANSFER",
      dateDelivery: isFinal ? today : undefined,
    });
    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: isFinal ? "paid" : "issued",
        uctoplusInvoiceId: created.id,
        uctoplusNumber: created.invoiceNumber || null,
        issuedAt: new Date(),
        ...(isFinal ? { paidAt: new Date() } : {}),
      },
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
  const amounts = computeOrderAmounts(names.length);

  // Vytvor (alebo znovupoužiť) ostrú faktúru.
  let final = existingFinal;
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
        invoiceNumber: final.invoiceNumber,
        variableSymbol: final.variableSymbol,
        issuer: ISSUER,
        receiver: buildReceiver(order),
        items: buildItems(names),
        paymentType: "TRANSFER",
        dateDelivery: today,
      });
      final = await prisma.invoice.update({
        where: { id: final.id },
        data: {
          status: "paid",
          uctoplusInvoiceId: created.id,
          uctoplusNumber: created.invoiceNumber || null,
          issuedAt: new Date(),
          paidAt: new Date(),
        },
      });
    } catch (e) {
      await prisma.invoice.update({
        where: { id: final.id },
        data: { status: "failed", lastError: String(e).slice(0, 500) },
      });
      throw new Error(`Ostrú faktúru sa nepodarilo vystaviť cez Účto+: ${String(e).slice(0, 200)}`);
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
