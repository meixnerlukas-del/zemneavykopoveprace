// Jednoduchý in-memory rate limiter (dev/MVP). V produkcii nahradiť Redis-om.
const hits = new Map<string, number[]>();

/** Vráti true ak je požiadavka POVOLENÁ (pod limitom). */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
