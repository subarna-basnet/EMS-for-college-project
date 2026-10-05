"use client";

import { useMonitor } from "@/components/monitor-context";
import { useState } from "react";

interface Hit {
  label: string;
  lat: number;
  lon: number;
  source: "coordinates" | "catalog" | "nominatim";
  catalogId: string | null;
}

export default function PlaceSearch({ compact = false }: { compact?: boolean }) {
  const { select } = useMonitor();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    const q = query.trim();
    if (q.length < 2) {
      setError("Enter at least 2 characters, or a latitude and longitude.");
      setHits([]);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const body = (await response.json()) as { error?: string; note?: string; results?: Hit[] };
      if (!response.ok) {
        setHits([]);
        setNote("");
        setError(body.error ?? "Search failed.");
        return;
      }
      setHits(body.results ?? []);
      setNote(body.note ?? "");
      if ((body.results ?? []).length === 0) setError("No matching place in the catalog or the place-name service.");
    } catch {
      setHits([]);
      setError("Place search did not complete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "" : "space-y-2"}>
      <form
        className="flex gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label className="sr-only" htmlFor={compact ? "map-search" : "panel-search"}>
          Search for a location
        </label>
        <input
          id={compact ? "map-search" : "panel-search"}
          data-testid={compact ? "map-search" : "panel-search"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Place, or lat lon"
          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm"
        />
        <button type="submit" className="rounded-md bg-accent px-3 py-1.5 text-sm text-white" disabled={busy}>
          {busy ? "…" : "Search"}
        </button>
      </form>
      {error ? <p className="mt-1 text-xs text-critical">{error}</p> : null}
      {note && hits.length > 0 ? <p className="mt-1 text-[11px] text-muted">{note}</p> : null}
      {hits.length > 0 ? (
        <ul className="mt-1 max-h-40 overflow-auto rounded-md border border-line bg-white text-sm">
          {hits.map((hit) => (
            <li key={`${hit.source}-${hit.lat}-${hit.lon}-${hit.label}`}>
              <button
                type="button"
                className="block w-full px-2.5 py-1.5 text-left hover:bg-paper"
                onClick={() => {
                  select(
                    {
                      lat: hit.lat,
                      lon: hit.lon,
                      label: hit.label,
                      catalogId: hit.catalogId,
                    },
                    { focus: true },
                  );
                  setHits([]);
                }}
              >
                <span className="block">{hit.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-muted">{hit.source}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
