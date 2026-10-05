"use client";

import { formatWhen } from "@/lib/format";
import { useMonitor } from "@/components/monitor-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Monitor" },
  { href: "/imagery", label: "Imagery" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/alerts", label: "Alerts" },
  { href: "/sources", label: "Data & sources" },
];

export default function Header() {
  const pathname = usePathname();
  const { mode, setMode, analysis, loading } = useMonitor();
  const updated = loading ? "Updating…" : analysis ? formatWhen(analysis.analyzedAt) : "Not run yet";

  return (
    <header className="shrink-0 border-b border-line bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="#0b3a4a" />
            <path d="M5 23.5 13 12l5 6 8-9" fill="none" stroke="#f7f4ee" strokeWidth="2" />
            <path d="M5 26h22" stroke="#c4552a" strokeWidth="2" />
          </svg>
          <span>
            <span className="block font-serif text-[1.65rem] leading-none tracking-tight">Tarra</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">for a safer nation</span>
          </span>
        </Link>
        <p className="text-sm text-muted">
          AI-powered landslide monitoring
          <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            Research prototype
          </span>
        </p>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto" aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm ${
                  active ? "bg-accent text-white" : "text-ink hover:bg-paper"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted" data-testid="last-updated">
            Last updated <span className="text-ink">{updated}</span>
          </p>
          <div className="flex rounded-md border border-line p-0.5" role="group" aria-label="Data mode">
            <button
              type="button"
              data-testid="mode-demo"
              aria-pressed={mode === "demo"}
              onClick={() => setMode("demo")}
              className={`rounded px-2.5 py-1 text-sm ${mode === "demo" ? "bg-[#f3e2b3] font-semibold text-[#6a4b08]" : "text-muted"}`}
            >
              Demo Data
            </button>
            <button
              type="button"
              data-testid="mode-live"
              aria-pressed={mode === "live"}
              onClick={() => setMode("live")}
              className={`rounded px-2.5 py-1 text-sm ${mode === "live" ? "bg-[#d9eee3] font-semibold text-low" : "text-muted"}`}
            >
              Live Data
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
