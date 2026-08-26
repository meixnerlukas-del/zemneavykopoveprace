import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, OPERATOR_EMAIL } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { computeOrderTotal, formatEur } from "@/lib/pricing";
import { createProformaForOrder, OPERATOR_IBAN, PAYMENT_DUE_DAYS } from "@/lib/invoicing";

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

  // Automatická predfaktúra (Účto+). Nesmie zhodiť objednávku, keď Účto+ zlyhá.
  let invoiceNumber = "";
  let variableSymbol = "";
  try {
    const inv = await createProformaForOrder(order.id);
    invoiceNumber = inv?.invoiceNumber ?? "";
    variableSymbol = inv?.variableSymbol ?? "";
  } catch (e) {
    console.error("[order] predfaktúra zlyhala:", e);
  }

  const dueDate = new Date(Date.now() + PAYMENT_DUE_DAYS * 86400000).toLocaleDateString("sk-SK");

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
      <p><strong>Predfaktúra:</strong> ${invoiceNumber ? esc(invoiceNumber) : "nevystavená (skontroluj Účto+)"}</p>
      ${note ? `<p><strong>Poznámka:</strong> ${esc(note)}</p>` : ""}
      <p>ID objednávky: ${order.id}</p>
    `,
  });

  // Výzva na úhradu objednávateľovi (predfaktúra)
  await sendEmail({
    to: email,
    subject: `Predfaktúra k objednávke${invoiceNumber ? " č. " + invoiceNumber : ""} — zemneavykopoveprace.sk`,
    html: `
      <h2>Ďakujeme za objednávku</h2>
      <p>Prijali sme vašu objednávku okresov: <strong>${esc(districtNames)}</strong>.</p>
      <h3>Platobné údaje</h3>
      <table cellpadding="4" style="border-collapse:collapse">
        <tr><td><strong>Suma na úhradu</strong></td><td>${formatEur(total)} s DPH / rok</td></tr>
        <tr><td><strong>IBAN</strong></td><td>${OPERATOR_IBAN}</td></tr>
        <tr><td><strong>Variabilný symbol</strong></td><td>${variableSymbol ? esc(variableSymbol) : "uvedieme na predfaktúre"}</td></tr>
        ${invoiceNumber ? `<tr><td><strong>Predfaktúra č.</strong></td><td>${esc(invoiceNumber)}</td></tr>` : ""}
        <tr><td><strong>Splatnosť</strong></td><td>${dueDate}</td></tr>
      </table>
      <h3>Ďalší postup</h3>
      <ol>
        <li>Uhraďte sumu podľa údajov vyššie (variabilný symbol uveďte pri platbe).</li>
        <li>Po prijatí platby vám vystavíme ostrú faktúru a sprístupníme doplnenie profilu.</li>
        <li>Po doplnení podkladov (logo, fotky, popis služieb, kontakty) profil zverejníme.</li>
      </ol>
      <p>Objednávku môžete bezplatne stornovať do 3 kalendárnych dní e-mailom na
      <a href="mailto:${OPERATOR_EMAIL}">${OPERATOR_EMAIL}</a>.</p>
      <p>Metraco s.r.o. · Dolné Obdokovce 64, 951 02 · IČO 50 010 221 · IČ DPH SK2120143707</p>
    `,
  });

  return NextResponse.json({ ok: true, total, districts: districtNames, invoiceNumber });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
