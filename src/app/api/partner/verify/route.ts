import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/partnerTokens";
import { startSession } from "@/lib/partnerAuth";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://www.zemneavykopoveprace.sk";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const partnerId = await consumeMagicLink(token);
  if (!partnerId) {
    return NextResponse.redirect(`${SITE_URL}/partner?error=link`);
  }
  await startSession(partnerId);
  return NextResponse.redirect(`${SITE_URL}/partner/profily`);
}
