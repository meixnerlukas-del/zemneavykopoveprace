// Geodetické pomôcky pre výpočet najbližšieho okresu (centroidová aproximácia).

export type DistrictPoint = {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  occupied: boolean;
  displayName: string | null;
};

/** Haversine vzdialenosť v km medzi dvoma bodmi. */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Nájde najbližší okres k danej polohe.
 * `preferOccupied` = true → hľadá najbližšieho zhotoviteľa (obsadený okres),
 * a ak žiadny neexistuje, vráti najbližší okres celkovo (s príznakom).
 */
export function nearestDistrict(
  lat: number,
  lng: number,
  points: DistrictPoint[],
  preferOccupied = true,
): { district: DistrictPoint; distanceKm: number; isOccupied: boolean } | null {
  if (points.length === 0) return null;

  const byDistance = (list: DistrictPoint[]) =>
    list
      .map((p) => ({ p, d: haversineKm(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.d - b.d)[0];

  if (preferOccupied) {
    const occupied = points.filter((p) => p.occupied);
    if (occupied.length > 0) {
      const best = byDistance(occupied);
      return { district: best.p, distanceKm: best.d, isOccupied: true };
    }
  }
  const best = byDistance(points);
  return {
    district: best.p,
    distanceKm: best.d,
    isOccupied: best.p.occupied,
  };
}
