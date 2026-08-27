import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPartner } from "@/lib/partnerAuth";
import { getOwnedProfileBySlug } from "@/lib/partnerTokens";
import UploadInput from "@/components/admin/UploadInput";
import {
  savePartnerProfile,
  addPartnerService,
  addPartnerMachine,
  addPartnerGallery,
  addPartnerVideo,
  deletePartnerChild,
  togglePartnerPublish,
} from "./actions";

export const dynamic = "force-dynamic";

const field = "w-full border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none";
const lbl = "mb-1 block text-sm uppercase tracking-[0.05em] text-muted";

export default async function PartnerEditProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await getPartner();
  if (!partner) redirect("/partner");
  const owned = await getOwnedProfileBySlug(partner.id, slug);
  if (!owned) redirect("/partner/profily");

  const profile = await prisma.profile.findUnique({
    where: { id: owned.profile.id },
    include: {
      district: true,
      services: { orderBy: { order: "asc" } },
      machines: { orderBy: { order: "asc" } },
      gallery: { orderBy: { order: "asc" } },
      videos: { orderBy: { order: "asc" } },
    },
  });
  if (!profile) redirect("/partner/profily");

  const seo = `zemne-a-vykopove-prace-${profile.district.slug}`;
  const published = profile.status === "PUBLISHED";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/partner/profily" className="text-sm text-jcb">← Vaše okresy</Link>
          <h1 className="text-3xl uppercase">{profile.district.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm uppercase tracking-[0.05em] ${published ? "text-jcb" : "text-muted"}`}>
            {published ? "Zverejnený" : "Nezverejnený"}
          </span>
          {published && (
            <Link href={`/${seo}`} target="_blank" className="border border-asphalt px-4 py-2 text-sm uppercase hover:bg-asphalt hover:text-paper">
              Zobraziť
            </Link>
          )}
        </div>
      </div>

      {/* Hlavné údaje */}
      <form action={savePartnerProfile.bind(null, slug)} className="space-y-4 bg-paper p-6">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm uppercase tracking-[0.06em] text-jcb">Kontakt a profil</legend>
          <label className="block"><span className={lbl}>Zobrazovaný názov</span><input name="displayName" defaultValue={profile.displayName ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Tagline (krátky popis)</span><input name="tagline" defaultValue={profile.tagline ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Telefón</span><input name="phone" defaultValue={profile.phone ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>E-mail (cieľ dopytu)</span><input name="email" defaultValue={profile.email ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Web</span><input name="websiteUrl" defaultValue={profile.websiteUrl ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Facebook</span><input name="facebookUrl" defaultValue={profile.facebookUrl ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>YouTube (kanál)</span><input name="youtubeUrl" defaultValue={profile.youtubeUrl ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Adresa sídla</span><input name="addressLine" defaultValue={profile.addressLine ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Zem. šírka (lat)</span><input name="lat" defaultValue={profile.lat ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Zem. dĺžka (lng)</span><input name="lng" defaultValue={profile.lng ?? ""} className={field} /></label>
          <div><UploadInput name="heroImageUrl" seo={`${seo}-hero`} defaultValue={profile.heroImageUrl} label="Hero obrázok (pozadie)" endpoint="/api/partner/upload" /></div>
          <div><UploadInput name="logoUrl" seo={`${seo}-logo`} defaultValue={profile.logoUrl} label="Logo" endpoint="/api/partner/upload" /></div>
          <label className="col-span-full block"><span className={lbl}>O nás</span><textarea name="aboutText" defaultValue={profile.aboutText ?? ""} rows={5} className={field} /></label>
          <label className="block"><span className={lbl}>SEO titulok</span><input name="metaTitle" defaultValue={profile.metaTitle ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>SEO popis</span><input name="metaDescription" defaultValue={profile.metaDescription ?? ""} className={field} /></label>
        </fieldset>
        <button className="bg-jcb px-8 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
          Uložiť profil
        </button>
      </form>

      {/* Služby */}
      <ChildSection title="Služby">
        <ul className="grid gap-2">
          {profile.services.map((s) => (
            <li key={s.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span><strong>{s.title}</strong>{s.description ? ` — ${s.description}` : ""}</span>
              <DeleteBtn slug={slug} type="service" id={s.id} />
            </li>
          ))}
        </ul>
        <form action={addPartnerService.bind(null, slug)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <label><span className={lbl}>Názov</span><input name="title" required className={field} /></label>
          <label><span className={lbl}>Popis</span><input name="description" className={field} /></label>
          <AddBtn />
        </form>
      </ChildSection>

      {/* Vozový park */}
      <ChildSection title="Vozový park">
        <ul className="grid gap-2">
          {profile.machines.map((m) => (
            <li key={m.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span><strong>{m.name}</strong>{m.description ? ` — ${m.description}` : ""}</span>
              <DeleteBtn slug={slug} type="machine" id={m.id} />
            </li>
          ))}
        </ul>
        <form action={addPartnerMachine.bind(null, slug)} className="mt-3 grid gap-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
            <label><span className={lbl}>Názov</span><input name="name" required className={field} /></label>
            <label><span className={lbl}>Popis</span><input name="description" className={field} /></label>
          </div>
          <UploadInput name="imageUrl" seo={`${seo}-stroj`} label="Foto stroja" endpoint="/api/partner/upload" />
          <AddBtn />
        </form>
      </ChildSection>

      {/* Galéria */}
      <ChildSection title="Realizácie (galéria)">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {profile.gallery.map((g) => (
            <li key={g.id} className="relative border border-concrete bg-paper p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.imageUrl} alt={g.caption ?? ""} className="aspect-square w-full object-cover" />
              <DeleteBtn slug={slug} type="gallery" id={g.id} compact />
            </li>
          ))}
        </ul>
        <form action={addPartnerGallery.bind(null, slug)} className="mt-3 grid gap-2">
          <UploadInput name="imageUrl" seo={seo} label="Fotografia realizácie" endpoint="/api/partner/upload" />
          <div className="grid gap-2 sm:grid-cols-[2fr_auto]">
            <label><span className={lbl}>Popis (alt)</span><input name="caption" className={field} /></label>
            <AddBtn />
          </div>
        </form>
      </ChildSection>

      {/* Videá */}
      <ChildSection title="Videá (YouTube)">
        <ul className="grid gap-2">
          {profile.videos.map((v) => (
            <li key={v.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span>{v.title ? `${v.title} — ` : ""}{v.url}</span>
              <DeleteBtn slug={slug} type="video" id={v.id} />
            </li>
          ))}
        </ul>
        <form action={addPartnerVideo.bind(null, slug)} className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <label><span className={lbl}>YouTube URL</span><input name="url" required className={field} /></label>
          <label><span className={lbl}>Titulok</span><input name="title" className={field} /></label>
          <AddBtn />
        </form>
      </ChildSection>

      {/* Zverejnenie */}
      <div className="border border-jcb bg-paper p-6">
        <h2 className="text-xl uppercase">Zverejnenie profilu</h2>
        <p className="mt-2 text-sm text-muted">
          {published
            ? "Váš profil je zverejnený a viditeľný na webe. Môžete ho dočasne stiahnuť."
            : "Keď máte profil vyplnený, zverejnite ho — objaví sa na webe a v katalógu okresov."}
        </p>
        <form action={togglePartnerPublish.bind(null, slug)} className="mt-4">
          <button className={`px-8 py-3 text-sm font-medium uppercase tracking-[0.05em] ${published ? "border border-asphalt hover:bg-asphalt hover:text-paper" : "bg-jcb text-jcb-ink hover:opacity-90"}`}>
            {published ? "Stiahnuť z webu" : "Zverejniť profil"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ChildSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-paper p-6">
      <h2 className="section-title text-xl uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AddBtn() {
  return (
    <button className="self-end bg-asphalt px-4 py-2 text-sm uppercase tracking-[0.05em] text-paper hover:opacity-90">
      Pridať
    </button>
  );
}

function DeleteBtn({
  slug,
  type,
  id,
  compact,
}: {
  slug: string;
  type: "service" | "machine" | "gallery" | "video";
  id: string;
  compact?: boolean;
}) {
  return (
    <form action={deletePartnerChild.bind(null, slug, type, id)}>
      <button
        className={compact
          ? "absolute right-1 top-1 bg-asphalt px-2 py-0.5 text-xs text-paper hover:bg-red-700"
          : "border border-asphalt px-3 py-1 text-xs uppercase hover:bg-red-700 hover:text-paper hover:border-red-700"}
        aria-label="Zmazať"
      >
        {compact ? "×" : "Zmazať"}
      </button>
    </form>
  );
}
