import { CATALOG, DEMO_SCENARIOS, scenarioById, siteById, type DemoScenario } from "@/data/catalog";
import { DISCLAIMER } from "@/lib/config";
import { buildAlerts, warningFromAnalysis } from "@/lib/alerts";
import { haversineKm } from "@/lib/geo";
import { assessRisk } from "@/services/risk";
import { runInference } from "@/services/inference";
import { searchRecords, nearestSample } from "@/services/landslide-records";
import { emptyRainfall, fetchLiveRainfall, rainfallFromDaily } from "@/services/rainfall";
import { satelliteForMode } from "@/services/satellite";
import { emptyTerrain, fetchLiveTerrain } from "@/services/terrain";
import type {
  AnalysisResult,
  DataMode,
  DataOrigin,
  RainfallInfo,
  TerrainInfo,
} from "@/types";

const MATCH_KM = 8;

export function rainfallForMode(
  mode: DataMode,
  live: RainfallInfo,
  scenario: DemoScenario | null,
): RainfallInfo {
  if (mode === "live") return live;
  if (!scenario) {
    return emptyRainfall(
      "Data unavailable. Demo mode has rainfall only for a prepared sample, and this point is not one of them.",
    );
  }
  const origin: DataOrigin = scenario.rainfall48hMm == null && scenario.rainfall7dMm == null
    ? "unavailable"
    : scenario.siteId === "wayanad-2024"
      ? "catalog"
      : "demo";
  return {
    origin,
    past48hMm: scenario.rainfall48hMm,
    past7dMm: scenario.rainfall7dMm,
    days: [],
    detail: scenario.rainfallDetail,
    sourceName: origin === "catalog" ? "Tarra project brief" : "Tarra demo scenario",
    sourceUrl: "",
    retrievedAt: null,
  };
}

export function terrainForMode(
  mode: DataMode,
  live: TerrainInfo,
  scenario: DemoScenario | null,
): TerrainInfo {
  if (mode === "live") return live;
  if (!scenario) {
    return emptyTerrain(
      "Data unavailable. Demo mode has terrain notes only for a prepared sample.",
    );
  }
  const parts = [scenario.elevationDetail, scenario.slopeDetail].filter(Boolean);
  const hasSlope = scenario.slopeDeg != null;
  const hasElevation = scenario.elevationM != null;
  let origin: DataOrigin = "unavailable";
  if (hasSlope && scenario.siteId !== "wayanad-2024") origin = "demo";
  else if (hasElevation && !hasSlope) origin = "catalog";
  else if (hasSlope || hasElevation) origin = "demo";
  if (scenario.siteId === "wayanad-2024") origin = "catalog";
  return {
    origin: hasSlope || hasElevation ? origin : "unavailable",
    elevationM: scenario.elevationM,
    slopeDeg: scenario.slopeDeg,
    detail: parts.join(" "),
    sourceName: origin === "catalog" ? "Cited report" : "Tarra demo scenario",
    sourceUrl: "",
  };
}

function matchedScenario(lat: number, lon: number): { scenario: DemoScenario; km: number } | null {
  let best: { scenario: DemoScenario; km: number } | null = null;
  for (const scenario of DEMO_SCENARIOS) {
    const site = siteById(scenario.siteId);
    if (!site) continue;
    const km = haversineKm(lat, lon, site.lat, site.lon);
    if (km <= MATCH_KM && (!best || km < best.km)) best = { scenario, km };
  }
  return best;
}

export async function analyzeLocation(input: {
  lat: number;
  lon: number;
  mode: DataMode;
  label?: string;
}): Promise<AnalysisResult> {
  const history = searchRecords(input.lat, input.lon);
  const near = nearestSample(input.lat, input.lon);
  const match = input.mode === "demo" ? matchedScenario(input.lat, input.lon) : null;
  const scenario = match?.scenario ?? null;
  const site = scenario ? siteById(scenario.siteId) : undefined;

  const [liveRain, liveTerrain] = input.mode === "live"
    ? await Promise.all([
        fetchLiveRainfall(input.lat, input.lon),
        fetchLiveTerrain(input.lat, input.lon),
      ])
    : [emptyRainfall("Not requested in demo mode."), emptyTerrain("Not requested in demo mode.")];

  const rainfall = rainfallForMode(input.mode, liveRain, scenario);
  const terrain = terrainForMode(input.mode, liveTerrain, scenario);
  const satellite = satelliteForMode(input.mode, input.lat, input.lon, scenario != null);

  const slopeOrigin = terrain.slopeDeg == null ? "unavailable" : terrain.origin;
  const risk = assessRisk({
    rainfall48hMm: rainfall.past48hMm,
    rainfall7dMm: rainfall.past7dMm,
    rainfallOrigin: rainfall.origin,
    rainfallDetail: rainfall.detail,
    slopeDeg: terrain.slopeDeg,
    slopeOrigin: slopeOrigin === "catalog" && terrain.slopeDeg != null ? "catalog" : slopeOrigin,
    slopeDetail: terrain.slopeDeg == null ? scenario?.slopeDetail ?? terrain.detail : terrain.detail,
    nearestEventKm: history.nearestKm,
    historyOrigin: history.origin,
    historyDetail: history.detail,
    satelliteDetail:
      "Not scored. This prototype does not turn browse imagery into a change metric. The factor is shown so it can be replaced by a model later.",
  });

  const label =
    input.label?.trim() ||
    (site ? site.name : "Selected point");

  const analyzedAt = new Date().toISOString();
  const confidenceDetail = "not available — no model connected";

  const alerts = buildAlerts({
    mode: input.mode,
    analyzedAt,
    locationLabel: site?.name ?? label,
    lat: input.lat,
    lon: input.lon,
    score: risk.score,
    level: risk.level,
    rainfallDetail: rainfall.past48hMm == null && rainfall.past7dMm == null
      ? rainfall.detail
      : [
          rainfall.past48hMm == null ? null : `${rainfall.past48hMm} mm over the latest two daily totals`,
          rainfall.past7dMm == null ? null : `${rainfall.past7dMm} mm over seven daily totals`,
          rainfall.origin === "live" ? "(live, Open-Meteo)" : rainfall.origin === "catalog" ? "(cited figure, not a live gauge)" : "(demo data)",
        ].filter(Boolean).join("; "),
    confidenceDetail,
    nearby: history.events,
  });

  const inference = await runInference({
    lat: input.lat,
    lon: input.lon,
    satellite,
    scoreAvailable: risk.score != null,
    alertCreated: alerts.length > 0,
  });

  if (inference.probability != null && inference.modelConnected) {
    const percent = `${Math.round(inference.probability * 100)}% from ${inference.modelName ?? "the configured model"}`;
    for (const alert of alerts) {
      alert.confidenceDetail = percent;
      alert.message = alert.message.replace(confidenceDetail, percent);
    }
  } else if (inference.origin === "unavailable") {
    for (const alert of alerts) {
      alert.confidenceDetail = "data unavailable — model endpoint failed";
      alert.message = alert.message.replace(
        confidenceDetail,
        "data unavailable — model endpoint failed",
      );
    }
  }

  const locationLabel = site ? `${site.name}` : label.slice(0, 180);

  const result: AnalysisResult = {
    mode: input.mode,
    analyzedAt,
    location: {
      lat: input.lat,
      lon: input.lon,
      label: locationLabel,
      catalogId: site?.id ?? null,
    },
    scenarioMatched: scenario != null,
    nearestSample: near,
    risk,
    rainfall,
    terrain,
    history,
    satellite,
    inference,
    warning: {
      status: "none",
      level: risk.level,
      headline: "",
      detail: "",
    },
    alerts,
    disclaimer: DISCLAIMER,
  };
  result.warning = warningFromAnalysis(result);
  return result;
}

export interface ZoneCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      id: string;
      name: string;
      level: string;
      score: number | null;
      note: string;
    };
    geometry: { type: "Polygon"; coordinates: number[][][] };
  }>;
}

export function zoneFeatures(): ZoneCollection {
  return {
    type: "FeatureCollection",
    features: CATALOG.map((site) => {
      const scenario = scenarioById(site.id);
      const history = searchRecords(site.lat, site.lon);
      const rain = rainfallForMode("demo", emptyRainfall("unused"), scenario ?? null);
      const terrain = terrainForMode("demo", emptyTerrain("unused"), scenario ?? null);
      const risk = assessRisk({
        rainfall48hMm: rain.past48hMm,
        rainfall7dMm: rain.past7dMm,
        rainfallOrigin: rain.origin,
        rainfallDetail: rain.detail,
        slopeDeg: terrain.slopeDeg,
        slopeOrigin: terrain.slopeDeg == null ? "unavailable" : terrain.origin,
        slopeDetail: terrain.detail,
        nearestEventKm: history.nearestKm,
        historyOrigin: "catalog",
        historyDetail: history.detail,
        satelliteDetail: "Not scored.",
      });
      const west = site.lon - site.box.dLon;
      const east = site.lon + site.box.dLon;
      const south = site.lat - site.box.dLat;
      const north = site.lat + site.box.dLat;
      return {
        type: "Feature" as const,
        properties: {
          id: site.id,
          name: site.shortName,
          level: risk.level ?? "unknown",
          score: risk.score,
          note: "Demo scenario extent. Not an official hazard boundary.",
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        },
      };
    }),
  };
}
