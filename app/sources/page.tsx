import ProviderStatus from "@/components/ProviderStatus";
import { SOURCES } from "@/data/sources";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data and sources" };

export default function SourcesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <header>
        <h1 className="font-serif text-3xl">Data and sources</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tarra only shows a number when a named source provided it, or when the screen says demo data. The project
          brief studied public landslide research and named the archives below. Several of them are not wired up yet.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["12.6%", "of India's land area, about 0.42 million km², is described as landslide-prone in the project brief."],
          ["80,000", "landslides mapped across 147 districts in 17 states and 2 union territories, 1998–2022, as stated in the brief and the ISRO / NRSC atlas."],
          ["298", "lives lost at Wayanad on 30 July 2024 after 578 mm of rain in 48 hours, as stated in the brief. Other reports differ because they were written at different times."],
        ].map(([value, note]) => (
          <article key={value} className="rounded-lg border border-line bg-card p-3">
            <p className="font-serif text-3xl">{value}</p>
            <p className="text-xs leading-5 text-muted">{note}</p>
          </article>
        ))}
      </section>
      <p className="text-xs text-muted">
        Those three figures are context from the brief. They are not measurements taken by this application.
      </p>

      <ProviderStatus />

      <div className="space-y-3">
        {SOURCES.map((source) => (
          <article key={source.id} className="rounded-lg border border-line bg-card p-4">
            <h2 className="text-lg font-semibold">
              <a className="text-accent underline" href={source.url}>
                {source.name}
              </a>
            </h2>
            {source.extraUrl ? (
              <a className="text-sm text-accent underline" href={source.extraUrl.url}>
                {source.extraUrl.label}
              </a>
            ) : null}
            <p className="mt-2 text-sm leading-6">{source.role}</p>
            <p className="mt-1 text-sm leading-6">
              <span className="font-semibold">In this prototype. </span>
              {source.inThisMvp}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">{source.attribution}</p>
          </article>
        ))}
      </div>

      <section className="rounded-lg border border-line bg-card p-4 text-sm leading-6">
        <h2 className="font-semibold">Sample catalog</h2>
        <p className="mt-1 text-muted">
          Map zones are boxes drawn around five sites so the demo has something to click. They are not ISRO hazard
          boundaries, not GLIMS outlines, and not a USGS inventory. Each event card cites the public report used to
          place it. The source deck also includes an unrelated slide about seismic building types. That slide is not
          part of Tarra.
        </p>
        <p className="mt-2 text-muted">
          Project brief team member: Priyanka Lamsal. Tagline on the brief: Tarra, for a safer nation.
        </p>
      </section>
    </main>
  );
}
