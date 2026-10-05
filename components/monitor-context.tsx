"use client";

import { siteById } from "@/data/catalog";
import { isAnalysisResult, type AlertRecord, type AnalysisResult, type DataMode, type SelectedLocation } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ALERT_KEY = "tarra.alerts.v1";
const MODE_KEY = "tarra.mode";

const wayanad = siteById("wayanad-2024");
const initialLocation: SelectedLocation = {
  lat: wayanad?.lat ?? 11.462778,
  lon: wayanad?.lon ?? 76.134167,
  label: wayanad?.name ?? "Mundakkai–Chooralmala, Wayanad",
  catalogId: "wayanad-2024",
};

interface MonitorContextValue {
  hydrated: boolean;
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  selected: SelectedLocation;
  select: (location: SelectedLocation, options?: { focus?: boolean }) => void;
  focusNonce: number;
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyze: () => void;
  alerts: AlertRecord[];
  clearAlerts: () => void;
  modelRuns: number;
}

const MonitorContext = createContext<MonitorContextValue | null>(null);

function readAlerts(): AlertRecord[] {
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AlertRecord =>
        !!item &&
        typeof item === "object" &&
        typeof (item as AlertRecord).id === "string" &&
        ((item as AlertRecord).scope === "local" || (item as AlertRecord).scope === "regional"),
    );
  } catch {
    return [];
  }
}

function mergeAlerts(current: AlertRecord[], incoming: AlertRecord[]): AlertRecord[] {
  const seen = new Set(current.map((alert) => alert.id));
  const novel = incoming.filter((alert) => alert.id && !seen.has(alert.id));
  return [...novel, ...current].slice(0, 40);
}

export function MonitorProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setModeState] = useState<DataMode>("demo");
  const [selected, setSelected] = useState<SelectedLocation>(initialLocation);
  const [focusNonce, setFocusNonce] = useState(1);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [alertsReady, setAlertsReady] = useState(false);
  const [modelRuns, setModelRuns] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(MODE_KEY);
      if (stored === "live" || stored === "demo") setModeState(stored);
    } catch {
      /* ignore private-mode storage failures */
    }
    setAlerts(readAlerts());
    setAlertsReady(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode, hydrated]);

  useEffect(() => {
    if (!alertsReady) return;
    localStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
  }, [alerts, alertsReady]);

  const run = useCallback(async (location: SelectedLocation, nextMode: DataMode) => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lon: String(location.lon),
        mode: nextMode,
        label: location.label.slice(0, 180),
      });
      const response = await fetch(`/api/analyze?${params.toString()}`);
      const body: unknown = await response.json();
      if (id !== seq.current) return;
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Analysis failed.";
        setError(message);
        return;
      }
      if (!isAnalysisResult(body)) {
        setError("Unexpected response from the analysis service. Nothing was shown in its place.");
        return;
      }
      setAnalysis(body);
      if (body.alerts.length) setAlerts((current) => mergeAlerts(current, body.alerts));
      if (body.inference.modelConnected && body.inference.probability != null) {
        setModelRuns((count) => count + 1);
      }
    } catch {
      if (id !== seq.current) return;
      setError("The analysis request did not complete. No result was substituted.");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void run(selected, mode);
  }, [hydrated, mode, selected, run]);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const setMode = useCallback((next: DataMode) => {
    if (modeRef.current === next) return;
    modeRef.current = next;
    setModeState(next);
    setAnalysis(null);
    setError(null);
    setLoading(true);
  }, []);

  const select = useCallback((location: SelectedLocation, options?: { focus?: boolean }) => {
    setAnalysis(null);
    setError(null);
    setLoading(true);
    setSelected(location);
    if (options?.focus) setFocusNonce((value) => value + 1);
  }, []);

  const analyze = useCallback(() => {
    void run(selected, mode);
  }, [run, selected, mode]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  const value = useMemo(
    () => ({
      hydrated,
      mode,
      setMode,
      selected,
      select,
      focusNonce,
      analysis,
      loading,
      error,
      analyze,
      alerts,
      clearAlerts,
      modelRuns,
    }),
    [
      hydrated,
      mode,
      setMode,
      selected,
      select,
      focusNonce,
      analysis,
      loading,
      error,
      analyze,
      alerts,
      clearAlerts,
      modelRuns,
    ],
  );

  return <MonitorContext.Provider value={value}>{children}</MonitorContext.Provider>;
}

export function useMonitor(): MonitorContextValue {
  const value = useContext(MonitorContext);
  if (!value) throw new Error("useMonitor must be used inside MonitorProvider");
  return value;
}
