import { PrismaClient } from "@prisma/client";
import { DISTRICTS, DISTRICT_CENTROIDS, toSlug } from "../src/lib/districts";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1) 79 okresov + prázdny Profile so stavom FREE (idempotentne)
  let created = 0;
  for (const d of DISTRICTS) {
    const slug = toSlug(d.name);
    const [lat, lng] = DISTRICT_CENTROIDS[d.code] ?? [null, null];
    const district = await prisma.district.upsert({
      where: { code: d.code },
      update: { name: d.name, slug, region: d.region, lat, lng },
      create: { name: d.name, slug, code: d.code, region: d.region, lat, lng },
    });
    const existing = await prisma.profile.findUnique({
      where: { districtId: district.id },
    });
    if (!existing) {
      await prisma.profile.create({
        data: { districtId: district.id, status: "FREE" },
      });
      created++;
    }
  }
  const total = await prisma.district.count();
  console.log(`Okresy: ${total} (nové profily: ${created})`);
  if (total !== 79) {
    throw new Error(`Očakávaných 79 okresov, v DB je ${total}!`);
  }

  // 2) Admin účet z .env / .env.local
  const email = process.env.ADMIN_EMAIL ?? "metracosro@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "CHANGE_ME";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, role: "admin" },
  });
  console.log(`Admin: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
