import { OPEN_METEO_ELEVATION_URL } from "@/lib/config";
import { steepestSlopeDeg } from "@/lib/geo";
import { fetchJson } from "@/lib/http";
import type { DataOrigin, TerrainInfo } from "@/types";

const SOURCE_NAME = "Open-Meteo elevation (Copernicus DEM GLO-90)";
const SOURCE_URL = "https://open-meteo.com/en/docs/elevation-api";
const SPACING_DEG = 0.0045;

interface ElevationResponse {
  elevation?: Array<number | null>;
}

export function emptyTerrain(detail: string, origin: DataOrigin = "unavailable"): TerrainInfo {
  return {
    origin,
    elevationM: null,
    slopeDeg: null,
    detail,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
  };
}

export async function fetchLiveTerrain(lat: number, lon: number): Promise<TerrainInfo> {
  const points = [
    [lat, lon],
    [lat + SPACING_DEG, lon],
    [lat - SPACING_DEG, lon],
    [lat, lon + SPACING_DEG],
    [lat, lon - SPACING_DEG],
  ];
  const url = new URL(OPEN_METEO_ELEVATION_URL);
  url.searchParams.set("latitude", points.map((point) => point[0]).join(","));
  url.searchParams.set("longitude", points.map((point) => point[1]).join(","));

  try {
    const body = await fetchJson<ElevationResponse>(url.toString());
    const values = body.elevation;
    if (
      !values ||
      values.length !== 5 ||
      values.some((value) => typeof value !== "number" || Number.isNaN(value))
    ) {
      return emptyTerrain(
        "Data unavailable. The elevation service did not return five usable samples. Slope was not guessed.",
      );
    }
    const [center, north, south, east, west] = values as number[];
    const slope = steepestSlopeDeg(lat, SPACING_DEG, center, north, south, east, west);
    return {
      origin: "derived",
      elevationM: Math.round(center),
      slopeDeg: Math.round(slope * 10) / 10,
      detail:
        "Computed in Tarra from five Copernicus DEM GLO-90 samples via Open-Meteo, spaced about 500 m north, south, east, and west. The slope is the steepest of those four rises. Gullies narrower than the spacing are missed. This is not a field survey.",
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
    };
  } catch {
    return emptyTerrain(
      "Data unavailable. The elevation service did not respond. No slope was substituted.",
    );
  }
}
