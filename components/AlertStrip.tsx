"use client";

import { RISK_LABEL } from "@/lib/risk-style";
import { formatWhen } from "@/lib/format";
import { useMonitor } from "@/components/monitor-context";
import Link from "next/link";

export default function AlertStrip() {
  const { alerts, modelRuns } = useMonitor();
  const recent = alerts.slice(0, 2);

  return (
    <section className="shrink-0 rounded-lg border border-line bg-card px-3 py-2" data-testid="alert-strip">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Recent detections and alerts</h2>
        <Link href="/alerts" className="text-sm text-accent underline">
          Alert history
        </Link>
      </div>
      <p className="text-xs text-muted">
        {modelRuns === 0
          ? "Detections: none. No landslide model is connected, so nothing here is a detection."
          : `Model responses this session: ${modelRuns}.`}
      </p>
      {recent.length === 0 ? (
        <p className="mt-1 text-sm">No prototype alerts yet. A high or critical heuristic score creates one.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {recent.map((alert) => (
            <li key={alert.id} className="text-sm">
              <span className="font-semibold">{alert.headline}</span>
              <span className="text-muted">
                {" "}
                · {alert.locationLabel} · {RISK_LABEL[alert.level]} · {formatWhen(alert.createdAt)} ·{" "}
                {alert.mode === "demo" ? "Demo Data" : "Live Data"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
