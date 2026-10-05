export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Steepest of four cardinal rises. `spacingDeg` is the sample offset in degrees. */
export function steepestSlopeDeg(
  lat: number,
  spacingDeg: number,
  center: number,
  north: number,
  south: number,
  east: number,
  west: number,
): number {
  const runLat = spacingDeg * 111_320;
  const runLon = spacingDeg * 111_320 * Math.cos((lat * Math.PI) / 180);
  const angle = (rise: number, run: number) =>
    run <= 0 ? 0 : (Math.atan(Math.abs(rise) / run) * 180) / Math.PI;
  return Math.max(
    angle(north - center, runLat),
    angle(south - center, runLat),
    angle(east - center, runLon),
    angle(west - center, runLon),
  );
}
