// Tokeny a vlastníctvo profilov — bez cookies (aby sa dalo importovať aj mimo Next runtime,
// napr. v provisioning-u a testoch). Session/cookie logika je v partnerAuth.ts.
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const MAGIC_TTL_MS = 30 * 60 * 1000; // 30 minút
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dní

export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
export function hashToken(t: string): string {
  return crypto.createHash("sha256").update(t).digest("hex");
}

/** Vytvorí magic-link token pre partnera a vráti PLAINTEXT (do e-mailového odkazu). */
export async function createMagicLinkToken(partnerId: string): Promise<string> {
  const token = randomToken();
  await prisma.partnerLoginToken.create({
    data: { partnerId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + MAGIC_TTL_MS) },
  });
  return token;
}

/** Overí a spotrebuje magic-link token. Vráti partnerId alebo null. */
export async function consumeMagicLink(token: string): Promise<string | null> {
  if (!token) return null;
  const rec = await prisma.partnerLoginToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) return null;
  await prisma.partnerLoginToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
  return rec.partnerId;
}

/** Overí, že partner vlastní profil daného okresu. Vráti { district, profile } alebo null. */
export async function getOwnedProfileBySlug(partnerId: string, districtSlug: string) {
  const district = await prisma.district.findUnique({
    where: { slug: districtSlug },
    include: { profile: true },
  });
  if (!district?.profile || district.profile.partnerId !== partnerId) return null;
  return { district, profile: district.profile };
}
