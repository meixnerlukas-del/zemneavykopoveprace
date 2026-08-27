"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPartner } from "@/lib/partnerAuth";
import { getOwnedProfileBySlug } from "@/lib/partnerTokens";

async function requireOwned(slug: string) {
  const partner = await getPartner();
  if (!partner) throw new Error("Neautorizované");
  const owned = await getOwnedProfileBySlug(partner.id, slug);
  if (!owned) throw new Error("Nemáte prístup k tomuto profilu");
  return owned.profile;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function num(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Uloženie obsahových polí profilu. Zakázané polia (status, cena, fakturácia) sa neberú.
export async function savePartnerProfile(slug: string, fd: FormData) {
  const profile = await requireOwned(slug);
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      displayName: str(fd, "displayName"),
      tagline: str(fd, "tagline"),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      websiteUrl: str(fd, "websiteUrl"),
      facebookUrl: str(fd, "facebookUrl"),
      youtubeUrl: str(fd, "youtubeUrl"),
      addressLine: str(fd, "addressLine"),
      lat: num(fd, "lat"),
      lng: num(fd, "lng"),
      heroImageUrl: str(fd, "heroImageUrl"),
      logoUrl: str(fd, "logoUrl"),
      aboutText: str(fd, "aboutText"),
      metaTitle: str(fd, "metaTitle"),
      metaDescription: str(fd, "metaDescription"),
    },
  });
  revalidatePath(`/partner/profil/${slug}`);
}

export async function addPartnerService(slug: string, fd: FormData) {
  const profile = await requireOwned(slug);
  const title = str(fd, "title");
  if (!title) return;
  await prisma.service.create({
    data: { profileId: profile.id, title, description: str(fd, "description"), order: num(fd, "order") ?? 0 },
  });
  revalidatePath(`/partner/profil/${slug}`);
}

export async function addPartnerMachine(slug: string, fd: FormData) {
  const profile = await requireOwned(slug);
  const name = str(fd, "name");
  if (!name) return;
  await prisma.machine.create({
    data: {
      profileId: profile.id,
      name,
      description: str(fd, "description"),
      imageUrl: str(fd, "imageUrl"),
      order: num(fd, "order") ?? 0,
    },
  });
  revalidatePath(`/partner/profil/${slug}`);
}

export async function addPartnerGallery(slug: string, fd: FormData) {
  const profile = await requireOwned(slug);
  const imageUrl = str(fd, "imageUrl");
  if (!imageUrl) return;
  await prisma.galleryItem.create({
    data: { profileId: profile.id, imageUrl, caption: str(fd, "caption"), order: num(fd, "order") ?? 0 },
  });
  revalidatePath(`/partner/profil/${slug}`);
}

export async function addPartnerVideo(slug: string, fd: FormData) {
  const profile = await requireOwned(slug);
  const url = str(fd, "url");
  if (!url) return;
  await prisma.videoItem.create({
    data: { profileId: profile.id, url, title: str(fd, "title"), order: num(fd, "order") ?? 0 },
  });
  revalidatePath(`/partner/profil/${slug}`);
}

// Zmazanie child záznamu — s kontrolou, že patrí profilu partnera.
export async function deletePartnerChild(
  slug: string,
  type: "service" | "machine" | "gallery" | "video",
  id: string,
) {
  const profile = await requireOwned(slug);
  if (type === "service") await prisma.service.deleteMany({ where: { id, profileId: profile.id } });
  else if (type === "machine") await prisma.machine.deleteMany({ where: { id, profileId: profile.id } });
  else if (type === "gallery") await prisma.galleryItem.deleteMany({ where: { id, profileId: profile.id } });
  else if (type === "video") await prisma.videoItem.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath(`/partner/profil/${slug}`);
}

// Zverejnenie / stiahnutie profilu (len medzi PENDING_CONTENT a PUBLISHED).
export async function togglePartnerPublish(slug: string) {
  const profile = await requireOwned(slug);
  if (profile.status === "PENDING_CONTENT") {
    await prisma.profile.update({ where: { id: profile.id }, data: { status: "PUBLISHED" } });
  } else if (profile.status === "PUBLISHED") {
    await prisma.profile.update({ where: { id: profile.id }, data: { status: "PENDING_CONTENT" } });
  }
  revalidatePath(`/partner/profil/${slug}`);
  revalidatePath(`/okresy`);
}
