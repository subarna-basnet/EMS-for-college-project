import { checkProviders } from "@/services/health";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkProviders();
  return NextResponse.json(result);
}
