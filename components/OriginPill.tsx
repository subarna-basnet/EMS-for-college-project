import type { DataOrigin } from "@/types";

const LABEL: Record<DataOrigin, string> = {
  live: "Live data",
  derived: "Computed",
  catalog: "Cited source",
  demo: "Demo data",
  simulated: "Simulated",
  unavailable: "Data unavailable",
};

export default function OriginPill({
  origin,
  label,
}: {
  origin: DataOrigin;
  label?: string;
}) {
  const text = label ?? LABEL[origin];
  const tone =
    origin === "live" || origin === "derived"
      ? "bg-[#e5f2ea] text-low"
      : origin === "catalog"
        ? "bg-[#e7eef5] text-[#1e3a5f]"
        : origin === "demo" || origin === "simulated"
          ? "bg-[#f8efd8] text-[#7a5b10]"
          : "bg-[#f3e8e8] text-critical";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tone}`}>
      {text}
    </span>
  );
}
