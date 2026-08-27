// Partnerská session (cookies). Token/vlastníctvo logika je v partnerTokens.ts.
import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomToken, hashToken, SESSION_TTL_MS } from "@/lib/partnerTokens";

const COOKIE = "partner_session";

/** Vytvorí session a nastaví httpOnly cookie. */
export async function startSession(partnerId: string): Promise<void> {
  const token = randomToken();
  await prisma.partnerSession.create({
    data: { partnerId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/** Vráti prihláseného partnera (podľa cookie) alebo null. */
export async function getPartner() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const sess = await prisma.partnerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { partner: true },
  });
  if (!sess || sess.expiresAt < new Date()) return null;
  return sess.partner;
}

/** Odhlásenie — zmaže session aj cookie. */
export async function endSession(): Promise<void> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (token) {
    await prisma.partnerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    c.delete(COOKIE);
  }
}
