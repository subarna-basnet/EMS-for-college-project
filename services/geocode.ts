import { CATALOG } from "@/data/catalog";
import { NOMINATIM_URL, USER_AGENT } from "@/lib/config";
import { parseCoordinateQuery } from "@/lib/coords";

export interface GeocodeHit {
  label: string;
  lat: number;
  lon: number;
  source: "coordinates" | "catalog" | "nominatim";
  catalogId: string | null;
}

export interface GeocodeResponse {
  geocoder: "live" | "unused" | "unavailable";
  note: string;
  results: GeocodeHit[];
}

let nominatimChain: Promise<void> = Promise.resolve();
let lastNominatim = 0;

function withNominatimSlot<T>(task: () => Promise<T>): Promise<T> {
  const run = nominatimChain.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatim));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastNominatim = Date.now();
    return task();
  });
  nominatimChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function catalogHits(query: string): GeocodeHit[] {
  const needle = query.toLowerCase();
  return CATALOG.filter((site) =>
    `${site.shortName} ${site.name} ${site.region} ${site.country}`.toLowerCase().includes(needle),
  ).map((site) => ({
    label: `${site.name} — ${site.region}`,
    lat: site.lat,
    lon: site.lon,
    source: "catalog" as const,
    catalogId: site.id,
  }));
}

export async function geocode(query: string): Promise<GeocodeResponse> {
  const trimmed = query.trim().slice(0, 120);
  const coordinate = parseCoordinateQuery(trimmed);
  const catalog = catalogHits(trimmed);
  if (coordinate) {
    return {
      geocoder: "unused",
      note: "Read as latitude and longitude. No place-name service was called.",
      results: [
        {
          label: "Entered coordinates",
          lat: coordinate.lat,
          lon: coordinate.lon,
          source: "coordinates",
          catalogId: null,
        },
        ...catalog,
      ],
    };
  }

  try {
    const results = await withNominatimSlot(async () => {
      const url = new URL("/search", NOMINATIM_URL);
      url.searchParams.set("q", trimmed);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "5");
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      });
      if (!response.ok) throw new Error(`Nominatim ${response.status}`);
      const body = (await response.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
      const places: GeocodeHit[] = [];
      for (const item of body) {
        const lat = Number(item.lat);
        const lon = Number(item.lon);
        if (!item.display_name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        places.push({
          label: item.display_name,
          lat,
          lon,
          source: "nominatim",
          catalogId: null,
        });
      }
      return places;
    });
    return {
      geocoder: "live",
      note: "Place names from OpenStreetMap Nominatim. Sample-catalog matches are listed first.",
      results: [...catalog, ...results],
    };
  } catch {
    return {
      geocoder: "unavailable",
      note: "Place search did not respond. Sample-catalog names still match. No guessed location was added.",
      results: catalog,
    };
  }
}
