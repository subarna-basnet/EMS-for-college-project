import { geocode } from "@/services/geocode";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) {
    return NextResponse.json(
      { error: "Enter at least 2 characters, or a latitude and longitude." },
      { status: 400 },
    );
  }
  const result = await geocode(query);
  return NextResponse.json(result);
}
