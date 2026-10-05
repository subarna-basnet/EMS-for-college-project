"use client";

import { formatWhen } from "@/lib/format";
import { RISK_LABEL } from "@/lib/risk-style";
import { useMonitor } from "@/components/monitor-context";
import type { AlertRecord } from "@/types";

function List({ title, alerts }: { title: string; alerts: AlertRecord[] }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      {alerts.length === 0 ? (
        <p className="mt-2 text-sm text-muted">None yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg border border-line bg-card p-3 text-sm leading-6">
              <p className="font-semibold">{alert.headline}</p>
              <p className="text-xs uppercase tracking-wide text-muted">
                {alert.scope} · {alert.mode === "demo" ? "Demo Data" : "Live Data"} · {RISK_LABEL[alert.level]} ·{" "}
                {formatWhen(alert.createdAt)}
              </p>
              <p className="mt-1">{alert.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AlertsPage() {
  const { alerts, clearAlerts } = useMonitor();
  const local = alerts.filter((alert) => alert.scope === "local");
  const regional = alerts.filter((alert) => alert.scope === "regional");

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Alerts</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Prototype alerts are created when the heuristic score reaches 60. They stay in this browser. Nothing is
            sent to an authority, and a demo alert is not a live warning.
          </p>
        </div>
        <button type="button" onClick={clearAlerts} className="rounded-md border border-line px-3 py-1.5 text-sm">
          Clear history
        </button>
      </div>
      <List title="Local alerts" alerts={local} />
      <List title="Regional alerts" alerts={regional} />
      <List title="Alert history" alerts={alerts} />
    </main>
  );
}
