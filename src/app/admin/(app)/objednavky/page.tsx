import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendEmail, OPERATOR_EMAIL } from "@/lib/email";
import {
  markOrderPaidAndInvoice,
  retryInvoiceIssue,
  reissueProformaForOrder,
  OPERATOR_IBAN,
  PAYMENT_DUE_DAYS,
} from "@/lib/invoicing";
import { provisionPartnerForOrder } from "@/lib/partnerProvisioning";
import { formatEur, computeOrderTotal } from "@/lib/pricing";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://www.zemneavykopoveprace.sk";

export const dynamic = "force-dynamic";

async function toggleHandled(id: string, handled: boolean) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  await prisma.order.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/objednavky");
}

// Manuálna úprava ceny (zmena ceny / zľava / zdarma) + znovuvystavenie predfaktúry.
async function setOrderPrice(orderId: string, formData: FormData) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  const raw = String(formData.get("price") ?? "").trim().replace(",", ".");
  const note = String(formData.get("priceNote") ?? "").trim() || null;
  const override =
    raw === "" ? null : Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;

  await prisma.order.update({
    where: { id: orderId },
    data: { overrideTotalWithVat: override, priceNote: note },
  });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order && !order.paidAt) {
    try {
      const inv = await reissueProformaForOrder(orderId);
      if (override === 0) {
        await sendEmail({
          to: order.email,
          subject: "Úprava objednávky — služba zdarma — zemneavykopoveprace.sk",
          html: `<h2>Úprava objednávky</h2><p>Vašu objednávku okresov <strong>${order.districts}</strong> sme nastavili ako <strong>zdarma</strong>. Predfaktúra sa nevystavuje. Po sprístupnení vám pošleme prihlásenie do profilu.</p><p>Metraco s.r.o.</p>`,
        });
      } else if (inv) {
        const num = inv.uctoplusNumber ?? inv.invoiceNumber;
        const due = new Date(Date.now() + PAYMENT_DUE_DAYS * 86400000).toLocaleDateString("sk-SK");
        await sendEmail({
          to: order.email,
          subject: `Upravená predfaktúra${num ? " č. " + num : ""} — zemneavykopoveprace.sk`,
          html: `<h2>Upravená cena objednávky</h2>
            <p>K objednávke okresov <strong>${order.districts}</strong> sme vystavili upravenú predfaktúru.</p>
            <table cellpadding="4"><tr><td><strong>Suma na úhradu</strong></td><td>${formatEur(Number(inv.amountWithVat))} s DPH</td></tr>
            <tr><td><strong>IBAN</strong></td><td>${OPERATOR_IBAN}</td></tr>
            <tr><td><strong>Variabilný symbol</strong></td><td>${inv.variableSymbol ?? "—"}</td></tr>
            <tr><td><strong>Splatnosť</strong></td><td>${due}</td></tr></table>
            <p>Metraco s.r.o. · IČO 50 010 221 · IČ DPH SK2120143707</p>`,
        });
      }
    } catch (e) {
      console.error("[admin] setOrderPrice:", e);
    }
  }
  revalidatePath("/admin/objednavky");
}

async function markPaid(orderId: string) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  try {
    const res = await markOrderPaidAndInvoice(orderId);
    if (!res.alreadyPaid) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { invoices: true },
      });
      const final = order?.invoices.find((i) => i.type === "final");
      const finalNum = final?.uctoplusNumber ?? final?.invoiceNumber ?? null;

      // Sprístupni partnerovi self-service (vytvor/napoj partnera + magic-link).
      let loginUrl = "";
      try {
        const prov = await provisionPartnerForOrder(orderId);
        if (prov) loginUrl = `${SITE_URL}/api/partner/verify?token=${prov.magicToken}`;
      } catch (e) {
        console.error("[admin] provisioning partnera:", e);
      }

      if (order) {
        await sendEmail({
          to: order.email,
          subject: `Platba prijatá — sprístupnenie profilu${finalNum ? " · faktúra č. " + finalNum : ""} — zemneavykopoveprace.sk`,
          html: `
            <h2>Platba prijatá — ďakujeme</h2>
            <p>Zaevidovali sme úhradu vašej objednávky okresov: <strong>${order.districts}</strong>.</p>
            ${finalNum ? `<p>Vystavili sme ostrú faktúru č. <strong>${finalNum}</strong> na sumu ${formatEur(Number(final!.amountWithVat))} s DPH.</p>` : ""}
            <h3>Doplňte si profil sami</h3>
            <p>Sprístupnili sme vám vlastné rozhranie, kde si doplníte logo, fotky, popis služieb, vozový park a kontakty, a profil zverejníte.</p>
            ${loginUrl ? `<p><a href="${loginUrl}" style="display:inline-block;background:#F2B01E;color:#412402;padding:12px 24px;text-decoration:none;font-weight:600">Prihlásiť sa a doplniť profil</a></p><p style="font-size:12px;color:#7A7C7E">Odkaz je platný 30 minút. Neskôr sa prihlásite na ${SITE_URL}/partner (odkaz vám pošleme na e-mail).</p>` : `<p>Prihlásiť sa môžete na <a href="${SITE_URL}/partner">${SITE_URL}/partner</a> (odkaz vám pošleme na tento e-mail).</p>`}
            <p>Metraco s.r.o. · Dolné Obdokovce 64, 951 02 · IČO 50 010 221 · IČ DPH SK2120143707</p>
          `,
        });
      }
    }
  } catch (e) {
    // Chyba (napr. Účto+) je uložená na invoice.lastError — zobrazí sa nižšie.
    console.error("[admin] markPaid:", e);
  }
  revalidatePath("/admin/objednavky");
}

async function retryIssue(invoiceId: string) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  try {
    await retryInvoiceIssue(invoiceId);
  } catch (e) {
    console.error("[admin] retryIssue:", e);
  }
  revalidatePath("/admin/objednavky");
}

const STATUS_LABEL: Record<string, string> = {
  pending: "čaká na vystavenie",
  issued: "vystavená",
  paid: "zaplatená",
  failed: "chyba",
};

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { invoices: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div>
      <h1 className="text-2xl uppercase">Objednávky ({orders.length})</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">Zatiaľ žiadne objednávky.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => {
            const proforma = o.invoices.find((i) => i.type === "proforma");
            const final = o.invoices.find((i) => i.type === "final");
            return (
              <details key={o.id} className={`border bg-paper ${o.paidAt ? "border-concrete opacity-80" : "border-jcb"}`}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                  <span>
                    <strong>{o.companyName}</strong> · {o.districts} ·{" "}
                    <span className="text-muted">{new Date(o.createdAt).toLocaleString("sk-SK")}</span>
                  </span>
                  <span className={o.paidAt ? "text-muted" : "text-jcb"}>
                    {o.paidAt ? "Zaplatené" : "Čaká na platbu"}
                  </span>
                </summary>
                <div className="grid gap-1 border-t border-concrete p-4 text-sm">
                  <p><strong>IČO:</strong> {o.ico} · <strong>DIČ:</strong> {o.dic ?? "—"} · <strong>IČ DPH:</strong> {o.icDph ?? "—"}</p>
                  <p><strong>Kontakt:</strong> {o.contactName ?? "—"} · {o.phone} · {o.email}</p>
                  <p><strong>Fakturačná adresa:</strong> {o.billingAddr}</p>
                  <p><strong>Okresy:</strong> {o.districts}</p>
                  {o.note && <p><strong>Poznámka:</strong> {o.note}</p>}

                  {/* Faktúry */}
                  <div className="mt-2 border border-concrete p-3">
                    <p className="mb-1 text-xs uppercase tracking-[0.06em] text-muted">Faktúry</p>
                    {o.invoices.length === 0 && <p className="text-muted">Žiadne faktúry.</p>}
                    {o.invoices.map((inv) => (
                      <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
                        <span>
                          {inv.type === "proforma" ? "Predfaktúra" : "Ostrá faktúra"}{" "}
                          <strong>{inv.uctoplusNumber ?? inv.invoiceNumber}</strong> · {formatEur(Number(inv.amountWithVat))} s DPH ·{" "}
                          <span className={inv.status === "failed" ? "text-red-700" : "text-muted"}>
                            {STATUS_LABEL[inv.status] ?? inv.status}
                          </span>
                          {inv.lastError && <span className="block text-xs text-red-700">{inv.lastError}</span>}
                        </span>
                        {(inv.status === "pending" || inv.status === "failed") && (
                          <form action={retryIssue.bind(null, inv.id)}>
                            <button className="border border-asphalt px-3 py-1 text-xs uppercase hover:bg-asphalt hover:text-paper">
                              Vystaviť v Účto+
                            </button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Cena / zľava / zdarma */}
                  {!o.paidAt && (
                    <div className="mt-2 border border-concrete p-3">
                      <p className="mb-1 text-xs uppercase tracking-[0.06em] text-muted">Cena / zľava / zdarma</p>
                      <p className="text-xs text-muted">
                        Štandardná cena: {formatEur(computeOrderTotal(o.districts.split(",").filter(Boolean).length))} s DPH.
                        {o.overrideTotalWithVat != null && (
                          <> Nastavené:{" "}
                            <strong>
                              {Number(o.overrideTotalWithVat) === 0
                                ? "ZDARMA"
                                : formatEur(Number(o.overrideTotalWithVat)) + " s DPH"}
                            </strong>
                            {o.priceNote ? ` (${o.priceNote})` : ""}.
                          </>
                        )}
                      </p>
                      <form action={setOrderPrice.bind(null, o.id)} className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                        <label className="text-xs">
                          <span className="block text-muted">Konečná cena s DPH (0 = zdarma, prázdne = štandard)</span>
                          <input
                            name="price"
                            defaultValue={o.overrideTotalWithVat != null ? String(Number(o.overrideTotalWithVat)) : ""}
                            placeholder="napr. 150 alebo 0"
                            className="mt-1 w-40 border border-concrete px-2 py-1"
                          />
                        </label>
                        <label className="text-xs">
                          <span className="block text-muted">Poznámka (dôvod)</span>
                          <input name="priceNote" defaultValue={o.priceNote ?? ""} className="mt-1 w-full border border-concrete px-2 py-1" />
                        </label>
                        <button className="border border-asphalt px-3 py-2 text-xs uppercase hover:bg-asphalt hover:text-paper">
                          Uložiť a znovu vystaviť
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Akcie */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!o.paidAt && (
                      <form action={markPaid.bind(null, o.id)}>
                        <button className="bg-jcb px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
                          Platba prijatá → vystaviť ostrú faktúru
                        </button>
                      </form>
                    )}
                    <form action={toggleHandled.bind(null, o.id, !o.handled)}>
                      <button className="bg-asphalt px-4 py-2 text-sm uppercase tracking-[0.05em] text-paper hover:opacity-90">
                        {o.handled ? "Označiť ako nevybavené" : "Označiť ako vybavené"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    ID: {o.id}
                    {proforma && ` · predfaktúra ${proforma.status}`}
                    {final && ` · ostrá ${final.status}`}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
