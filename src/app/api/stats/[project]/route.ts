import { NextResponse } from "next/server";
import { parseProjectData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  const { project } = await params;
  const stats = parseProjectData(decodeURIComponent(project));

  if (!stats) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(stats);
}
