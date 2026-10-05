import type { RiskLevel } from "@/types";

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: "#1d6b45",
  moderate: "#8a6a12",
  high: "#b45309",
  critical: "#9f1239",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
  critical: "Critical",
};

export const ALERT_THRESHOLD = 60;
