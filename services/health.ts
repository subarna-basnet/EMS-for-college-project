import { NOMINATIM_URL, OPEN_METEO_ELEVATION_URL, USER_AGENT } from "@/lib/config";
import { gibsDatePair, gibsTileUrl, lonLatToTile } from "@/lib/tiles";

export interface ProviderCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

async function probe(
  id: string,
  label: string,
  url: string,
  accept: string,
  timeoutMs = 8000,
): Promise<{ id: string; label: string; response: Response | null; detail: string }> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: accept, "User-Agent": USER_AGENT },
    });
    return { id, label, response, detail: `HTTP ${response.status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    return { id, label, response: null, detail: message };
  }
}

export async function checkProviders(): Promise<{ checkedAt: string; providers: ProviderCheck[] }> {
  const elevation = new URL(OPEN_METEO_ELEVATION_URL);
  elevation.searchParams.set("latitude", "12.97");
  elevation.searchParams.set("longitude", "77.59");
  const { after } = gibsDatePair();
  const tile = lonLatToTile(77.59, 12.97, 2);
  const gibs = gibsTileUrl(after, tile);
  const nominatim = new URL("/status", NOMINATIM_URL);
  nominatim.searchParams.set("format", "json");

  const [meteo, imagery, places] = await Promise.all([
    probe("open-meteo", "Open-Meteo elevation", elevation.toString(), "application/json"),
    probe("gibs", "NASA GIBS", gibs, "image/jpeg", 12_000),
    probe("nominatim", "Nominatim", nominatim.toString(), "application/json"),
  ]);

  const providers: ProviderCheck[] = [];

  if (meteo.response?.ok) {
    providers.push({ id: meteo.id, label: meteo.label, ok: true, detail: "Elevation endpoint responded." });
  } else {
    providers.push({
      id: meteo.id,
      label: meteo.label,
      ok: false,
      detail: `Data unavailable. ${meteo.detail}`,
    });
  }

  const imageType = imagery.response?.headers.get("content-type") ?? "";
  if (imagery.response?.ok && imageType.includes("image")) {
    providers.push({ id: imagery.id, label: imagery.label, ok: true, detail: `Tile for ${after} returned an image.` });
  } else {
    providers.push({
      id: imagery.id,
      label: imagery.label,
      ok: false,
      detail: `Data unavailable. ${imagery.detail}`,
    });
  }

  if (places.response?.ok) {
    providers.push({ id: places.id, label: places.label, ok: true, detail: "Status endpoint responded." });
  } else {
    providers.push({
      id: places.id,
      label: places.label,
      ok: false,
      detail: `Data unavailable. ${places.detail}. Catalog search still works.`,
    });
  }

  return { checkedAt: new Date().toISOString(), providers };
}
