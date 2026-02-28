import { NextResponse } from "next/server";
import { getProjectConfig } from "@/lib/project-registry";
import { stopDevServer } from "@/lib/process-manager";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const config = getProjectConfig(name);
  if (!config) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = stopDevServer(config.port);
  return NextResponse.json(result);
}
