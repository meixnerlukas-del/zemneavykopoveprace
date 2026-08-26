// Cenník: 196,80 € s DPH / rok / okres. Každý ĎALŠÍ okres so zľavou 25 %.
export const PRICE_PER_DISTRICT = 196.8;
export const ADDITIONAL_DISCOUNT = 0.25;
export const VAT_RATE = 20; // % — Metraco je platca DPH (IČ DPH SK2120143707)

export function additionalDistrictPrice(): number {
  return PRICE_PER_DISTRICT * (1 - ADDITIONAL_DISCOUNT); // 147,60 €
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Cena okresu BEZ DPH podľa poradia (0 = prvý plný, ďalšie −25 %). */
export function districtNetPrice(index: number): number {
  const withVat = index === 0 ? PRICE_PER_DISTRICT : additionalDistrictPrice();
  return round2(withVat / (1 + VAT_RATE / 100)); // 196,80→164,00 ; 147,60→123,00
}

/** Sumy objednávky za `count` okresov: netto, DPH a brutto (zaokrúhlené). */
export function computeOrderAmounts(count: number): {
  net: number;
  vat: number;
  gross: number;
} {
  let net = 0;
  for (let i = 0; i < Math.max(0, count); i++) net += districtNetPrice(i);
  net = round2(net);
  const gross = round2(net * (1 + VAT_RATE / 100));
  return { net, vat: round2(gross - net), gross };
}

/** Celková cena za `count` okresov (prvý plný, každý ďalší −25 %). */
export function computeOrderTotal(count: number): number {
  if (count <= 0) return 0;
  const total = PRICE_PER_DISTRICT + (count - 1) * additionalDistrictPrice();
  return Math.round(total * 100) / 100;
}

export function formatEur(amount: number): string {
  return amount.toLocaleString("sk-SK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}
