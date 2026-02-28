import { NextResponse } from "next/server";
import { getProjectConfig } from "@/lib/project-registry";
import { openTerminal } from "@/lib/process-manager";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const config = getProjectConfig(name);
  if (!config) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = openTerminal(config.path);
  return NextResponse.json(result);
}
