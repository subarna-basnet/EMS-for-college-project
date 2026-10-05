import { OPEN_METEO_FORECAST_URL } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import type { DailyRain, DataOrigin, RainfallInfo } from "@/types";

interface ForecastResponse {
  timezone?: string;
  daily?: {
    time?: string[];
    precipitation_sum?: Array<number | null>;
  };
}

const SOURCE_NAME = "Open-Meteo";
const SOURCE_URL = "https://open-meteo.com/";

export function emptyRainfall(detail: string, origin: DataOrigin = "unavailable"): RainfallInfo {
  return {
    origin,
    past48hMm: null,
    past7dMm: null,
    days: [],
    detail,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    retrievedAt: null,
  };
}

function sumLast(days: DailyRain[], count: number): number | null {
  if (days.length < count) return null;
  const slice = days.slice(-count);
  if (slice.some((day) => day.mm == null)) return null;
  const total = slice.reduce((sum, day) => sum + (day.mm ?? 0), 0);
  return Math.round(total * 10) / 10;
}

export function rainfallFromDaily(
  days: DailyRain[],
  detail: string,
  origin: DataOrigin,
  retrievedAt: string | null,
): RainfallInfo {
  const past48hMm = sumLast(days, 2);
  const past7dMm = sumLast(days, Math.min(7, days.length));
  const usable = past48hMm != null || past7dMm != null;
  return {
    origin: usable ? origin : "unavailable",
    past48hMm,
    past7dMm: days.length >= 7 ? past7dMm : null,
    days,
    detail: usable
      ? detail
      : "Data unavailable. The rainfall service returned no complete daily totals. Nothing was substituted.",
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    retrievedAt: usable ? retrievedAt : null,
  };
}

export async function fetchLiveRainfall(lat: number, lon: number): Promise<RainfallInfo> {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("past_days", "7");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  try {
    const body = await fetchJson<ForecastResponse>(url.toString());
    const time = body.daily?.time;
    const sums = body.daily?.precipitation_sum;
    if (!time || !sums || time.length !== sums.length || time.length === 0) {
      return emptyRainfall(
        "Data unavailable. Open-Meteo responded without a daily precipitation series. No rainfall value was substituted.",
      );
    }
    const days: DailyRain[] = time.map((date, index) => ({
      date,
      mm: typeof sums[index] === "number" ? sums[index] : null,
    }));
    const zone = body.timezone ? ` Time zone reported by the service: ${body.timezone}.` : "";
    return rainfallFromDaily(
      days,
      `Live data. Daily precipitation totals from Open-Meteo (millimetres). The latest day can be incomplete. The two-day figure is the sum of the two latest daily totals, not a rolling 48-hour gauge.${zone}`,
      "live",
      new Date().toISOString(),
    );
  } catch {
    return emptyRainfall(
      "Data unavailable. Open-Meteo did not respond. No rainfall value was substituted.",
    );
  }
}
