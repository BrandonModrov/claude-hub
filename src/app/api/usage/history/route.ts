import { NextResponse } from "next/server";
import { getSnapshots } from "@/lib/usage-snapshots";
import { parseClaudeData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const snapshots = getSnapshots(from, to);
  const stats = parseClaudeData(from || to ? { from, to } : undefined);

  return NextResponse.json({
    snapshots,
    stats: {
      dailyActivity: stats.dailyActivity,
      estimatedCost: stats.estimatedCost,
      costByModel: stats.costByModel,
      sessionTimeline: stats.sessionTimeline,
    },
  });
}
