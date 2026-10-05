import PipelineBoard from "@/components/PipelineBoard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detection pipeline" };

export default function PipelinePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="font-serif text-3xl">Detection pipeline</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        The project brief describes a CNN, with ResNet and DenseNet as deeper variants: satellite image in, landslide
        area out. This page keeps that path visible. Stages that did not run say so.
      </p>
      <div className="mt-5">
        <PipelineBoard />
      </div>
    </main>
  );
}
