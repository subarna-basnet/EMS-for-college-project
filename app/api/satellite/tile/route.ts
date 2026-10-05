import { USER_AGENT } from "@/lib/config";
import { gibsTileUrl, parseTileQuery } from "@/lib/tiles";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = parseTileQuery({
    date: params.get("date"),
    z: params.get("z"),
    x: params.get("x"),
    y: params.get("y"),
  });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const upstream = await fetch(gibsTileUrl(parsed.date, parsed.tile), {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: "image/jpeg", "User-Agent": USER_AGENT },
    });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !type.includes("image")) {
      return NextResponse.json(
        { error: "Data unavailable. NASA GIBS did not return an image for that tile." },
        { status: 502 },
      );
    }
    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
        "X-Tarra-Source": "NASA-GIBS-MODIS-Terra",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Data unavailable. NASA GIBS did not respond." },
      { status: 502 },
    );
  }
}
