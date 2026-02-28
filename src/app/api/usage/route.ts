import { NextResponse } from "next/server";
import { fetchPlanUsage } from "@/lib/plan-usage";
import { saveSnapshot } from "@/lib/usage-snapshots";

export const dynamic = "force-dynamic";

export async function GET() {
  const usage = await fetchPlanUsage();

  if (!usage) {
    return NextResponse.json(
      { error: "Could not fetch plan usage. OAuth token may be expired." },
      { status: 503 }
    );
  }

  // Fire-and-forget: persist snapshot for historical tracking
  try { saveSnapshot(usage); } catch { /* ignore */ }

  return NextResponse.json(usage);
}
