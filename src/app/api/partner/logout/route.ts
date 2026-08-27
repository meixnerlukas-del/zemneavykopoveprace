import { NextResponse } from "next/server";
import { endSession } from "@/lib/partnerAuth";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://www.zemneavykopoveprace.sk";

export async function POST() {
  await endSession();
  return NextResponse.redirect(`${SITE_URL}/partner`, { status: 303 });
}
