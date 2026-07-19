import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, OPERATOR_EMAIL } from "@/lib/email";

export const dynamic = "force-dynamic";

// Vercel Cron: nastav v vercel.json a chráň cez CRON_SECRET (Authorization: Bearer ...).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const day = 24 * 3600 * 1000;

  const notified: { district: string; days: number }[] = [];
  for (const target of [30, 7]) {
    const from = new Date(now.getTime() + target * day);
    const to = new Date(from.getTime() + day);
    const profiles = await prisma.profile.findMany({
      where: { status: "PUBLISHED", expiresAt: { gte: from, lt: to } },
      include: { district: true, partner: true },
    });
    for (const p of profiles) {
      await sendEmail({
        to: OPERATOR_EMAIL,
        subject: `Expirácia o ${target} dní — okres ${p.district.name}`,
        html: `
          <p>Profil okresu <strong>${p.district.name}</strong> (${p.displayName ?? p.partner?.companyName ?? "—"})
          expiruje o ${target} dní (${p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("sk-SK") : ""}).</p>
          <p>Kontaktujte partnera ohľadom predĺženia.</p>
        `,
      });
      notified.push({ district: p.district.name, days: target });
    }
  }

  // Auto-expirácia po dátume
  const expired = await prisma.profile.updateMany({
    where: { status: "PUBLISHED", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ ok: true, notified, expired: expired.count });
}
