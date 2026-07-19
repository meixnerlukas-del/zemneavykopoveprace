import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, STATUS_COLOR, STATUS_ORDER } from "@/lib/adminStatus";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, q } = await searchParams;

  const districts = await prisma.district.findMany({
    orderBy: { code: "asc" },
    include: { profile: { include: { partner: true } } },
  });

  const counts: Record<string, number> = {};
  for (const d of districts) {
    const s = d.profile?.status ?? "FREE";
    counts[s] = (counts[s] ?? 0) + 1;
  }

  const filtered = districts.filter((d) => {
    const s = d.profile?.status ?? "FREE";
    if (status && status !== "ALL" && s !== status) return false;
    if (q) {
      const hay = `${d.name} ${d.region} ${d.profile?.displayName ?? ""} ${d.profile?.partner?.companyName ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl uppercase">Okresy ({districts.length})</h1>

      {/* Filtre */}
      <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.06em] text-muted">
            Hľadať
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Okres, firma…"
            className="border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.06em] text-muted">
            Stav
          </span>
          <select
            name="status"
            defaultValue={status ?? "ALL"}
            className="border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none"
          >
            <option value="ALL">Všetky ({districts.length})</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]} ({counts[s] ?? 0})
              </option>
            ))}
          </select>
        </label>
        <button className="bg-jcb px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
          Filtrovať
        </button>
        {(q || (status && status !== "ALL")) && (
          <Link href="/admin" className="px-2 py-2 text-sm text-muted hover:text-jcb">
            Zrušiť
          </Link>
        )}
      </form>

      {/* Tabuľka */}
      <div className="mt-6 overflow-x-auto border border-concrete bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-concrete-2 text-left uppercase tracking-[0.05em] text-muted">
            <tr>
              <th className="p-3">Okres</th>
              <th className="p-3">Kraj</th>
              <th className="p-3">Firma</th>
              <th className="p-3">Stav</th>
              <th className="p-3">Expirácia</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const s = d.profile?.status ?? "FREE";
              return (
                <tr key={d.id} className="border-t border-concrete">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3 text-muted">{d.region}</td>
                  <td className="p-3">{d.profile?.displayName ?? d.profile?.partner?.companyName ?? "—"}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5" style={{ background: STATUS_COLOR[s] }} />
                      {STATUS_LABEL[s]}
                    </span>
                  </td>
                  <td className="p-3 text-muted">
                    {d.profile?.expiresAt ? new Date(d.profile.expiresAt).toLocaleDateString("sk-SK") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/okres/${d.slug}`} className="text-jcb hover:underline">
                      Upraviť
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  Žiadne okresy nezodpovedajú filtru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
