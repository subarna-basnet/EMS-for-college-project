import { ALERT_THRESHOLD, RISK_LABEL } from "@/lib/risk-style";
import { formatCoord } from "@/lib/coords";
import type {
  AlertRecord,
  AnalysisResult,
  CatalogHit,
  DataMode,
  RiskLevel,
} from "@/types";

export function buildAlerts(input: {
  mode: DataMode;
  analyzedAt: string;
  locationLabel: string;
  lat: number;
  lon: number;
  score: number | null;
  level: RiskLevel | null;
  rainfallDetail: string;
  confidenceDetail: string;
  nearby: CatalogHit[];
}): AlertRecord[] {
  if (input.score == null || input.level == null || input.score < ALERT_THRESHOLD) {
    return [];
  }
  const level = input.level;
  const day = input.analyzedAt.slice(0, 10);
  const place = `${input.lat.toFixed(2)}|${input.lon.toFixed(2)}`;
  const confidence = input.confidenceDetail;
  const rainfall = input.rainfallDetail;
  const base = `Heuristic risk score is ${input.score}/100 (${RISK_LABEL[level]}). This is not a confirmed slope failure and was not sent to any authority.`;
  const where = `Location: ${input.locationLabel} (${formatCoord(input.lat, input.lon)}).`;
  const rain = `Rainfall: ${rainfall}`;
  const detect = `Detection confidence: ${confidence}`;
  const when = `Alert time: ${input.analyzedAt}. That is when this prototype crossed its threshold, not the time of a confirmed failure.`;

  const local: AlertRecord = {
    id: `local|${input.mode}|${place}|${level}|${day}`,
    createdAt: input.analyzedAt,
    scope: "local",
    level,
    mode: input.mode,
    locationLabel: input.locationLabel,
    lat: input.lat,
    lon: input.lon,
    score: input.score,
    rainfallDetail: rainfall,
    confidenceDetail: confidence,
    headline: `${RISK_LABEL[level]} — prototype local alert`,
    message: [base, where, rain, detect, when].join(" "),
  };

  const others = input.nearby.filter((event) => event.km > 1);
  const regionalNote =
    others.length > 0
      ? `Other sample-catalog events within 200 km: ${others
          .map((event) => `${event.name} (${Math.round(event.km)} km)`)
          .join("; ")}.`
      : "No other sample-catalog event is within 200 km. The wider notice is still shown because the point score crossed the threshold.";

  const regional: AlertRecord = {
    ...local,
    id: `regional|${input.mode}|${place}|${level}|${day}`,
    scope: "regional",
    headline: `${RISK_LABEL[level]} — prototype regional alert`,
    message: `${base} ${regionalNote} ${where} ${rain} ${detect} ${when} The project brief calls the wider notice a global alert. Nothing was broadcast.`,
  };

  return [local, regional];
}

export function warningFromAnalysis(result: Pick<AnalysisResult, "alerts" | "risk">): AnalysisResult["warning"] {
  const local = result.alerts.find((alert) => alert.scope === "local");
  if (!local || result.risk.level == null) {
    return {
      status: "none",
      level: result.risk.level,
      headline: "No prototype alert",
      detail:
        result.risk.score == null
          ? "No score was produced, so no alert was created."
          : "The heuristic score is below the high threshold (60). No prototype alert was created.",
    };
  }
  return {
    status: "prototype_alert",
    level: local.level,
    headline: local.headline,
    detail: local.message,
  };
}
