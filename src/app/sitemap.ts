import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { districtProfileSlug } from "@/lib/districts";

const SITE_URL = "https://www.zemneavykopoveprace.sk";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const districts = await prisma.district.findMany({
    select: { slug: true, profile: { select: { updatedAt: true } } },
    orderBy: { code: "asc" },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/okresy`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/spolupraca`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/objednavka`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/obchodne-podmienky`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/ochrana-osobnych-udajov`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const districtPages: MetadataRoute.Sitemap = districts.map((d) => ({
    url: `${SITE_URL}/${districtProfileSlug(d.slug)}`,
    lastModified: d.profile?.updatedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...districtPages];
}
