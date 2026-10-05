"use client";

import AlertStrip from "@/components/AlertStrip";
import AnalysisPanel from "@/components/AnalysisPanel";
import MapView from "@/components/MapView";
import { CATALOG } from "@/data/catalog";
import { zoneFeatures } from "@/services/analyze";
import { useMonitor } from "@/components/monitor-context";

export default function Dashboard() {
  const { alerts, modelRuns } = useMonitor();
  const zones = zoneFeatures();
  const high = zones.features.filter(
    (feature) => feature.properties.level === "high" || feature.properties.level === "critical",
  ).length;
  const localAlerts = alerts.filter((alert) => alert.scope === "local").length;

  const cards = [
    {
      title: "Areas monitored",
      value: String(CATALOG.length),
      note: "Sample sites in this prototype, not a national network.",
    },
    {
      title: "High risk areas",
      value: String(high),
      note: "Demo scenarios at high or critical. Not a live warning map.",
    },
    {
      title: "Recent detections",
      value: String(modelRuns),
      note: modelRuns === 0 ? "No detection model is connected, so this stays at zero." : "Responses from the configured model this session.",
    },
    {
      title: "Active alerts",
      value: String(localAlerts),
      note: "Locations over the threshold, saved in this browser. Regional notices are listed with them.",
    },
  ];

  return (
    <div className="flex flex-col gap-3 p-3 lg:h-full lg:min-h-0">
      <section className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-lg border border-line bg-card px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{card.title}</h2>
            <p className="font-serif text-3xl leading-tight">{card.value}</p>
            <p className="text-[11px] leading-4 text-muted">{card.note}</p>
          </article>
        ))}
      </section>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-lg border border-line lg:h-auto lg:min-h-0">
          <MapView />
        </div>
        <AnalysisPanel />
      </div>
      <AlertStrip />
    </div>
  );
}
