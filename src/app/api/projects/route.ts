import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-registry";
import { healthCheck } from "@/lib/process-manager";
import { getAllSessions } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = getAllProjects();

  // Build last-active map from session data
  const lastActiveMap: Record<string, string> = {};
  for (const s of getAllSessions()) {
    const proj = s.project.toLowerCase();
    if (!lastActiveMap[proj] || s.lastActive > lastActiveMap[proj]) {
      lastActiveMap[proj] = s.lastActive;
    }
  }

  const results = await Promise.all(
    Object.entries(projects).map(async ([name, config]) => {
      const running = await healthCheck(config.port);
      return {
        name,
        path: config.path,
        port: config.port,
        framework: config.framework,
        startCommand: config.startCommand,
        running,
        url: `http://localhost:${config.port}`,
        lastActive: lastActiveMap[name.toLowerCase()] || null,
      };
    })
  );

  results.sort((a, b) => {
    if (a.name === "codecenter") return -1;
    if (b.name === "codecenter") return 1;
    if (a.running !== b.running) return a.running ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(results);
}
