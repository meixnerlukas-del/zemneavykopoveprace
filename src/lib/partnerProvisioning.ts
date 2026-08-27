// Po „platba prijatá": vytvorí/nájde Partnera z objednávky, prepojí jeho okresy
// a vygeneruje magic-link token na prvé prihlásenie. E-mail posiela volajúci (admin akcia).
import { prisma } from "@/lib/prisma";
import { createMagicLinkToken } from "@/lib/partnerTokens";

export async function provisionPartnerForOrder(
  orderId: string,
): Promise<{ partnerId: string; magicToken: string; loginEmail: string } | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  // Nájdi partnera podľa IČO, inak vytvor. loginEmail = e-mail z objednávky.
  let partner = await prisma.partner.findFirst({ where: { ico: order.ico } });
  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        companyName: order.companyName,
        ico: order.ico,
        dic: order.dic,
        icDph: order.icDph,
        billingAddr: order.billingAddr,
        contactName: order.contactName,
        phone: order.phone,
        email: order.email,
        loginEmail: order.email,
      },
    });
  } else if (!partner.loginEmail) {
    partner = await prisma.partner.update({
      where: { id: partner.id },
      data: { loginEmail: order.email },
    });
  }

  // Prepoj okresy objednávky na tohto partnera.
  const slugs = order.districts.split(",").map((s) => s.trim()).filter(Boolean);
  const districts = await prisma.district.findMany({
    where: { slug: { in: slugs } },
    include: { profile: { select: { id: true } } },
  });
  const profileIds = districts.map((d) => d.profile?.id).filter((x): x is string => !!x);
  if (profileIds.length > 0) {
    await prisma.profile.updateMany({
      where: { id: { in: profileIds } },
      data: { partnerId: partner.id },
    });
  }

  const magicToken = await createMagicLinkToken(partner.id);
  return { partnerId: partner.id, magicToken, loginEmail: partner.loginEmail ?? order.email };
}
