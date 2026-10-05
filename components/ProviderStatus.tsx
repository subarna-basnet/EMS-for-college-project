"use client";

import { formatWhen } from "@/lib/format";
import { useState } from "react";

interface Check {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export default function ProviderStatus() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("status");
      const body = (await response.json()) as { checkedAt: string; providers: Check[] };
      setChecks(body.providers);
      setCheckedAt(body.checkedAt);
    } catch {
      setError("The provider check did not complete. That does not by itself change any analysis result.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Live provider check</h2>
        <button type="button" onClick={() => void run()} disabled={busy} className="rounded-md bg-accent px-3 py-1.5 text-sm text-white">
          {busy ? "Checking…" : "Check live providers"}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        This asks Open-Meteo, NASA GIBS, and Nominatim once. It does not fill in demo values when a provider is down.
      </p>
      {error ? <p className="mt-2 text-sm text-critical">{error}</p> : null}
      {checkedAt ? <p className="mt-2 text-xs text-muted">Checked {formatWhen(checkedAt)}</p> : null}
      {checks ? (
        <ul className="mt-3 space-y-2 text-sm">
          {checks.map((check) => (
            <li key={check.id} className="rounded-md border border-line px-3 py-2">
              <span className="font-semibold">{check.ok ? "Responding" : "Unavailable"}</span>
              <span> · {check.label}</span>
              <p className="text-xs text-muted">{check.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
