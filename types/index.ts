export type DataMode = "live" | "demo";

/** Where a displayed value came from. Simulated values are never scored. */
export type DataOrigin =
  | "live"
  | "derived"
  | "catalog"
  | "demo"
  | "simulated"
  | "unavailable";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface SelectedLocation {
  lat: number;
  lon: number;
  label: string;
  catalogId: string | null;
}

export interface RiskFactor {
  id: "rainfall" | "slope" | "history" | "satellite_change";
  label: string;
  weight: number;
  available: boolean;
  contribution: number | null;
  origin: DataOrigin;
  detail: string;
}

export interface RiskAssessment {
  score: number | null;
  level: RiskLevel | null;
  incomplete: boolean;
  missing: string[];
  method: string;
  factors: RiskFactor[];
}

export interface DailyRain {
  date: string;
  mm: number | null;
}

export interface RainfallInfo {
  origin: DataOrigin;
  past48hMm: number | null;
  past7dMm: number | null;
  days: DailyRain[];
  detail: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string | null;
}

export interface TerrainInfo {
  origin: DataOrigin;
  elevationM: number | null;
  slopeDeg: number | null;
  detail: string;
  sourceName: string;
  sourceUrl: string;
}

export interface CatalogHit {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  occurredOn: string;
  summary: string;
  citation: string;
  citationUrl: string;
  km: number;
}

export interface HistoryInfo {
  origin: DataOrigin;
  nearestKm: number | null;
  events: CatalogHit[];
  detail: string;
}

export interface SatelliteInfo {
  origin: DataOrigin;
  status: "demo" | "link_ready" | "unavailable";
  sensor: string | null;
  beforeDate: string | null;
  afterDate: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
  differenceUrl: string | null;
  detail: string;
  attribution: string;
}

export interface PipelineStep {
  id: string;
  title: string;
  detail: string;
  state: "not_run" | "done" | "skipped" | "unavailable" | "simulated";
}

export interface InferenceSummary {
  origin: "simulated" | "live" | "unavailable";
  modelConnected: boolean;
  modelName: string | null;
  /** 0–1 only when a configured model returned a number in range. Never filled in by the demo. */
  probability: number | null;
  banner: string;
  detail: string;
  steps: PipelineStep[];
}

export interface WarningStatus {
  status: "none" | "prototype_alert";
  level: RiskLevel | null;
  headline: string;
  detail: string;
}

export interface AlertRecord {
  id: string;
  createdAt: string;
  scope: "local" | "regional";
  level: RiskLevel;
  mode: DataMode;
  locationLabel: string;
  lat: number;
  lon: number;
  score: number;
  rainfallDetail: string;
  confidenceDetail: string;
  headline: string;
  message: string;
}

export interface AnalysisResult {
  mode: DataMode;
  analyzedAt: string;
  location: SelectedLocation;
  scenarioMatched: boolean;
  nearestSample: { id: string; name: string; km: number } | null;
  risk: RiskAssessment;
  rainfall: RainfallInfo;
  terrain: TerrainInfo;
  history: HistoryInfo;
  satellite: SatelliteInfo;
  inference: InferenceSummary;
  warning: WarningStatus;
  alerts: AlertRecord[];
  disclaimer: string;
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<AnalysisResult>;
  return (
    (v.mode === "live" || v.mode === "demo") &&
    !!v.risk &&
    !!v.location &&
    typeof v.location.lat === "number" &&
    typeof v.location.lon === "number" &&
    !!v.inference &&
    !!v.rainfall &&
    !!v.terrain
  );
}
