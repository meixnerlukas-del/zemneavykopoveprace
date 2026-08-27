import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { createMagicLinkToken } from "@/lib/partnerTokens";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://www.zemneavykopoveprace.sk";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!rateLimit(`partner-login:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Priveľa pokusov. Skúste o chvíľu." }, { status: 429 });
  }

  let email = "";
  try {
    const body = await req.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Zadajte platný e-mail." }, { status: 422 });
  }

  // Neprezrádzame existenciu účtu — odpoveď je vždy rovnaká.
  const partner = await prisma.partner.findUnique({ where: { loginEmail: email } });
  if (partner) {
    const token = await createMagicLinkToken(partner.id);
    const url = `${SITE_URL}/api/partner/verify?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Prihlásenie do vášho profilu — zemneavykopoveprace.sk",
      html: `
        <h2>Prihlásenie do profilu</h2>
        <p>Kliknutím na tlačidlo sa prihlásite a môžete upraviť svoj profil:</p>
        <p><a href="${url}" style="display:inline-block;background:#F2B01E;color:#412402;padding:12px 24px;text-decoration:none;font-weight:600">Prihlásiť sa</a></p>
        <p style="font-size:12px;color:#7A7C7E">Odkaz je platný 30 minút. Ak ste o prihlásenie nežiadali, tento e-mail ignorujte.</p>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
