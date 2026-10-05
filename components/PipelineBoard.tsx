"use client";

import { ARCHITECTURE_COLUMNS, BRIEF_NOTES } from "@/data/pipeline";
import { useMonitor } from "@/components/monitor-context";

const STATE_LABEL = {
  not_run: "Not run",
  done: "Done",
  skipped: "Skipped",
  unavailable: "Data unavailable",
  simulated: "Simulated",
} as const;

export default function PipelineBoard() {
  const { analysis } = useMonitor();
  const steps = analysis?.inference.steps ?? [];

  return (
    <div className="space-y-8">
      {analysis ? (
        <div className="rounded-lg border border-[#e7d7a8] bg-[#fff8e8] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5b10]" data-testid="pipeline-banner">
            {analysis.inference.banner}
          </p>
          <p className="mt-1 text-sm leading-6">{analysis.inference.detail}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Run an analysis from the monitor. Until then every model stage stays not run.</p>
      )}

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {(steps.length ? steps : [
          ["Satellite image", "not_run"],
          ["Preprocessing", "not_run"],
          ["Feature extraction", "not_run"],
          ["Landslide detection", "not_run"],
          ["Post-processing", "not_run"],
          ["Risk score", "not_run"],
          ["Alert", "not_run"],
        ].map(([title, state]) => ({ id: title, title, detail: "Not run yet.", state }))).map((step, index) => (
          <li key={step.id} className="rounded-lg border border-line bg-card p-3">
            <p className="text-[11px] text-muted">0{index + 1}</p>
            <p className="text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
              {STATE_LABEL[step.state as keyof typeof STATE_LABEL] ?? step.state}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-3 lg:grid-cols-3">
        {ARCHITECTURE_COLUMNS.map((column) => (
          <section key={column.title} className="rounded-lg border border-line bg-card p-4">
            <h2 className="font-semibold">{column.title}</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {column.steps.map((step) => (
                <li key={step} className="rounded-md border border-line px-3 py-2">
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-5 text-muted">{column.note}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {BRIEF_NOTES.map((note) => (
          <section
            key={note.title}
            className={`rounded-lg border p-4 ${
              note.tone === "ok"
                ? "border-[#cfe3d6] bg-[#f3faf5]"
                : note.tone === "risk"
                  ? "border-[#f0d0d0] bg-[#fdf6f6]"
                  : "border-[#d5e3ef] bg-[#f4f8fb]"
            }`}
          >
            <h2 className="font-semibold">{note.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6">
              {note.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-xs text-muted">
        The three notes restate limits from the project brief. They are not a claim that this prototype has solved them.
      </p>
    </div>
  );
}
