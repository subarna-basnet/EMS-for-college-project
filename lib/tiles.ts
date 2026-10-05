export interface TileAddress {
  z: number;
  x: number;
  y: number;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** MODIS Terra browse via GIBS. After-date lags UTC today by three days. */
export function gibsDatePair(now = new Date()): { before: string; after: string } {
  const after = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  after.setUTCDate(after.getUTCDate() - 3);
  const before = new Date(after);
  before.setUTCDate(before.getUTCDate() - 16);
  return { before: isoDate(before), after: isoDate(after) };
}

export function lonLatToTile(lon: number, lat: number, z: number): TileAddress {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      n,
  );
  return {
    z,
    x: Math.min(n - 1, Math.max(0, x)),
    y: Math.min(n - 1, Math.max(0, y)),
  };
}

export function parseTileQuery(input: {
  date: string | null;
  z: string | null;
  x: string | null;
  y: string | null;
  now?: Date;
}): { ok: true; date: string; tile: TileAddress } | { ok: false; error: string } {
  const date = input.date ?? "";
  if (!isIsoDate(date)) return { ok: false, error: "Invalid date." };
  if (date < "2000-02-24") return { ok: false, error: "Date is before this layer." };
  const today = isoDate(input.now ?? new Date());
  if (date > today) return { ok: false, error: "Date is in the future." };

  const z = Number(input.z);
  const x = Number(input.x);
  const y = Number(input.y);
  if (!Number.isInteger(z) || z < 0 || z > 9) {
    return { ok: false, error: "Zoom must be an integer from 0 to 9." };
  }
  const n = 2 ** z;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= n || y >= n) {
    return { ok: false, error: "Tile column or row is out of range." };
  }
  return { ok: true, date, tile: { z, x, y } };
}

export function gibsTileUrl(date: string, tile: TileAddress): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/${tile.z}/${tile.y}/${tile.x}.jpg`;
}
