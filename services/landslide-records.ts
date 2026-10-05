import { CATALOG, type CatalogSite } from "@/data/catalog";
import { haversineKm } from "@/lib/geo";
import { HISTORY_NOTE } from "@/lib/config";
import type { CatalogHit, HistoryInfo } from "@/types";

function toHit(site: CatalogSite, km: number): CatalogHit {
  return {
    id: site.id,
    name: site.name,
    region: site.region,
    country: site.country,
    lat: site.lat,
    lon: site.lon,
    occurredOn: site.occurredOn ?? "",
    summary: site.summary,
    citation: site.citation,
    citationUrl: site.citationUrl,
    km,
  };
}

export function searchRecords(lat: number, lon: number): HistoryInfo {
  const events = CATALOG.filter((site) => site.kind === "event")
    .map((site) => toHit(site, haversineKm(lat, lon, site.lat, site.lon)))
    .sort((a, b) => a.km - b.km);

  const nearest = events[0];
  const listed = events.filter((event) => event.km <= 200).slice(0, 5);
  const shown = listed.length > 0 ? listed : nearest ? [nearest] : [];

  const detail = nearest
    ? nearest.km <= 15
      ? `Sample catalog: ${nearest.name} is ${nearest.km < 1 ? "at this point" : `${nearest.km.toFixed(1)} km away`} (${nearest.occurredOn}). ${HISTORY_NOTE}`
      : `Nearest sample-catalog event is ${nearest.name}, about ${Math.round(nearest.km)} km away (${nearest.occurredOn}). ${HISTORY_NOTE}`
    : HISTORY_NOTE;

  return {
    origin: "catalog",
    nearestKm: nearest ? nearest.km : null,
    events: shown,
    detail,
  };
}

export function nearestSample(
  lat: number,
  lon: number,
): { id: string; name: string; km: number } | null {
  const ranked = CATALOG.map((site) => ({
    id: site.id,
    name: site.shortName,
    km: haversineKm(lat, lon, site.lat, site.lon),
  })).sort((a, b) => a.km - b.km);
  return ranked[0] ?? null;
}

export function zoneContains(site: CatalogSite, lat: number, lon: number): boolean {
  return (
    Math.abs(lat - site.lat) <= site.box.dLat &&
    Math.abs(lon - site.lon) <= site.box.dLon
  );
}
