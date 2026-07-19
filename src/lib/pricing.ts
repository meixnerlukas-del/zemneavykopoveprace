// Cenník: 196,80 € s DPH / rok / okres. Každý ĎALŠÍ okres so zľavou 25 %.
export const PRICE_PER_DISTRICT = 196.8;
export const ADDITIONAL_DISCOUNT = 0.25;

export function additionalDistrictPrice(): number {
  return PRICE_PER_DISTRICT * (1 - ADDITIONAL_DISCOUNT); // 147,60 €
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
