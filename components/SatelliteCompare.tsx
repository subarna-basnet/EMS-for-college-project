"use client";

import OriginPill from "@/components/OriginPill";
import { useMonitor } from "@/components/monitor-context";
import { useEffect, useRef, useState } from "react";

function Frame({
  title,
  url,
  caption,
}: {
  title: string;
  url: string | null;
  caption: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-card">
      <figcaption className="flex items-center justify-between border-b border-line px-3 py-2 text-sm font-semibold">
        {title}
      </figcaption>
      {url && !failed ? (
        // Tiles and demo drawings are same-origin or local files. next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={caption}
          className="aspect-video w-full bg-[#d5ded8] object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid aspect-video place-items-center bg-paper p-4 text-center text-sm">Data unavailable</div>
      )}
      <p className="px-3 py-2 text-xs leading-5 text-muted">{caption}</p>
    </figure>
  );
}

export default function SatelliteCompare() {
  const { analysis, mode } = useMonitor();
  const beforeRef = useRef<HTMLImageElement | null>(null);
  const afterRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [diffState, setDiffState] = useState<"idle" | "ready" | "failed">("idle");

  const satellite = analysis?.satellite;
  const beforeUrl = satellite?.status === "link_ready" ? satellite.beforeUrl : null;
  const afterUrl = satellite?.status === "link_ready" ? satellite.afterUrl : null;

  useEffect(() => {
    if (!beforeUrl || !afterUrl) {
      setDiffState("idle");
      return;
    }
    let cancelled = false;
    const before = new Image();
    const after = new Image();
    let loaded = 0;
    const fail = () => {
      if (!cancelled) setDiffState("failed");
    };
    const done = () => {
      loaded += 1;
      if (loaded < 2 || cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const scratchA = document.createElement("canvas");
      const scratchB = document.createElement("canvas");
      scratchA.width = scratchB.width = size;
      scratchB.height = scratchA.height = size;
      const ctxA = scratchA.getContext("2d");
      const ctxB = scratchB.getContext("2d");
      const out = canvas.getContext("2d");
      if (!ctxA || !ctxB || !out) {
        setDiffState("failed");
        return;
      }
      ctxA.drawImage(before, 0, 0, size, size);
      ctxB.drawImage(after, 0, 0, size, size);
      const dataA = ctxA.getImageData(0, 0, size, size);
      const dataB = ctxB.getImageData(0, 0, size, size);
      const image = out.createImageData(size, size);
      for (let i = 0; i < dataA.data.length; i += 4) {
        const delta =
          Math.abs(dataA.data[i] - dataB.data[i]) +
          Math.abs(dataA.data[i + 1] - dataB.data[i + 1]) +
          Math.abs(dataA.data[i + 2] - dataB.data[i + 2]);
        const mag = Math.min(255, delta * 2);
        image.data[i] = mag;
        image.data[i + 1] = mag;
        image.data[i + 2] = mag;
        image.data[i + 3] = 255;
      }
      out.putImageData(image, 0, 0);
      setDiffState("ready");
    };
    before.onload = done;
    after.onload = done;
    before.onerror = fail;
    after.onerror = fail;
    before.src = beforeUrl;
    after.src = afterUrl;
    beforeRef.current = before;
    afterRef.current = after;
    return () => {
      cancelled = true;
    };
  }, [beforeUrl, afterUrl]);

  if (!analysis || !satellite) {
    return <p className="text-sm text-muted">Run an analysis from the monitor to attach imagery to a point.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <OriginPill
          origin={satellite.origin}
          label={satellite.status === "link_ready" ? "Live link" : satellite.status === "demo" ? "Demo data" : "Data unavailable"}
        />
        <p className="text-sm text-muted">{mode === "demo" ? "Demo Data" : "Live Data"} · {analysis.location.label}</p>
      </div>
      <p className="text-sm leading-6">{satellite.detail}</p>
      <p className="text-xs text-muted">{satellite.attribution}</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <Frame
          title={satellite.beforeDate ? `Before · ${satellite.beforeDate}` : "Before"}
          url={satellite.beforeUrl}
          caption={satellite.status === "demo" ? "Illustrative drawing." : "MODIS browse tile, earlier date."}
        />
        <Frame
          title={satellite.afterDate ? `After · ${satellite.afterDate}` : "After"}
          url={satellite.afterUrl}
          caption={satellite.status === "demo" ? "Illustrative drawing." : "MODIS browse tile, later date."}
        />
        <figure className="overflow-hidden rounded-lg border border-line bg-card">
          <figcaption className="border-b border-line px-3 py-2 text-sm font-semibold">Difference</figcaption>
          {satellite.differenceUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={satellite.differenceUrl} alt="Illustrative difference drawing, not a change mask" className="aspect-video w-full object-cover" />
          ) : (
            <canvas ref={canvasRef} className={`aspect-video w-full ${diffState === "ready" ? "" : "hidden"}`} />
          )}
          {!satellite.differenceUrl && diffState !== "ready" ? (
            <div className="grid aspect-video place-items-center p-4 text-center text-sm">
              {diffState === "failed" ? "Data unavailable. The tiles could not be read, so no difference was computed." : "Loading tiles…"}
            </div>
          ) : null}
          <p className="px-3 py-2 text-xs leading-5 text-muted">
            {satellite.differenceUrl
              ? "Illustrative drawing. Not a computed mask."
              : "Absolute difference of the two browse tiles, brightened. Clouds and seasons show up. This is not a landslide mask and not a model output."}
          </p>
        </figure>
      </div>
    </div>
  );
}
