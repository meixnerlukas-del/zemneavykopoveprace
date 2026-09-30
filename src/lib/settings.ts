// Globálne nastavenia platformy (tabuľka Setting): štandardná cena za okres
// a nepovinná akciová prezentácia (pôvodná preškrtnutá cena, platnosť do dátumu).
import { prisma } from "@/lib/prisma";
import { PRICE_PER_DISTRICT } from "@/lib/pricing";

const PRICE_KEY = "pricePerDistrictWithVat";
const ORIGINAL_KEY = "originalPriceWithVat"; // nepovinná „pôvodná" (preškrtnutá) cena
const VALID_UNTIL_KEY = "priceValidUntil"; // nepovinný dátum platnosti ceny (YYYY-MM-DD)

// Upsert alebo (pri prázdnej hodnote) zmazanie kľúča.
async function setOrDelete(key: string, value: string | null): Promise<void> {
  if (value === null || value === "") {
    await prisma.setting.deleteMany({ where: { key } });
    return;
  }
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

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

export type PriceInfo = {
  base: number; // aktuálna cena za okres s DPH
  original: number | null; // nepovinná pôvodná (preškrtnutá) cena — len ak je vyššia než base
  validUntil: Date | null; // nepovinný dátum, do ktorého cena platí
};

/** Kompletná cenová prezentácia: aktuálna cena + nepovinná akcia (pôvodná cena, platnosť). */
export async function getPriceInfo(): Promise<PriceInfo> {
  let base = PRICE_PER_DISTRICT;
  let original: number | null = null;
  let validUntil: Date | null = null;
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [PRICE_KEY, ORIGINAL_KEY, VALID_UNTIL_KEY] } },
    });
    for (const r of rows) {
      if (r.key === PRICE_KEY) {
        const n = Number(r.value);
        if (Number.isFinite(n) && n > 0) base = n;
      } else if (r.key === ORIGINAL_KEY) {
        const n = Number(r.value);
        if (Number.isFinite(n) && n > 0) original = n;
      } else if (r.key === VALID_UNTIL_KEY) {
        const d = new Date(r.value);
        if (!Number.isNaN(d.getTime())) validUntil = d;
      }
    }
  } catch {
    // pred migráciou / bez tabuľky — vráť default
  }
  // Pôvodnú cenu zobrazujeme len ak je naozaj vyššia než aktuálna (akcia).
  if (original != null && original <= base) original = null;
  return { base, original, validUntil };
}

/** Pôvodná (preškrtnutá) cena s DPH. null/0/prázdne = akcia sa nezobrazuje. */
export async function setOriginalPriceWithVat(value: number | null): Promise<void> {
  await setOrDelete(ORIGINAL_KEY, value != null && value > 0 ? String(value) : null);
}

/** Dátum platnosti ceny (YYYY-MM-DD). Prázdne = nezobrazuje sa. */
export async function setPriceValidUntil(date: string | null): Promise<void> {
  await setOrDelete(VALID_UNTIL_KEY, date && date.trim() ? date.trim() : null);
}
