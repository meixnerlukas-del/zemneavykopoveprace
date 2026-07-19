import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/auth";

export const runtime = "nodejs";

function slugifyBase(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Neautorizované" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const seo = (form.get("seo") as string) || "zemne-a-vykopove-prace";
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Chýba súbor" }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "Súbor je príliš veľký (max 12 MB)" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Kompresia + orezanie na max 1600px, výstup JPEG
  const out = await sharp(buf)
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const base = slugifyBase(seo) || "foto";
  const suffix = Math.random().toString(36).slice(2, 8);
  const fileName = `${base}-${suffix}.jpg`;

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), out);

  return NextResponse.json({ ok: true, url: `/uploads/${fileName}` });
}
