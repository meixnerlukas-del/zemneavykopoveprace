import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const okres = req.nextUrl.searchParams.get("okres");
  const district = okres
    ? await prisma.district.findUnique({ where: { slug: okres } })
    : null;

  const leads = await prisma.lead.findMany({
    where: district ? { districtId: district.id } : {},
    orderBy: { createdAt: "desc" },
  });
  const districts = await prisma.district.findMany({ select: { id: true, name: true } });
  const nameById = new Map(districts.map((d) => [d.id, d.name]));

  const header = ["Dátum", "Okres", "Meno", "E-mail", "Telefón", "Správa", "Doručené"];
  const rows = leads.map((l) =>
    [
      new Date(l.createdAt).toISOString(),
      l.districtId ? nameById.get(l.districtId) ?? "" : "",
      l.name,
      l.email,
      l.phone ?? "",
      l.message,
      l.sentOk ? "áno" : "nie",
    ].map((c) => csvCell(String(c))).join(","),
  );
  const csv = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dopyty${okres ? "-" + okres : ""}.csv"`,
    },
  });
}
