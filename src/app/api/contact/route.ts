import { NextRequest, NextResponse } from "next/server";
import { sendEmail, OPERATOR_EMAIL } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
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
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const name = s("name");
  const email = s("email");
  const topic = s("topic") || "Všeobecná otázka";
  const message = s("message");

  if (!name || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Vyplňte meno, platný e-mail a správu." },
      { status: 422 },
    );
  }

  const res = await sendEmail({
    to: OPERATOR_EMAIL,
    replyTo: email,
    subject: `Kontakt z webu — ${topic}`,
    html: `
      <h2>Nová správa z kontaktného formulára</h2>
      <p><strong>Meno:</strong> ${esc(name)}</p>
      <p><strong>E-mail:</strong> ${esc(email)}</p>
      <p><strong>Typ správy:</strong> ${esc(topic)}</p>
      <p><strong>Správa:</strong></p>
      <p>${esc(message).replace(/\n/g, "<br>")}</p>
    `,
  });

  return NextResponse.json({ ok: true, delivered: res.ok });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
