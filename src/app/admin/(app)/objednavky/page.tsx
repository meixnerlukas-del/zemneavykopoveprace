import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendEmail, OPERATOR_EMAIL } from "@/lib/email";
import { markOrderPaidAndInvoice, retryInvoiceIssue } from "@/lib/invoicing";
import { formatEur } from "@/lib/pricing";

export const dynamic = "force-dynamic";

async function toggleHandled(id: string, handled: boolean) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  await prisma.order.update({ where: { id }, data: { handled } });
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
      if (order) {
        await sendEmail({
          to: order.email,
          subject: `Potvrdenie platby a faktúra${final?.invoiceNumber ? " č. " + final.invoiceNumber : ""} — zemneavykopoveprace.sk`,
          html: `
            <h2>Platba prijatá — ďakujeme</h2>
            <p>Zaevidovali sme úhradu vašej objednávky okresov: <strong>${order.districts}</strong>.</p>
            ${final?.invoiceNumber ? `<p>Vystavili sme ostrú faktúru č. <strong>${final.invoiceNumber}</strong> na sumu ${formatEur(Number(final.amountWithVat))} s DPH.</p>` : ""}
            <p>Čoskoro vám sprístupníme doplnenie profilu (logo, fotky, popis služieb, kontakty). Po doplnení podkladov profil zverejníme.</p>
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
                          <strong>{inv.invoiceNumber}</strong> · {formatEur(Number(inv.amountWithVat))} s DPH ·{" "}
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
