import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-registry";
import { healthCheck } from "@/lib/process-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = getAllProjects();

  const results: Record<string, { healthy: boolean; port: number }> = {};

  await Promise.all(
    Object.entries(projects).map(async ([name, config]) => {
      const healthy = await healthCheck(config.port);
      results[name] = { healthy, port: config.port };
    })
  );

  return NextResponse.json(results);
}
