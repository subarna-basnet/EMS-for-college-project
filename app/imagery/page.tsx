import SatelliteCompare from "@/components/SatelliteCompare";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Satellite imagery" };

export default function ImageryPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="font-serif text-3xl">Satellite imagery</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        Before, after, and a difference view for the selected point. Live Data requests MODIS Terra browse tiles from
        NASA GIBS. Demo Data shows drawings, and those drawings are labelled as drawings.
      </p>
      <div className="mt-5">
        <SatelliteCompare />
      </div>
    </main>
  );
}
