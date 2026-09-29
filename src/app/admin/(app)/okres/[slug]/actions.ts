"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { ProfileStatus } from "@/lib/adminStatus";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Neautorizované");
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function num(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function date(fd: FormData, key: string): Date | null {
  const s = str(fd, key);
  return s ? new Date(s) : null;
}

async function profileIdBySlug(slug: string): Promise<string> {
  const d = await prisma.district.findUnique({
    where: { slug },
    include: { profile: { select: { id: true } } },
  });
  if (!d?.profile) throw new Error("Profil nenájdený");
  return d.profile.id;
}

// Predĺženie služby o 1 rok (od aktuálnej platnosti, alebo od dnes ak už expiroval/nie je).
export async function extendExpiry(slug: string) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);
  const p = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { expiresAt: true },
  });
  const now = new Date();
  const base = p?.expiresAt && p.expiresAt > now ? new Date(p.expiresAt) : now;
  base.setFullYear(base.getFullYear() + 1);
  await prisma.profile.update({ where: { id: profileId }, data: { expiresAt: base } });
  revalidatePath(`/admin/okres/${slug}`);
}

export async function updateProfile(slug: string, fd: FormData) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);

  // Voliteľné napojenie / vytvorenie partnera podľa companyName
  let partnerId: string | null | undefined = undefined;
  const companyName = str(fd, "partnerCompanyName");
  if (companyName) {
    const existing = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { partnerId: true },
    });
    if (existing?.partnerId) {
      await prisma.partner.update({
        where: { id: existing.partnerId },
        data: {
          companyName,
          ico: str(fd, "partnerIco") ?? "",
          dic: str(fd, "partnerDic"),
          icDph: str(fd, "partnerIcDph"),
          billingAddr: str(fd, "partnerBillingAddr") ?? "",
          phone: str(fd, "partnerPhone") ?? "",
          email: str(fd, "partnerEmail") ?? "",
        },
      });
      partnerId = existing.partnerId;
    } else {
      const p = await prisma.partner.create({
        data: {
          companyName,
          ico: str(fd, "partnerIco") ?? "",
          dic: str(fd, "partnerDic"),
          icDph: str(fd, "partnerIcDph"),
          billingAddr: str(fd, "partnerBillingAddr") ?? "",
          phone: str(fd, "partnerPhone") ?? "",
          email: str(fd, "partnerEmail") ?? "",
        },
      });
      partnerId = p.id;
    }
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      status: (str(fd, "status") ?? "FREE") as ProfileStatus,
      paidAt: date(fd, "paidAt"),
      expiresAt: date(fd, "expiresAt"),
      freeUpdateUsed: fd.get("freeUpdateUsed") === "on",
      displayName: str(fd, "displayName"),
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
      tagline: str(fd, "tagline"),
      aboutText: str(fd, "aboutText"),
      metaTitle: str(fd, "metaTitle"),
      metaDescription: str(fd, "metaDescription"),
      ...(partnerId !== undefined ? { partnerId } : {}),
    },
  });

  revalidatePath(`/admin/okres/${slug}`);
  revalidatePath(`/zemne-a-vykopove-prace-${slug}`);
}

export async function addService(slug: string, fd: FormData) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);
  await prisma.service.create({
    data: {
      profileId,
      title: str(fd, "title") ?? "Nová služba",
      description: str(fd, "description"),
      order: num(fd, "order") ?? 0,
    },
  });
  revalidatePath(`/admin/okres/${slug}`);
}

export async function addMachine(slug: string, fd: FormData) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);
  await prisma.machine.create({
    data: {
      profileId,
      name: str(fd, "name") ?? "Nový stroj",
      description: str(fd, "description"),
      imageUrl: str(fd, "imageUrl"),
      order: num(fd, "order") ?? 0,
    },
  });
  revalidatePath(`/admin/okres/${slug}`);
}

export async function addGalleryImage(slug: string, fd: FormData) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);
  const imageUrl = str(fd, "imageUrl");
  if (!imageUrl) return;
  await prisma.galleryItem.create({
    data: {
      profileId,
      imageUrl,
      caption: str(fd, "caption"),
      order: num(fd, "order") ?? 0,
    },
  });
  revalidatePath(`/admin/okres/${slug}`);
}

export async function addVideo(slug: string, fd: FormData) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);
  const url = str(fd, "url");
  if (!url) return;
  await prisma.videoItem.create({
    data: { profileId, url, title: str(fd, "title"), order: num(fd, "order") ?? 0 },
  });
  revalidatePath(`/admin/okres/${slug}`);
}

export async function addReview(slug: string, fd: FormData) {
  await requireAuth();
  const profileId = await profileIdBySlug(slug);
  await prisma.review.create({
    data: {
      profileId,
      author: str(fd, "author") ?? "Anonym",
      text: str(fd, "text") ?? "",
      rating: num(fd, "rating"),
      date: date(fd, "date") ?? new Date(),
    },
  });
  revalidatePath(`/admin/okres/${slug}`);
}

type ChildType = "service" | "machine" | "gallery" | "video" | "review";

export async function deleteChild(slug: string, type: ChildType, id: string) {
  await requireAuth();
  if (type === "service") await prisma.service.delete({ where: { id } });
  else if (type === "machine") await prisma.machine.delete({ where: { id } });
  else if (type === "gallery") await prisma.galleryItem.delete({ where: { id } });
  else if (type === "video") await prisma.videoItem.delete({ where: { id } });
  else if (type === "review") await prisma.review.delete({ where: { id } });
  revalidatePath(`/admin/okres/${slug}`);
}
