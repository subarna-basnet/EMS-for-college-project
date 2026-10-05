import { analyzeLocation } from "@/services/analyze";
import { isValidLatLon } from "@/lib/coords";
import type { DataMode } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const mode = params.get("mode");
  const label = params.get("label") ?? undefined;

  if (!isValidLatLon(lat, lon)) {
    return NextResponse.json(
      { error: "Latitude must be between -90 and 90, and longitude between -180 and 180." },
      { status: 400 },
    );
  }
  if (mode !== "live" && mode !== "demo") {
    return NextResponse.json({ error: "Mode must be live or demo." }, { status: 400 });
  }

  const result = await analyzeLocation({
    lat,
    lon,
    mode: mode as DataMode,
    label: label?.slice(0, 180),
  });
  return NextResponse.json(result);
}
