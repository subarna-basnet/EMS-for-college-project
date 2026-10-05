"use client";

import PlaceSearch from "@/components/PlaceSearch";
import { formatCoord } from "@/lib/coords";
import { RISK_COLOR, RISK_LABEL } from "@/lib/risk-style";
import { useMonitor } from "@/components/monitor-context";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { RiskLevel } from "@/types";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-[#dfe7e4] text-sm text-muted">Loading map…</div>
  ),
});

const LEVELS: RiskLevel[] = ["low", "moderate", "high", "critical"];

export default function MapView() {
  const { selected, focusNonce, select, analysis, mode } = useMonitor();
  const [showZones, setShowZones] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showModis, setShowModis] = useState(false);
  const modisDate =
    mode === "live" && analysis?.satellite.status === "link_ready" ? analysis.satellite.afterDate : null;
  const markerLevel =
    analysis &&
    Math.abs(analysis.location.lat - selected.lat) < 0.0001 &&
    Math.abs(analysis.location.lon - selected.lon) < 0.0001
      ? analysis.risk.level
      : null;

  return (
    <div className="map-shell relative h-full">
      <MapCanvas
        selected={selected}
        focusNonce={focusNonce}
        riskLevel={markerLevel}
        showZones={showZones}
        showEvents={showEvents}
        showModis={showModis && mode === "live"}
        modisDate={modisDate}
        onSelect={(location) => select(location)}
      />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto absolute left-3 top-3 w-[min(22rem,calc(100%-5.5rem))] space-y-2">
          <div className="rounded-md border border-line bg-card/95 p-2 shadow-sm">
            <PlaceSearch compact />
            <p className="mt-1 font-mono text-[11px] text-muted" data-testid="coord-readout">
              {formatCoord(selected.lat, selected.lon)}
            </p>
          </div>
          <details className="rounded-md border border-line bg-card/95 p-2 text-xs shadow-sm">
            <summary className="cursor-pointer font-semibold">Layers</summary>
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={showZones} onChange={(event) => setShowZones(event.target.checked)} />
              Sample risk zones
            </label>
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={showEvents} onChange={(event) => setShowEvents(event.target.checked)} />
              Catalog sites
            </label>
            <label className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={showModis && mode === "live"}
                disabled={mode !== "live" || !modisDate}
                onChange={(event) => setShowModis(event.target.checked)}
              />
              MODIS true color
              {mode !== "live" ? <span className="text-muted">(Live Data)</span> : null}
            </label>
          </details>
        </div>
        <div className="pointer-events-none absolute bottom-7 left-3 max-w-[16rem] rounded-md border border-line bg-card/95 p-2 text-xs shadow-sm">
          <p className="font-semibold">Legend</p>
          <ul className="mt-1 space-y-1">
            {LEVELS.map((level) => (
              <li key={level} className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: RISK_COLOR[level] }} />
                {RISK_LABEL[level]}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            Zone colours are demo scenarios, not a live hazard map. The selected marker uses the current analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
