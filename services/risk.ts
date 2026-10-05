import type { DataOrigin, RiskAssessment, RiskFactor, RiskLevel } from "@/types";

export const RAIN_48H: ReadonlyArray<readonly [number, number]> = [
  [0, 8],
  [20, 22],
  [40, 38],
  [80, 55],
  [150, 70],
  [300, 84],
  [500, 93],
  [700, 98],
];

export const RAIN_7D: ReadonlyArray<readonly [number, number]> = [
  [0, 8],
  [40, 24],
  [80, 40],
  [150, 58],
  [300, 74],
  [500, 86],
  [800, 95],
];

export const SLOPE_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 6],
  [5, 16],
  [10, 30],
  [15, 45],
  [25, 66],
  [35, 82],
  [45, 92],
  [60, 97],
];

export const WEIGHTS = {
  rainfall: 0.5,
  slope: 0.35,
  history: 0.15,
} as const;

const METHOD =
  "Weighted heuristic, not a forecast. Weights: recent rainfall 0.50, slope 0.35, sample-catalog proximity 0.15. If rainfall or slope is missing, it is dropped and the remaining weights are rescaled. A score is not produced from the catalog alone. Satellite change and model confidence are not inputs. Replace this function when a reviewed model exists.";

const SCOREABLE = new Set<DataOrigin>(["live", "derived", "demo", "catalog"]);

export function piecewise(
  value: number,
  points: ReadonlyArray<readonly [number, number]>,
): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (value <= first[0]) return first[1];
  if (value >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return last[1];
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

export function historyContribution(nearestKm: number | null): number {
  if (nearestKm == null) return 12;
  if (nearestKm <= 15) return 85;
  if (nearestKm <= 40) return 62;
  if (nearestKm <= 100) return 40;
  return 12;
}

export interface AssessInput {
  rainfall48hMm: number | null;
  rainfall7dMm: number | null;
  rainfallOrigin: DataOrigin;
  rainfallDetail: string;
  slopeDeg: number | null;
  slopeOrigin: DataOrigin;
  slopeDetail: string;
  nearestEventKm: number | null;
  historyOrigin: DataOrigin;
  historyDetail: string;
  satelliteDetail: string;
}

function scoredNumber(origin: DataOrigin, value: number | null): number | null {
  if (value == null || Number.isNaN(value) || !SCOREABLE.has(origin)) return null;
  return value;
}

export function assessRisk(input: AssessInput): RiskAssessment {
  const rain48 = scoredNumber(input.rainfallOrigin, input.rainfall48hMm);
  const rain7 = scoredNumber(input.rainfallOrigin, input.rainfall7dMm);
  const rainParts: number[] = [];
  if (rain48 != null) rainParts.push(piecewise(rain48, RAIN_48H));
  if (rain7 != null) rainParts.push(piecewise(rain7, RAIN_7D));
  const rainScore = rainParts.length ? Math.max(...rainParts) : null;

  const slopeValue = scoredNumber(input.slopeOrigin, input.slopeDeg);
  const slopeScore = slopeValue == null ? null : piecewise(slopeValue, SLOPE_CURVE);

  const historyScore =
    input.historyOrigin === "unavailable"
      ? null
      : historyContribution(input.nearestEventKm);

  const rainfall: RiskFactor = {
    id: "rainfall",
    label: "Recent rainfall",
    weight: WEIGHTS.rainfall,
    available: rainScore != null,
    contribution: rainScore == null ? null : Math.round(rainScore),
    origin: rainScore == null ? "unavailable" : input.rainfallOrigin,
    detail: input.rainfallDetail,
  };
  const slope: RiskFactor = {
    id: "slope",
    label: "Terrain slope",
    weight: WEIGHTS.slope,
    available: slopeScore != null,
    contribution: slopeScore == null ? null : Math.round(slopeScore),
    origin: slopeScore == null ? "unavailable" : input.slopeOrigin,
    detail: input.slopeDetail,
  };
  const history: RiskFactor = {
    id: "history",
    label: "Sample-catalog proximity",
    weight: WEIGHTS.history,
    available: historyScore != null,
    contribution: historyScore,
    origin: historyScore == null ? "unavailable" : input.historyOrigin,
    detail: input.historyDetail,
  };
  const satellite: RiskFactor = {
    id: "satellite_change",
    label: "Satellite-detected change",
    weight: 0,
    available: false,
    contribution: null,
    origin: "unavailable",
    detail: input.satelliteDetail,
  };

  const factors = [rainfall, slope, history, satellite];
  const missing = [
    rainfall.available ? null : "rainfall",
    slope.available ? null : "slope",
  ].filter((item): item is string => item != null);

  if (!rainfall.available && !slope.available) {
    return {
      score: null,
      level: null,
      incomplete: true,
      missing,
      method: METHOD,
      factors,
    };
  }

  const active = [rainfall, slope, history].filter(
    (factor) => factor.available && factor.contribution != null && factor.weight > 0,
  );
  const weightSum = active.reduce((sum, factor) => sum + factor.weight, 0);
  const raw =
    active.reduce((sum, factor) => sum + factor.weight * (factor.contribution ?? 0), 0) /
    weightSum;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    level: levelFromScore(score),
    incomplete: missing.length > 0,
    missing,
    method: METHOD,
    factors,
  };
}
