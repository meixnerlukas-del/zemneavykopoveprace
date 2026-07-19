import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(`lead:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Priveľa pokusov. Skúste o chvíľu." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot — ak je vyplnené skryté pole, tvárime sa úspešne (bot)
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const districtSlug =
    typeof body.districtSlug === "string" ? body.districtSlug : null;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Vyplňte meno, platný e-mail a správu." },
      { status: 422 },
    );
  }

  const district = districtSlug
    ? await prisma.district.findUnique({
        where: { slug: districtSlug },
        include: { profile: { include: { partner: true } } },
      })
    : null;

  // Cieľová adresa dopytu = e-mail z profilu, resp. e-mail partnera
  const targetEmail =
    district?.profile?.email ?? district?.profile?.partner?.email ?? null;

  const lead = await prisma.lead.create({
    data: {
      districtId: district?.id ?? null,
      name,
      email,
      phone,
      message,
      sentOk: false,
    },
  });

  let sentOk = false;
  if (targetEmail) {
    const res = await sendEmail({
      to: targetEmail,
      replyTo: email,
      subject: `Nový dopyt — ${district?.name ?? "zemné a výkopové práce"}`,
      html: `
        <h2>Nový dopyt z webu zemneavykopoveprace.sk</h2>
        <p><strong>Okres:</strong> ${district?.name ?? "-"}</p>
        <p><strong>Meno:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefón:</strong> ${escapeHtml(phone ?? "-")}</p>
        <p><strong>Správa:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    });
    sentOk = res.ok;
    if (res.ok) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { sentOk: true },
      });
    }
  }

  return NextResponse.json({ ok: true, delivered: sentOk });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
