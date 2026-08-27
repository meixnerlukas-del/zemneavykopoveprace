import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPartner } from "@/lib/partnerAuth";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Čaká na platbu",
  PENDING_CONTENT: "Čaká na doplnenie obsahu",
  PUBLISHED: "Zverejnený",
  EXPIRED: "Expirovaný",
  SUSPENDED: "Pozastavený",
  FREE: "Voľný",
};

export default async function PartnerProfilesPage() {
  const partner = await getPartner();
  if (!partner) redirect("/partner");

  const profiles = await prisma.profile.findMany({
    where: { partnerId: partner.id },
    include: { district: true },
    orderBy: { district: { name: "asc" } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl uppercase">Vaše okresy</h1>
        <form action="/api/partner/logout" method="post">
          <button className="border border-asphalt px-4 py-2 text-sm uppercase tracking-[0.05em] hover:bg-asphalt hover:text-paper">
            Odhlásiť sa
          </button>
        </form>
      </div>
      <p className="mt-2 text-muted">{partner.companyName}</p>

      {profiles.length === 0 ? (
        <p className="mt-8 border-l-4 border-jcb bg-paper p-4">
          Zatiaľ k vášmu kontu nie je priradený žiadny okres. Ak ste práve zaplatili, chvíľu počkajte.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {profiles.map((p) => (
            <li key={p.id} className="border border-concrete bg-paper p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl uppercase">{p.district.name}</h2>
                <span className={`text-xs uppercase tracking-[0.05em] ${p.status === "PUBLISHED" ? "text-jcb" : "text-muted"}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{p.district.region}</p>
              <Link
                href={`/partner/profil/${p.district.slug}`}
                className="mt-4 inline-block bg-jcb px-5 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90"
              >
                Upraviť profil
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
