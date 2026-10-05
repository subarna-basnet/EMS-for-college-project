import { gibsDatePair, lonLatToTile } from "@/lib/tiles";
import type { DataMode, SatelliteInfo } from "@/types";

const SENSOR = "MODIS Terra corrected reflectance, true color";
const ATTRIBUTION = "NASA Global Imagery Browse Services (GIBS)";

function proxyUrl(date: string, lat: number, lon: number): string {
  const tile = lonLatToTile(lon, lat, 9);
  return `/api/satellite/tile?date=${date}&z=${tile.z}&x=${tile.x}&y=${tile.y}`;
}

export function liveSatelliteLink(lat: number, lon: number, now = new Date()): SatelliteInfo {
  const { before, after } = gibsDatePair(now);
  return {
    origin: "live",
    status: "link_ready",
    sensor: SENSOR,
    beforeDate: before,
    afterDate: after,
    beforeUrl: proxyUrl(before, lat, lon),
    afterUrl: proxyUrl(after, lat, lon),
    differenceUrl: null,
    detail:
      "Live link. These URLs ask NASA GIBS for one MODIS tile at zoom 9 (on the order of 300 m per pixel, covering tens of kilometres). The tile is not a confirmed observation until the imagery page loads it. Cloud, season, and the coarse pixel size all limit what a difference can mean. No landslide mask is computed.",
    attribution: ATTRIBUTION,
  };
}

export function demoSatellite(): SatelliteInfo {
  return {
    origin: "demo",
    status: "demo",
    sensor: null,
    beforeDate: null,
    afterDate: null,
    beforeUrl: "/demo/before.svg",
    afterUrl: "/demo/after.svg",
    differenceUrl: "/demo/difference.svg",
    detail:
      "Demo data. These are drawings made for the prototype, not satellite images of this place and not a change detection result.",
    attribution: "Tarra prototype illustrations. Not NASA, Copernicus, or USGS imagery.",
  };
}

export function unavailableSatellite(detail: string): SatelliteInfo {
  return {
    origin: "unavailable",
    status: "unavailable",
    sensor: null,
    beforeDate: null,
    afterDate: null,
    beforeUrl: null,
    afterUrl: null,
    differenceUrl: null,
    detail,
    attribution: ATTRIBUTION,
  };
}

export function satelliteForMode(mode: DataMode, lat: number, lon: number, scenarioMatched: boolean): SatelliteInfo {
  if (mode === "live") return liveSatelliteLink(lat, lon);
  if (scenarioMatched) return demoSatellite();
  return unavailableSatellite(
    "Data unavailable. Demo imagery is only attached to a sample scenario, so it is not shown for this point.",
  );
}
