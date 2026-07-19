import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function toggleHandled(id: string, handled: boolean) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  await prisma.order.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/objednavky");
}

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl uppercase">Objednávky ({orders.length})</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">Zatiaľ žiadne objednávky.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <details key={o.id} className={`border bg-paper ${o.handled ? "border-concrete opacity-70" : "border-jcb"}`}>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <strong>{o.companyName}</strong> · {o.districts} ·{" "}
                  <span className="text-muted">{new Date(o.createdAt).toLocaleString("sk-SK")}</span>
                </span>
                <span className={o.handled ? "text-muted" : "text-jcb"}>
                  {o.handled ? "Vybavené" : "Nové"}
                </span>
              </summary>
              <div className="grid gap-1 border-t border-concrete p-4 text-sm">
                <p><strong>IČO:</strong> {o.ico} · <strong>DIČ:</strong> {o.dic ?? "—"} · <strong>IČ DPH:</strong> {o.icDph ?? "—"}</p>
                <p><strong>Kontakt:</strong> {o.contactName ?? "—"} · {o.phone} · {o.email}</p>
                <p><strong>Fakturačná adresa:</strong> {o.billingAddr}</p>
                <p><strong>Okresy:</strong> {o.districts}</p>
                {o.note && <p><strong>Poznámka:</strong> {o.note}</p>}
                <form action={toggleHandled.bind(null, o.id, !o.handled)} className="mt-2">
                  <button className="bg-asphalt px-4 py-2 text-sm uppercase tracking-[0.05em] text-paper hover:bg-asphalt-2">
                    {o.handled ? "Označiť ako nové" : "Označiť ako vybavené"}
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
