export function formatWhen(iso: string | null): string {
  if (!iso) return "Data unavailable";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMm(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "Data unavailable";
  return `${value.toFixed(1)} mm`;
}

export function formatDegrees(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "Data unavailable";
  return `${value.toFixed(1)}°`;
}

export function formatMetres(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "Data unavailable";
  return `${Math.round(value)} m`;
}

export function formatKm(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "Data unavailable";
  if (value < 10) return `${value.toFixed(1)} km`;
  return `${Math.round(value)} km`;
}
