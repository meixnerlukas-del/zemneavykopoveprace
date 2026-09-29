// Globálne nastavenia platformy (tabuľka Setting). Zatiaľ len štandardná cena za okres.
import { prisma } from "@/lib/prisma";
import { PRICE_PER_DISTRICT } from "@/lib/pricing";

const PRICE_KEY = "pricePerDistrictWithVat";

/** Aktuálna štandardná cena za okres s DPH (globálna). Fallback: pôvodná 196,80. */
export async function getBasePriceWithVat(): Promise<number> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: PRICE_KEY } });
    if (s) {
      const n = Number(s.value);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    // tabuľka nemusí existovať pred migráciou — použijeme default
  }
  return PRICE_PER_DISTRICT;
}

/** Nastaví globálnu štandardnú cenu za okres s DPH. */
export async function setBasePriceWithVat(value: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: PRICE_KEY },
    create: { key: PRICE_KEY, value: String(value) },
    update: { value: String(value) },
  });
}
