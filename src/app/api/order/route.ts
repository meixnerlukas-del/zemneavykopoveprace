import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, OPERATOR_EMAIL } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { computeOrderTotal, formatEur } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(`order:${ip}`, 5, 10 * 60 * 1000)) {
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

  // Honeypot
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const contactName = s("contactName") || null;
  const companyName = s("companyName");
  const ico = s("ico");
  const dic = s("dic") || null;
  const icDph = s("icDph") || null;
  const billingAddr = s("billingAddr");
  const phone = s("phone");
  const email = s("email");
  const note = s("note") || null;
  const termsAccepted = body.termsAccepted === true;
  const districtSlugs = Array.isArray(body.districts)
    ? (body.districts as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  if (
    !companyName ||
    !ico ||
    !billingAddr ||
    !phone ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    districtSlugs.length === 0
  ) {
    return NextResponse.json(
      { ok: false, error: "Vyplňte povinné polia a vyberte aspoň jeden okres." },
      { status: 422 },
    );
  }
  if (!termsAccepted) {
    return NextResponse.json(
      { ok: false, error: "Bez súhlasu s obchodnými podmienkami nemôžeme objednávku prijať." },
      { status: 422 },
    );
  }

  // Len skutočne VOĽNÉ okresy (FREE)
  const districts = await prisma.district.findMany({
    where: { slug: { in: districtSlugs } },
    include: { profile: { select: { id: true, status: true } } },
  });
  const freeDistricts = districts.filter((d) => d.profile?.status === "FREE");
  if (freeDistricts.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Vybrané okresy už nie sú voľné." },
      { status: 409 },
    );
  }

  const total = computeOrderTotal(freeDistricts.length);
  const districtNames = freeDistricts.map((d) => d.name).join(", ");

  const order = await prisma.order.create({
    data: {
      contactName,
      companyName,
      ico,
      dic,
      icDph,
      billingAddr,
      phone,
      email,
      districts: freeDistricts.map((d) => d.slug).join(","),
      note,
      termsAccepted,
    },
  });

  // Rezervuj vybrané okresy → PENDING_PAYMENT
  await prisma.profile.updateMany({
    where: { id: { in: freeDistricts.map((d) => d.profile!.id) } },
    data: { status: "PENDING_PAYMENT" },
  });

  // E-mail operátorovi
  await sendEmail({
    to: OPERATOR_EMAIL,
    replyTo: email,
    subject: `Nová objednávka — ${companyName} (${freeDistricts.length} okres/y)`,
    html: `
      <h2>Nová objednávka</h2>
      <p><strong>Firma:</strong> ${esc(companyName)} (IČO ${esc(ico)}${dic ? ", DIČ " + esc(dic) : ""}${icDph ? ", IČ DPH " + esc(icDph) : ""})</p>
      <p><strong>Kontakt:</strong> ${esc(contactName ?? "-")} · ${esc(phone)} · ${esc(email)}</p>
      <p><strong>Fakturačná adresa:</strong> ${esc(billingAddr)}</p>
      <p><strong>Okresy:</strong> ${esc(districtNames)}</p>
      <p><strong>Cena spolu:</strong> ${formatEur(total)} s DPH / rok</p>
      ${note ? `<p><strong>Poznámka:</strong> ${esc(note)}</p>` : ""}
      <p>ID objednávky: ${order.id}</p>
    `,
  });

  // Potvrdenie objednávateľovi
  await sendEmail({
    to: email,
    subject: "Potvrdenie objednávky — zemneavykopoveprace.sk",
    html: `
      <h2>Ďakujeme za objednávku</h2>
      <p>Prijali sme vašu objednávku okresov: <strong>${esc(districtNames)}</strong>.</p>
      <p>Cena spolu: <strong>${formatEur(total)} s DPH / rok</strong>.</p>
      <h3>Ďalší postup</h3>
      <ol>
        <li>Zašleme vám faktúru a požiadavku na podklady (logo, fotky, popis služieb, kontakty).</li>
        <li>Po prijatí platby a podkladov zverejníme váš profil do 5 pracovných dní.</li>
      </ol>
      <p>Objednávku môžete bezplatne stornovať do 3 kalendárnych dní e-mailom na
      <a href="mailto:${OPERATOR_EMAIL}">${OPERATOR_EMAIL}</a>.</p>
      <p>Metraco s.r.o. · Dolné Obdokovce 64, 951 02 · IČO 50 010 221</p>
    `,
  });

  return NextResponse.json({ ok: true, total, districts: districtNames });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
