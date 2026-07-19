// Ukážkový PUBLISHED profil pre okres Nitra (Bager NR s.r.o.).
// Placeholder fotky (picsum). Idempotentné — deti profilu sa pred vložením zmažú.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pic = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  const nitra = await prisma.district.findUnique({ where: { slug: "nitra" } });
  if (!nitra) throw new Error("Okres Nitra nenájdený — spusti najprv hlavný seed.");

  const partner = await prisma.partner.upsert({
    where: { id: "demo-partner-nitra" },
    update: {},
    create: {
      id: "demo-partner-nitra",
      companyName: "Bager NR s.r.o.",
      ico: "12345678",
      dic: "2023456789",
      icDph: "SK2023456789",
      billingAddr: "Priemyselná 12, 949 01 Nitra",
      contactName: "Ján Kováč",
      phone: "+421 900 123 456",
      email: "bagernr@example.com",
      note: "Ukážkový partner (demo).",
    },
  });

  const profile = await prisma.profile.update({
    where: { districtId: nitra.id },
    data: {
      partnerId: partner.id,
      status: "PUBLISHED",
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      displayName: "Bager NR s.r.o.",
      phone: "+421 900 123 456",
      email: "bagernr@example.com",
      websiteUrl: "https://bagernr.example.com",
      facebookUrl: "https://facebook.com/bagernr",
      youtubeUrl: "https://youtube.com/@bagernr",
      addressLine: "Priemyselná 12, 949 01 Nitra",
      lat: 48.3069,
      lng: 18.0764,
      heroImageUrl: pic("nitra-hero", 1600, 900),
      tagline: "Výkopy · doprava kameniva · búranie",
      aboutText:
        "Sme rodinná firma z Nitry s viac než 15-ročnými skúsenosťami so zemnými a výkopovými prácami. Realizujeme výkopy základov, prípojok a bazénov, dopravu kameniva a búracie práce v Nitre a okolí — vo Vrábľoch, Zlatých Moravciach, Šuranoch aj Nových Zámkoch. Vlastníme moderný park strojov a garantujeme dohodnuté termíny.",
      metaTitle:
        "Zemné a výkopové práce Nitra | Bager Nitra, výkop, doprava kameniva",
      metaDescription:
        "Bager NR s.r.o. — zemné a výkopové práce v okrese Nitra. Výkopy základov a prípojok, doprava kameniva, búranie. Zavolajte a dohodnite termín.",
    },
  });

  // Vyčisti deti (idempotencia)
  await prisma.service.deleteMany({ where: { profileId: profile.id } });
  await prisma.machine.deleteMany({ where: { profileId: profile.id } });
  await prisma.galleryItem.deleteMany({ where: { profileId: profile.id } });
  await prisma.videoItem.deleteMany({ where: { profileId: profile.id } });
  await prisma.review.deleteMany({ where: { profileId: profile.id } });

  await prisma.service.createMany({
    data: [
      { profileId: profile.id, title: "Výkopové práce", description: "Výkopy základov, prípojok inžinierskych sietí, jám a bazénov.", order: 1 },
      { profileId: profile.id, title: "Doprava kameniva", description: "Dovoz štrku, piesku a kameniva priamo na stavbu.", order: 2 },
      { profileId: profile.id, title: "Kamiónová doprava", description: "Preprava sypkých materiálov a stavebnej sute.", order: 3 },
      { profileId: profile.id, title: "Búracie práce", description: "Búranie stavieb, spevnených plôch a betónových konštrukcií.", order: 4 },
    ],
  });

  await prisma.machine.createMany({
    data: [
      { profileId: profile.id, name: "Traktorbager JCB 3CX", description: "Výkop do hĺbky 5,5 m, univerzálne nasadenie.", imageUrl: pic("jcb-3cx"), order: 1 },
      { profileId: profile.id, name: "Kolesový bager", description: "Rýchle presuny po stavbe, výkopy a nakladanie.", imageUrl: pic("koleso-bager"), order: 2 },
      { profileId: profile.id, name: "Kamión na kamenivo", description: "Nosnosť do 12 t, sklápač.", imageUrl: pic("kamion"), order: 3 },
    ],
  });

  await prisma.galleryItem.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      profileId: profile.id,
      imageUrl: pic(`nitra-real-${i + 1}`, 800, 600),
      caption: `Zemné a výkopové práce Nitra — realizácia ${i + 1}`,
      order: i + 1,
    })),
  });

  await prisma.videoItem.create({
    data: {
      profileId: profile.id,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Ukážka realizácie výkopových prác",
      order: 1,
    },
  });

  await prisma.review.createMany({
    data: [
      { profileId: profile.id, author: "Peter M.", text: "Rýchlo, čisto a za dohodnutú cenu. Výkop základov na rodinný dom spravili za dva dni.", rating: 5, date: new Date("2025-06-10") },
      { profileId: profile.id, author: "Obec Čechynce", text: "Spoľahlivý partner pri obecných prácach, odporúčame.", rating: 5, date: new Date("2025-04-22") },
      { profileId: profile.id, author: "Martina K.", text: "Ochota a férový prístup. Dovoz kameniva presne podľa dohody.", rating: 4, date: new Date("2025-03-05") },
    ],
  });

  console.log("Demo profil Nitra (Bager NR s.r.o.) naseedovaný ako PUBLISHED.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
