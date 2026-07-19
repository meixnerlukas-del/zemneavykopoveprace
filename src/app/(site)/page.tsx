import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { REGIONS, districtProfileSlug } from "@/lib/districts";
import type { DistrictPoint } from "@/lib/geo";
import DistrictMap from "@/components/DistrictMap";
import { getBlockHtml } from "@/lib/pageContent";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const districts = await prisma.district.findMany({
    orderBy: { code: "asc" },
    include: { profile: { select: { status: true, displayName: true } } },
  });

  const points: DistrictPoint[] = districts
    .filter((d) => d.lat !== null && d.lng !== null)
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      region: d.region,
      lat: d.lat as number,
      lng: d.lng as number,
      occupied: d.profile?.status === "PUBLISHED",
      displayName: d.profile?.displayName ?? null,
    }));

  const occupiedCount = points.filter((p) => p.occupied).length;
  const heroHtml = await getBlockHtml("home_hero");

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zemné a výkopové práce — Metraco s.r.o.",
    url: "https://www.zemneavykopoveprace.sk",
    email: "metracosro@gmail.com",
    telephone: "+421944208204",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dolné Obdokovce 64",
      postalCode: "951 02",
      addressCountry: "SK",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {/* HERO */}
      <section className="bg-asphalt text-paper">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <p className="text-sm uppercase tracking-[0.08em] text-jcb">
            Zemné a výkopové práce · celé Slovensko
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl uppercase leading-[1.05] sm:text-5xl md:text-6xl">
            Nájdite firmu vo svojom okrese a zavolajte jej
          </h1>
          <div
            className="mt-6 max-w-xl text-lg text-paper/80 [&_a]:text-jcb [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: heroHtml }}
          />
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/okresy"
              className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink transition-opacity hover:opacity-90"
            >
              Vybrať okres
            </Link>
            <Link
              href="/spolupraca"
              className="border border-paper/30 px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-paper transition-colors hover:border-jcb hover:text-jcb"
            >
              Chcem svoj okres
            </Link>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section className="bg-concrete">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="section-title text-2xl">Mapa okresov</h2>
          <p className="mb-8 max-w-2xl text-muted">
            Kliknite na svoj okres na mape, alebo si nechajte nájsť najbližšieho
            zhotoviteľa podľa vašej polohy.
          </p>
          <DistrictMap points={points} />
        </div>
      </section>

      {/* ZOZNAM OKRESOV — mobilná alternatíva mapy + SEO prelinkovanie */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="section-title text-2xl">Okresy podľa krajov</h2>
          <div className="mt-8 space-y-10">
            {REGIONS.map((region) => (
              <div key={region}>
                <h3 className="mb-3 text-sm uppercase tracking-[0.08em] text-muted">
                  {region}
                </h3>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                  {points
                    .filter((p) => p.region === region)
                    .map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/${districtProfileSlug(p.slug)}`}
                          className="group flex items-center gap-2 py-1"
                        >
                          <span
                            className="inline-block h-2.5 w-2.5"
                            style={{
                              background: p.occupied ? "#F2B01E" : "#C4C2BC",
                            }}
                            aria-hidden
                          />
                          <span className="group-hover:text-jcb">{p.name}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PÁS: VÁŠ OKRES JE EŠTE VOĽNÝ? */}
      <section className="bg-jcb text-jcb-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl uppercase tracking-[0.04em]">
              Váš okres je ešte voľný?
            </h2>
            <p className="mt-1 text-jcb-ink/80">
              {occupiedCount} z {points.length} okresov je obsadených ·
              exkluzivita · 196,80 € s DPH / rok · zľava 25 % na každý ďalší
              okres.
            </p>
          </div>
          <Link
            href="/spolupraca"
            className="whitespace-nowrap border-2 border-jcb-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] transition-colors hover:bg-jcb-ink hover:text-jcb"
          >
            Zobraziť voľné okresy
          </Link>
        </div>
      </section>
    </>
  );
}
