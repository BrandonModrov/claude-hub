import { NextRequest, NextResponse } from "next/server";
import { getOverrides, setOverride, removeOverride } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getOverrides());
}

export async function POST(req: NextRequest) {
  const { sessionId, project } = await req.json();
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  if (!project || typeof project !== "string") {
    return NextResponse.json({ error: "project required" }, { status: 400 });
  }
  setOverride(sessionId, project);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  removeOverride(sessionId);
  return NextResponse.json({ ok: true });
}
