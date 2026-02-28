import { NextResponse } from "next/server";
import { parseClaudeData } from "@/lib/stats";
import type { StatsFilters } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: StatsFilters = {};
  if (searchParams.get("from")) filters.from = searchParams.get("from")!;
  if (searchParams.get("to")) filters.to = searchParams.get("to")!;
  if (searchParams.get("project")) filters.project = searchParams.get("project")!;
  if (searchParams.get("model")) filters.model = searchParams.get("model")!;

  const stats = parseClaudeData(Object.keys(filters).length > 0 ? filters : undefined);
  return NextResponse.json(stats);
}
