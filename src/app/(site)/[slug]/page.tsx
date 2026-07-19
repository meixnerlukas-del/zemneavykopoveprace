import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  districtSlugFromProfileSlug,
  districtProfileSlug,
  youtubeId,
} from "@/lib/districts";
import SeatMap from "@/components/SeatMap";
import Gallery from "@/components/Gallery";
import InquiryForm from "@/components/InquiryForm";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.zemneavykopoveprace.sk";

type Params = { params: Promise<{ slug: string }> };

async function getDistrict(fullSlug: string) {
  const districtSlug = districtSlugFromProfileSlug(fullSlug);
  if (!districtSlug) return null;
  return prisma.district.findUnique({
    where: { slug: districtSlug },
    include: {
      profile: {
        include: {
          partner: true,
          services: { orderBy: { order: "asc" } },
          machines: { orderBy: { order: "asc" } },
          gallery: { orderBy: { order: "asc" } },
          videos: { orderBy: { order: "asc" } },
          reviews: { orderBy: { date: "desc" } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  const district = await getDistrict(slug);
  if (!district) return { title: "Okres nenájdený" };

  const p = district.profile;
  const title =
    p?.metaTitle ??
    `Zemné a výkopové práce ${district.name} | výkop, doprava kameniva, bager`;
  const description =
    p?.metaDescription ??
    `Zemné a výkopové práce v okrese ${district.name}. Nájdite firmu vo svojom okrese a zavolajte jej, alebo si voľný okres zarezervujte.`;
  const url = `${SITE_URL}/${districtProfileSlug(district.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function DistrictProfilePage({ params }: Params) {
  const { slug } = await params;
  const district = await getDistrict(slug);
  if (!district) notFound();

  const profile = district.profile;
  const published = profile?.status === "PUBLISHED";

  const neighbors = await prisma.district.findMany({
    where: { region: district.region, id: { not: district.id } },
    orderBy: { name: "asc" },
    take: 8,
    select: { name: true, slug: true },
  });

  // JSON-LD
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Okresy", item: `${SITE_URL}/okresy` },
      {
        "@type": "ListItem",
        position: 3,
        name: `Zemné a výkopové práce ${district.name}`,
        item: `${SITE_URL}/${districtProfileSlug(district.slug)}`,
      },
    ],
  };
  const localBusiness =
    published && profile
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: profile.displayName ?? `Zemné a výkopové práce ${district.name}`,
          telephone: profile.phone ?? undefined,
          email: profile.email ?? undefined,
          url: `${SITE_URL}/${districtProfileSlug(district.slug)}`,
          address: profile.addressLine
            ? { "@type": "PostalAddress", streetAddress: profile.addressLine }
            : undefined,
          geo:
            profile.lat && profile.lng
              ? { "@type": "GeoCoordinates", latitude: profile.lat, longitude: profile.lng }
              : undefined,
          areaServed: `Okres ${district.name}`,
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {localBusiness && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      )}

      {/* 1 HERO */}
      <section className="relative bg-asphalt text-paper">
        {published && profile?.heroImageUrl && (
          <Image
            src={profile.heroImageUrl}
            alt={`Zemné a výkopové práce ${district.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <p className="text-sm uppercase tracking-[0.08em] text-jcb">
            {district.region} · Okres {district.name}
          </p>
          <h1 className="mt-3 text-4xl uppercase leading-[1.05] sm:text-5xl md:text-6xl">
            Zemné a výkopové práce {district.name}
          </h1>
          {published && profile?.tagline && (
            <p className="mt-4 text-lg text-paper/80">{profile.tagline}</p>
          )}
        </div>
      </section>

      {published && profile ? (
        <PublishedProfile
          district={district}
          profile={profile}
          neighbors={neighbors}
        />
      ) : (
        <FreeDistrict district={district} neighbors={neighbors} />
      )}
    </>
  );
}

/* ---------------- PUBLISHED ---------------- */
function PublishedProfile({
  district,
  profile,
  neighbors,
}: {
  district: { name: string; slug: string };
  profile: NonNullable<Awaited<ReturnType<typeof getDistrict>>>["profile"];
  neighbors: { name: string; slug: string }[];
}) {
  if (!profile) return null;
  const initials = (profile.displayName ?? "?").slice(0, 2).toUpperCase();
  const firstVideoId = profile.videos[0]
    ? youtubeId(profile.videos[0].url)
    : null;

  return (
    <>
      {/* 2 KONTAKTNÝ PRUH */}
      <div className="sticky top-[64px] z-40 border-b border-concrete bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={profile.displayName ?? ""}
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center bg-asphalt text-sm font-medium text-jcb">
                {initials}
              </span>
            )}
            <div>
              <p className="font-medium">{profile.displayName}</p>
              {profile.tagline && (
                <p className="text-xs text-muted">{profile.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="#dopyt"
              className="border-2 border-asphalt px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-asphalt hover:border-jcb hover:text-jcb"
            >
              Napísať
            </a>
            {profile.phone && (
              <a
                href={`tel:${profile.phone.replace(/\s/g, "")}`}
                className="bg-jcb px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90"
              >
                Zavolať
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3 O NÁS + SÍDLO */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-2xl">O nás</h2>
            <p className="whitespace-pre-line text-asphalt/90">
              {profile.aboutText}
            </p>
          </div>
          {profile.lat && profile.lng && (
            <div>
              <h2 className="section-title text-2xl">Sídlo</h2>
              {profile.addressLine && (
                <p className="mb-3 text-muted">{profile.addressLine}</p>
              )}
              <SeatMap
                lat={profile.lat}
                lng={profile.lng}
                label={profile.displayName ?? district.name}
              />
            </div>
          )}
        </div>
      </section>

      {/* 4 SLUŽBY */}
      {profile.services.length > 0 && (
        <section className="bg-concrete-2">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="section-title text-2xl">Služby</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {profile.services.map((s) => (
                <div key={s.id} className="service-card p-5">
                  <h3 className="text-lg">{s.title}</h3>
                  {s.description && (
                    <p className="mt-2 text-sm text-muted">{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5 VOZOVÝ PARK */}
      {profile.machines.length > 0 && (
        <section className="bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="section-title text-2xl">Vozový park</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.machines.map((m) => (
                <div key={m.id} className="border border-concrete">
                  {m.imageUrl && (
                    <div className="relative aspect-[3/2] w-full bg-concrete">
                      <Image
                        src={m.imageUrl}
                        alt={`${m.name} — zemné a výkopové práce ${district.name}`}
                        fill
                        sizes="(max-width:640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg">{m.name}</h3>
                    {m.description && (
                      <p className="mt-1 text-sm text-muted">{m.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6 REALIZÁCIE */}
      {profile.gallery.length > 0 && (
        <section className="bg-concrete-2">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="section-title text-2xl">Realizácie</h2>
            <Gallery
              images={profile.gallery.map((g) => ({
                url: g.imageUrl,
                caption: g.caption,
              }))}
            />
          </div>
        </section>
      )}

      {/* 7 VIDEO */}
      {firstVideoId && (
        <section className="bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="section-title text-2xl">Video</h2>
            <div className="relative aspect-video w-full max-w-3xl bg-asphalt">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${firstVideoId}`}
                title={profile.videos[0].title ?? "Video"}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* 8 RECENZIE */}
      {profile.reviews.length > 0 && (
        <section className="bg-concrete-2">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="section-title text-2xl">Recenzie</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.reviews.map((r) => (
                <blockquote key={r.id} className="border-l-[3px] border-jcb bg-paper p-5">
                  {r.rating && (
                    <p className="text-jcb" aria-label={`${r.rating} z 5`}>
                      {"★".repeat(r.rating)}
                      <span className="text-muted">{"★".repeat(5 - r.rating)}</span>
                    </p>
                  )}
                  <p className="mt-2 text-asphalt/90">{r.text}</p>
                  <footer className="mt-3 text-sm text-muted">— {r.author}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9 KONTAKTY A SIETE */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="section-title text-2xl">Kontakt</h2>
          <ul className="grid gap-2 text-asphalt/90 sm:grid-cols-2">
            {profile.phone && (
              <li>
                Telefón:{" "}
                <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="text-jcb hover:underline">
                  {profile.phone}
                </a>
              </li>
            )}
            {profile.email && (
              <li>
                E-mail:{" "}
                <a href={`mailto:${profile.email}`} className="text-jcb hover:underline">
                  {profile.email}
                </a>
              </li>
            )}
            {profile.websiteUrl && (
              <li>
                Web:{" "}
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-jcb hover:underline">
                  {profile.websiteUrl}
                </a>
              </li>
            )}
            {profile.facebookUrl && (
              <li>
                Facebook:{" "}
                <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-jcb hover:underline">
                  {profile.facebookUrl}
                </a>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* 10 DOPYTOVÝ FORMULÁR */}
      <section id="dopyt" className="bg-asphalt text-paper">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-6 inline-block border-b-2 border-jcb pb-2 text-2xl uppercase tracking-[0.05em] text-paper">
            Napíšte firme
          </h2>
          <InquiryForm districtSlug={district.slug} districtName={district.name} />
        </div>
      </section>

      <NeighborDistricts district={district} neighbors={neighbors} />
    </>
  );
}

/* ---------------- FREE ---------------- */
function FreeDistrict({
  district,
  neighbors,
}: {
  district: { name: string; slug: string };
  neighbors: { name: string; slug: string }[];
}) {
  return (
    <>
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="inline-block bg-concrete px-3 py-1 text-sm uppercase tracking-[0.06em] text-muted">
            Voľný okres
          </p>
          <h2 className="mt-6 text-3xl uppercase">Okres {district.name} je voľný</h2>
          <p className="mt-4 text-muted">
            V tomto okrese zatiaľ nemáme partnera. Získajte exkluzívne miesto —
            jedna firma na okres, žiadna konkurencia, žiadne cudzie reklamy.
          </p>
          <p className="mt-6 text-2xl font-medium text-asphalt">
            196,80 € s DPH / rok
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/objednavka"
              className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90"
            >
              Objednať okres {district.name}
            </Link>
            <Link
              href="/spolupraca"
              className="border-2 border-asphalt px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-asphalt hover:border-jcb hover:text-jcb"
            >
              Viac o spolupráci
            </Link>
          </div>
        </div>
      </section>
      <NeighborDistricts district={district} neighbors={neighbors} />
    </>
  );
}

function NeighborDistricts({
  district,
  neighbors,
}: {
  district: { name: string };
  neighbors: { name: string; slug: string }[];
}) {
  if (neighbors.length === 0) return null;
  return (
    <section className="bg-concrete">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-4 text-sm uppercase tracking-[0.08em] text-muted">
          Zemné a výkopové práce v okolí okresu {district.name}
        </h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {neighbors.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/${districtProfileSlug(n.slug)}`}
                className="text-asphalt hover:text-jcb"
              >
                {n.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
