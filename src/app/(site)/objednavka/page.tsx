import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { REGIONS } from "@/lib/districts";
import { getBasePriceWithVat } from "@/lib/settings";
import { formatEur } from "@/lib/pricing";
import OrderForm from "@/components/OrderForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Objednávka okresu — exkluzívne zastúpenie",
  description:
    "Objednajte si exkluzívne zastúpenie zemných a výkopových prác vo svojom okrese. 196,80 € s DPH/rok, zľava 25 % na každý ďalší okres.",
};

export default async function OrderPage() {
  const districts = await prisma.district.findMany({
    orderBy: { code: "asc" },
    select: {
      slug: true,
      name: true,
      region: true,
      profile: { select: { status: true } },
    },
  });

  const items = districts.map((d) => ({
    slug: d.slug,
    name: d.name,
    region: d.region,
    occupied: !!d.profile && d.profile.status !== "FREE",
  }));
  const freeCount = items.filter((i) => !i.occupied).length;
  const basePrice = await getBasePriceWithVat();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl uppercase sm:text-4xl">Objednávka okresu</h1>
      <p className="mt-4 text-muted">
        Vyberte voľné okresy, vyplňte fakturačné údaje a odošlite objednávku. Cena
        prvého okresu je {formatEur(basePrice)} s DPH/rok, každý ďalší so zľavou 25 %. Po odoslaní
        vám vystavíme predfaktúru s platobnými údajmi.
      </p>

      {freeCount === 0 ? (
        <p className="mt-10 border-l-4 border-jcb bg-concrete-2 p-4">
          Momentálne nie sú voľné žiadne okresy.
        </p>
      ) : (
        <div className="mt-10">
          <OrderForm districts={items} regions={REGIONS} base={basePrice} />
        </div>
      )}
    </div>
  );
}
