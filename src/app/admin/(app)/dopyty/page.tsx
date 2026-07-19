import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ okres?: string }>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const { okres } = await searchParams;

  const districts = await prisma.district.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  const bySlug = new Map(districts.map((d) => [d.id, d]));
  const filterDistrict = okres ? districts.find((d) => d.slug === okres) : null;

  const leads = await prisma.lead.findMany({
    where: filterDistrict ? { districtId: filterDistrict.id } : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl uppercase">Dopyty ({leads.length})</h1>
        <a
          href={`/api/admin/leads.csv${okres ? `?okres=${okres}` : ""}`}
          className="border border-asphalt px-4 py-2 text-sm uppercase tracking-[0.05em] hover:border-jcb hover:text-jcb"
        >
          Export CSV
        </a>
      </div>

      <form method="get" className="mt-4 flex items-end gap-3">
        <label>
          <span className="mb-1 block text-xs uppercase tracking-[0.06em] text-muted">Okres</span>
          <select name="okres" defaultValue={okres ?? ""} className="border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none">
            <option value="">Všetky okresy</option>
            {districts.map((d) => (
              <option key={d.id} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </label>
        <button className="bg-jcb px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">Filtrovať</button>
        {okres && <Link href="/admin/dopyty" className="px-2 py-2 text-sm text-muted hover:text-jcb">Zrušiť</Link>}
      </form>

      <div className="mt-6 overflow-x-auto border border-concrete bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-concrete-2 text-left uppercase tracking-[0.05em] text-muted">
            <tr>
              <th className="p-3">Dátum</th>
              <th className="p-3">Okres</th>
              <th className="p-3">Meno</th>
              <th className="p-3">Kontakt</th>
              <th className="p-3">Správa</th>
              <th className="p-3">Doručené</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-concrete align-top">
                <td className="p-3 text-muted">{new Date(l.createdAt).toLocaleString("sk-SK")}</td>
                <td className="p-3">{l.districtId ? bySlug.get(l.districtId)?.name ?? "—" : "—"}</td>
                <td className="p-3">{l.name}</td>
                <td className="p-3">{l.email}{l.phone ? ` · ${l.phone}` : ""}</td>
                <td className="p-3">{l.message}</td>
                <td className="p-3">{l.sentOk ? "áno" : "nie"}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">Žiadne dopyty.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
