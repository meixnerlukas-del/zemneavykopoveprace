import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STATUS_ORDER, STATUS_LABEL } from "@/lib/adminStatus";
import UploadInput from "@/components/admin/UploadInput";
import {
  updateProfile,
  addService,
  addMachine,
  addGalleryImage,
  addVideo,
  addReview,
  deleteChild,
  extendExpiry,
} from "./actions";

export const dynamic = "force-dynamic";

function dt(d: Date | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

const field = "w-full border border-concrete px-3 py-2 text-sm focus:border-jcb focus:outline-none";
const lbl = "mb-1 block text-sm uppercase tracking-[0.05em] text-muted";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const district = await prisma.district.findUnique({
    where: { slug },
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
  if (!district?.profile) notFound();
  const p = district.profile;
  const seo = `zemne-a-vykopove-prace-${slug}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-muted hover:text-jcb">← Okresy</Link>
          <h1 className="text-2xl uppercase">Okres {district.name}</h1>
        </div>
        <Link href={`/${seo}`} target="_blank" className="border border-asphalt px-4 py-2 text-sm uppercase tracking-[0.05em] hover:border-jcb hover:text-jcb">
          Zobraziť stránku ↗
        </Link>
      </div>

      {/* PREDĹŽENIE SLUŽBY */}
      <form action={extendExpiry.bind(null, slug)} className="mt-6 flex flex-wrap items-center gap-3 border border-jcb bg-paper p-4">
        <span className="text-sm">
          <strong>Platnosť služby do:</strong>{" "}
          {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("sk-SK") : "nenastavená"}
        </span>
        <button className="bg-jcb px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
          Predĺžiť o +1 rok
        </button>
        <span className="text-xs text-muted">(alebo nastav presný dátum nižšie v sekcii Stav a fakturácia)</span>
      </form>

      {/* HLAVNÝ FORMULÁR */}
      <form action={updateProfile.bind(null, slug)} className="mt-6 grid gap-6 bg-paper p-6">
        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2 text-sm uppercase tracking-[0.06em] text-jcb">Stav a fakturácia</legend>
          <label className="block">
            <span className={lbl}>Stav</span>
            <select name="status" defaultValue={p.status} className={field}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={lbl}>Zaplatené (paidAt)</span>
            <input type="date" name="paidAt" defaultValue={dt(p.paidAt)} className={field} />
          </label>
          <label className="block">
            <span className={lbl}>Expiruje (expiresAt)</span>
            <input type="date" name="expiresAt" defaultValue={dt(p.expiresAt)} className={field} />
          </label>
          <label className="col-span-full flex items-center gap-2 text-sm">
            <input type="checkbox" name="freeUpdateUsed" defaultChecked={p.freeUpdateUsed} />
            Bezplatná ročná aktualizácia už využitá
          </label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm uppercase tracking-[0.06em] text-jcb">Kontakt a profil</legend>
          <label className="block"><span className={lbl}>Zobrazovaný názov</span><input name="displayName" defaultValue={p.displayName ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Tagline</span><input name="tagline" defaultValue={p.tagline ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Telefón</span><input name="phone" defaultValue={p.phone ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>E-mail (cieľ dopytu)</span><input name="email" defaultValue={p.email ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Web</span><input name="websiteUrl" defaultValue={p.websiteUrl ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Facebook</span><input name="facebookUrl" defaultValue={p.facebookUrl ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>YouTube (kanál)</span><input name="youtubeUrl" defaultValue={p.youtubeUrl ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Adresa sídla</span><input name="addressLine" defaultValue={p.addressLine ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Zem. šírka (lat)</span><input name="lat" defaultValue={p.lat ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Zem. dĺžka (lng)</span><input name="lng" defaultValue={p.lng ?? ""} className={field} /></label>
          <div><UploadInput name="heroImageUrl" seo={`${seo}-hero`} defaultValue={p.heroImageUrl} label="Hero obrázok" /></div>
          <div><UploadInput name="logoUrl" seo={`${seo}-logo`} defaultValue={p.logoUrl} label="Logo" /></div>
          <label className="col-span-full block"><span className={lbl}>O nás</span><textarea name="aboutText" defaultValue={p.aboutText ?? ""} rows={5} className={field} /></label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm uppercase tracking-[0.06em] text-jcb">SEO</legend>
          <label className="block"><span className={lbl}>Meta title</span><input name="metaTitle" defaultValue={p.metaTitle ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Meta description</span><input name="metaDescription" defaultValue={p.metaDescription ?? ""} className={field} /></label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm uppercase tracking-[0.06em] text-jcb">Partner (fakturačné údaje)</legend>
          <label className="block"><span className={lbl}>Názov firmy</span><input name="partnerCompanyName" defaultValue={p.partner?.companyName ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>IČO</span><input name="partnerIco" defaultValue={p.partner?.ico ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>DIČ</span><input name="partnerDic" defaultValue={p.partner?.dic ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>IČ DPH</span><input name="partnerIcDph" defaultValue={p.partner?.icDph ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>Telefón partnera</span><input name="partnerPhone" defaultValue={p.partner?.phone ?? ""} className={field} /></label>
          <label className="block"><span className={lbl}>E-mail partnera</span><input name="partnerEmail" defaultValue={p.partner?.email ?? ""} className={field} /></label>
          <label className="col-span-full block"><span className={lbl}>Fakturačná adresa</span><input name="partnerBillingAddr" defaultValue={p.partner?.billingAddr ?? ""} className={field} /></label>
        </fieldset>

        <div>
          <button className="bg-jcb px-8 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
            Uložiť profil
          </button>
        </div>
      </form>

      {/* SLUŽBY */}
      <ChildSection title="Služby">
        <ul className="grid gap-2">
          {p.services.map((s) => (
            <li key={s.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span><strong>{s.title}</strong>{s.description ? ` — ${s.description}` : ""} <span className="text-muted">(#{s.order})</span></span>
              <DeleteBtn slug={slug} type="service" id={s.id} />
            </li>
          ))}
        </ul>
        <form action={addService.bind(null, slug)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end">
          <label><span className={lbl}>Názov</span><input name="title" required className={field} /></label>
          <label><span className={lbl}>Popis</span><input name="description" className={field} /></label>
          <label><span className={lbl}>Poradie</span><input name="order" type="number" defaultValue={0} className={field + " w-20"} /></label>
          <AddBtn />
        </form>
      </ChildSection>

      {/* VOZOVÝ PARK */}
      <ChildSection title="Vozový park">
        <ul className="grid gap-2">
          {p.machines.map((m) => (
            <li key={m.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span><strong>{m.name}</strong>{m.description ? ` — ${m.description}` : ""} <span className="text-muted">(#{m.order})</span></span>
              <DeleteBtn slug={slug} type="machine" id={m.id} />
            </li>
          ))}
        </ul>
        <form action={addMachine.bind(null, slug)} className="mt-3 grid gap-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <label><span className={lbl}>Názov</span><input name="name" required className={field} /></label>
            <label><span className={lbl}>Popis</span><input name="description" className={field} /></label>
            <label><span className={lbl}>Poradie</span><input name="order" type="number" defaultValue={0} className={field + " w-20"} /></label>
          </div>
          <UploadInput name="imageUrl" seo={`${seo}-stroj`} label="Foto stroja" />
          <AddBtn />
        </form>
      </ChildSection>

      {/* GALÉRIA */}
      <ChildSection title="Realizácie (galéria)">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {p.gallery.map((g) => (
            <li key={g.id} className="relative border border-concrete bg-paper p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.imageUrl} alt={g.caption ?? ""} className="aspect-square w-full object-cover" />
              <DeleteBtn slug={slug} type="gallery" id={g.id} compact />
            </li>
          ))}
        </ul>
        <form action={addGalleryImage.bind(null, slug)} className="mt-3 grid gap-2">
          <UploadInput name="imageUrl" seo={seo} label="Fotografia realizácie" />
          <div className="grid gap-2 sm:grid-cols-[2fr_auto_auto] sm:items-end">
            <label><span className={lbl}>Popis (alt)</span><input name="caption" className={field} /></label>
            <label><span className={lbl}>Poradie</span><input name="order" type="number" defaultValue={0} className={field + " w-20"} /></label>
            <AddBtn />
          </div>
        </form>
      </ChildSection>

      {/* VIDEO */}
      <ChildSection title="Video">
        <ul className="grid gap-2">
          {p.videos.map((v) => (
            <li key={v.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span>{v.title ?? v.url} <span className="text-muted">— {v.url}</span></span>
              <DeleteBtn slug={slug} type="video" id={v.id} />
            </li>
          ))}
        </ul>
        <form action={addVideo.bind(null, slug)} className="mt-3 grid gap-2 sm:grid-cols-[2fr_2fr_auto] sm:items-end">
          <label><span className={lbl}>YouTube URL</span><input name="url" required className={field} /></label>
          <label><span className={lbl}>Titulok</span><input name="title" className={field} /></label>
          <AddBtn />
        </form>
      </ChildSection>

      {/* RECENZIE */}
      <ChildSection title="Recenzie">
        <ul className="grid gap-2">
          {p.reviews.map((r) => (
            <li key={r.id} className="flex items-center justify-between border border-concrete bg-paper p-3">
              <span>{r.rating ? "★".repeat(r.rating) + " " : ""}<strong>{r.author}</strong>: {r.text}</span>
              <DeleteBtn slug={slug} type="review" id={r.id} />
            </li>
          ))}
        </ul>
        <form action={addReview.bind(null, slug)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end">
          <label><span className={lbl}>Autor</span><input name="author" required className={field} /></label>
          <label><span className={lbl}>Text</span><input name="text" required className={field} /></label>
          <label><span className={lbl}>Hviezdy 1–5</span><input name="rating" type="number" min={1} max={5} className={field + " w-20"} /></label>
          <AddBtn />
        </form>
      </ChildSection>
    </div>
  );
}

function ChildSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 border-b-2 border-asphalt pb-1 text-lg uppercase tracking-[0.05em]">{title}</h2>
      {children}
    </section>
  );
}

function AddBtn() {
  return (
    <button className="h-fit bg-asphalt px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-paper hover:bg-asphalt-2">
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
  type: "service" | "machine" | "gallery" | "video" | "review";
  id: string;
  compact?: boolean;
}) {
  return (
    <form action={deleteChild.bind(null, slug, type, id)}>
      <button
        className={
          compact
            ? "absolute right-1 top-1 bg-asphalt/80 px-2 text-paper hover:text-jcb"
            : "text-sm text-red-700 hover:underline"
        }
        aria-label="Odstrániť"
      >
        {compact ? "×" : "Odstrániť"}
      </button>
    </form>
  );
}
