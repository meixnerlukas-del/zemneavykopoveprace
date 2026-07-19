import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExpirationsPage() {
  const profiles = await prisma.profile.findMany({
    where: { expiresAt: { not: null }, status: { in: ["PUBLISHED", "EXPIRED"] } },
    orderBy: { expiresAt: "asc" },
    include: { district: true, partner: true },
  });

  const now = Date.now();
  const day = 24 * 3600 * 1000;

  return (
    <div>
      <h1 className="text-2xl uppercase">Expirácie</h1>
      <p className="mt-2 text-muted">
        Profily s dátumom expirácie. Zvýraznené sú tie do 30 dní. Notifikácie 30 a 7
        dní pred koncom posiela cron (viď README).
      </p>

      {profiles.length === 0 ? (
        <p className="mt-6 text-muted">Žiadne profily s dátumom expirácie.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-concrete bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-concrete-2 text-left uppercase tracking-[0.05em] text-muted">
              <tr>
                <th className="p-3">Okres</th>
                <th className="p-3">Firma</th>
                <th className="p-3">Expiruje</th>
                <th className="p-3">Zostáva</th>
                <th className="p-3">Free update</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const exp = p.expiresAt ? new Date(p.expiresAt).getTime() : 0;
                const days = Math.ceil((exp - now) / day);
                const soon = days <= 30;
                return (
                  <tr key={p.id} className={`border-t border-concrete ${soon ? "bg-jcb/10" : ""}`}>
                    <td className="p-3 font-medium">{p.district.name}</td>
                    <td className="p-3">{p.displayName ?? p.partner?.companyName ?? "—"}</td>
                    <td className="p-3">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("sk-SK") : "—"}</td>
                    <td className={`p-3 ${soon ? "font-medium text-jcb-ink" : "text-muted"}`}>
                      {days < 0 ? `expirované (${-days} dní)` : `${days} dní`}
                    </td>
                    <td className="p-3 text-muted">{p.freeUpdateUsed ? "využitá" : "voľná"}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/okres/${p.district.slug}`} className="text-jcb hover:underline">Upraviť</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
