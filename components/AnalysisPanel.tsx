"use client";

import OriginPill from "@/components/OriginPill";
import PlaceSearch from "@/components/PlaceSearch";
import { CATALOG, siteById } from "@/data/catalog";
import { formatCoord, isValidLatLon } from "@/lib/coords";
import { formatDegrees, formatKm, formatMetres, formatMm, formatWhen } from "@/lib/format";
import { RISK_COLOR, RISK_LABEL } from "@/lib/risk-style";
import { zoneContains } from "@/services/landslide-records";
import { useMonitor } from "@/components/monitor-context";
import Link from "next/link";
import { useEffect, useState } from "react";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-t border-line py-2 sm:grid-cols-[9.25rem_minmax(0,1fr)] sm:gap-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm leading-5">{children}</dd>
    </div>
  );
}

export default function AnalysisPanel() {
  const { selected, select, analysis, loading, error, analyze, mode, hydrated } = useMonitor();
  const [latText, setLatText] = useState(selected.lat.toFixed(4));
  const [lonText, setLonText] = useState(selected.lon.toFixed(4));
  const [coordError, setCoordError] = useState("");

  useEffect(() => {
    setLatText(selected.lat.toFixed(4));
    setLonText(selected.lon.toFixed(4));
  }, [selected.lat, selected.lon]);

  const zone = CATALOG.find((site) => zoneContains(site, selected.lat, selected.lon));

  function useCoordinates() {
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!isValidLatLon(lat, lon)) {
      setCoordError("Enter a latitude from -90 to 90 and a longitude from -180 to 180.");
      return;
    }
    setCoordError("");
    select({ lat, lon, label: "Entered coordinates", catalogId: null }, { focus: true });
  }

  return (
    <aside className="flex flex-col rounded-lg border border-line bg-card lg:h-full lg:min-h-0 lg:overflow-hidden lg:rounded-none lg:border-y-0 lg:border-r-0">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-3 py-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Heuristic risk score</p>
          <p className="font-serif text-4xl leading-none" data-testid="risk-score">
            {!analysis || loading ? "—" : analysis.risk.score == null ? "—" : analysis.risk.score}
          </p>
        </div>
        <p
          data-testid="risk-level"
          className="rounded-md px-3 py-2 text-sm font-semibold text-white"
          style={{ background: analysis && !loading && analysis.risk.level ? RISK_COLOR[analysis.risk.level] : "#64748b" }}
        >
          {!analysis || loading ? "Updating" : analysis.risk.level ? RISK_LABEL[analysis.risk.level] : "Data unavailable"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-3 border-b border-line p-3">
        <h2 className="text-sm font-semibold">Analyze location</h2>
        <PlaceSearch />
        <div className="flex flex-wrap gap-1">
          {CATALOG.map((site) => (
            <button
              key={site.id}
              type="button"
              data-testid={`sample-${site.id}`}
              onClick={() =>
                select(
                  { lat: site.lat, lon: site.lon, label: site.name, catalogId: site.id },
                  { focus: true },
                )
              }
              className={`rounded-full border px-2 py-1 text-xs ${
                selected.catalogId === site.id ? "border-accent bg-accent text-white" : "border-line bg-white"
              }`}
            >
              {site.shortName}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">
            Latitude
            <input
              data-testid="lat-input"
              value={latText}
              onChange={(event) => setLatText(event.target.value)}
              className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm text-ink"
              inputMode="decimal"
            />
          </label>
          <label className="text-xs text-muted">
            Longitude
            <input
              data-testid="lon-input"
              value={lonText}
              onChange={(event) => setLonText(event.target.value)}
              className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm text-ink"
              inputMode="decimal"
            />
          </label>
        </div>
        {coordError ? <p className="text-xs text-critical">{coordError}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={useCoordinates} className="rounded-md border border-line px-3 py-1.5 text-sm">
            Use coordinates
          </button>
          <button
            type="button"
            data-testid="analyze"
            onClick={analyze}
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-white"
          >
            Analyze location
          </button>
        </div>
        <p className="font-mono text-xs text-muted" data-testid="selected-coord">
          {formatCoord(selected.lat, selected.lon)}
        </p>
      </div>

      <div className="space-y-3 p-3" aria-live="polite">
        {!hydrated || loading ? (
          <p className="text-sm text-muted">{mode === "live" ? "Requesting live sources…" : "Loading demo scenario…"}</p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-[#e7c1c1] bg-[#fdf6f6] p-2 text-sm text-critical" role="alert">
            {error}
          </p>
        ) : null}

        {analysis ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <OriginPill origin={analysis.mode === "live" ? "live" : "demo"} label={analysis.mode === "live" ? "Live Data" : "Demo Data"} />
              {analysis.risk.incomplete ? (
                <span className="text-xs text-muted">Partial score — missing inputs were excluded, not guessed.</span>
              ) : null}
            </div>
            <p className="text-sm leading-5 text-muted">
              {analysis.mode === "demo"
                ? "Demo data. Figures below are either cited from a named source or marked as illustrative. They are not live observations."
                : "Live data where a source responded. Missing sources stay blank. Demo numbers are not copied into this view."}
            </p>

            {analysis.mode === "demo" && !analysis.scenarioMatched ? (
              <div className="rounded-md border border-line bg-paper p-2 text-sm">
                <p>No demo scenario for this point. Pick a sample, or switch to Live Data to request rainfall and elevation.</p>
                {analysis.nearestSample ? (
                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-accent underline"
                    onClick={() => {
                      const site = siteById(analysis.nearestSample?.id ?? "");
                      if (!site) return;
                      select(
                        { lat: site.lat, lon: site.lon, label: site.name, catalogId: site.id },
                        { focus: true },
                      );
                    }}
                  >
                    Load {analysis.nearestSample.name} demo scenario ({formatKm(analysis.nearestSample.km)})
                  </button>
                ) : null}
              </div>
            ) : null}

            {zone && analysis.mode === "live" ? (
              <p className="text-xs text-muted">
                The coloured {zone.shortName} box is a demo-catalog extent, not a live hazard zone. The score below uses this request only.
              </p>
            ) : null}
            {zone && analysis.mode === "demo" && !analysis.scenarioMatched ? (
              <p className="text-xs text-muted">
                This point is inside the {zone.shortName} sample box. The prepared scenario is used only within 8 km of the catalog coordinate.
              </p>
            ) : null}

            <p className="text-xs text-muted">0–100. Not a probability. The number above is this result only.</p>

            <div>
              <h3 className="text-sm font-semibold">Contributing factors</h3>
              <ul className="mt-2 space-y-2">
                {analysis.risk.factors.map((factor) => (
                  <li key={factor.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{factor.label}</span>
                      <OriginPill origin={factor.origin} />
                    </div>
                    <p className="text-xs leading-5 text-muted">{factor.detail}</p>
                    {factor.contribution == null ? (
                      <p className="text-xs">Not scored{factor.weight === 0 ? " — weight 0 until a change metric exists" : ""}</p>
                    ) : (
                      <div className="mt-1 h-1.5 rounded bg-paper">
                        <div className="h-1.5 rounded bg-accent" style={{ width: `${factor.contribution}%` }} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] leading-4 text-muted">{analysis.risk.method}</p>
            </div>

            <dl>
              <Row label="Current risk level">
                {analysis.risk.level ? RISK_LABEL[analysis.risk.level] : "Data unavailable"}
              </Row>
              <Row label="Probability / confidence">
                <span className="mb-1 block">
                  <OriginPill origin={analysis.inference.origin === "live" ? "live" : analysis.inference.origin} />
                </span>
                <span data-testid="inference-banner" className="font-semibold">
                  {analysis.inference.banner}
                </span>
                <span className="mt-1 block" data-testid="confidence">
                  {analysis.inference.probability == null
                    ? "Data unavailable — no confidence was produced."
                    : `${Math.round(analysis.inference.probability * 100)}% from ${analysis.inference.modelName ?? "the model"}.`}
                </span>
                <span className="mt-1 block text-muted">{analysis.inference.detail}</span>
              </Row>
              <Row label="Recent rainfall">
                <span className="mb-1 block" data-testid="rainfall-origin">
                  <OriginPill origin={analysis.rainfall.origin} />
                </span>
                <span data-testid="rainfall-value">
                  Two-day total {formatMm(analysis.rainfall.past48hMm)}
                  <span className="text-muted"> · </span>
                  Seven-day total {formatMm(analysis.rainfall.past7dMm)}
                </span>
                <span className="mt-1 block text-muted">{analysis.rainfall.detail}</span>
                {analysis.rainfall.days.length > 0 ? (
                  <span className="mt-2 flex h-10 items-end gap-1">
                    {analysis.rainfall.days.map((day) => {
                      const max = Math.max(...analysis.rainfall.days.map((item) => item.mm ?? 0), 1);
                      const height = Math.max(4, ((day.mm ?? 0) / max) * 100);
                      return (
                        <span
                          key={day.date}
                          title={`${day.date}: ${day.mm == null ? "missing" : `${day.mm} mm`}`}
                          className="flex-1 rounded-sm bg-accent/80"
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </span>
                ) : null}
              </Row>
              <Row label="Terrain / slope">
                <span className="mb-1 block">
                  <OriginPill origin={analysis.terrain.slopeDeg == null && analysis.terrain.elevationM == null ? "unavailable" : analysis.terrain.origin} />
                </span>
                Elevation {formatMetres(analysis.terrain.elevationM)}
                <span className="text-muted"> · </span>
                Slope {formatDegrees(analysis.terrain.slopeDeg)}
                <span className="mt-1 block text-muted">{analysis.terrain.detail}</span>
              </Row>
              <Row label="Historical landslides">
                <span className="mb-1 block">
                  <OriginPill origin={analysis.history.origin} label="Sample catalog" />
                </span>
                <span>{analysis.history.detail}</span>
                <ul className="mt-1 space-y-1">
                  {analysis.history.events.slice(0, 3).map((event) => (
                    <li key={event.id}>
                      <a className="font-semibold text-accent underline" href={event.citationUrl}>
                        {event.name}
                      </a>
                      <span className="text-muted">
                        {" "}
                        · {event.occurredOn || "reference"} · {formatKm(event.km)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Row>
              <Row label="Last satellite observation">
                <span className="mb-1 block">
                  <OriginPill
                    origin={analysis.satellite.origin}
                    label={
                      analysis.satellite.status === "link_ready"
                        ? "Live link"
                        : analysis.satellite.status === "demo"
                          ? "Demo data"
                          : "Data unavailable"
                    }
                  />
                </span>
                {analysis.satellite.status === "link_ready"
                  ? `Requested ${analysis.satellite.afterDate} (${analysis.satellite.sensor}). The tile is confirmed only after it loads on the imagery page.`
                  : analysis.satellite.status === "demo"
                    ? "Demo data. Illustrative drawing, not an observation."
                    : "Data unavailable"}
                <span className="mt-1 block text-muted">{analysis.satellite.detail}</span>
                <Link href="/imagery" className="mt-1 inline-block text-accent underline">
                  Open imagery
                </Link>
              </Row>
              <Row label="Data timestamp">{formatWhen(analysis.analyzedAt)}</Row>
              <Row label="Warning status">
                <span data-testid="warning-status" className="font-semibold">
                  {analysis.warning.headline}
                </span>
                <span className="mt-1 block text-muted">{analysis.warning.detail}</span>
              </Row>
            </dl>

            <p className="text-[11px] leading-4 text-muted">{analysis.disclaimer}</p>
            <Link href="/pipeline" className="inline-block text-sm text-accent underline">
              View detection pipeline
            </Link>
          </>
        ) : null}
      </div>
      </div>
    </aside>
  );
}
