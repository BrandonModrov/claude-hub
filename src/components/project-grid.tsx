"use client";

import { useEffect, useState, useCallback } from "react";
import { ProjectCard } from "./project-card";

interface Project {
  name: string;
  path: string;
  port: number;
  framework: string;
  startCommand: string;
  running: boolean;
  url: string;
  lastActive: string | null;
}

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProjects(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll health status
  const pollHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) return;
      const health: Record<string, { healthy: boolean }> = await res.json();
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          running: health[p.name]?.healthy ?? p.running,
        }))
      );
    } catch { /* ignore poll failures */ }
  }, []);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(pollHealth, 10_000);
    return () => clearInterval(interval);
  }, [fetchProjects, pollHealth]);

  const doAction = async (name: string, action: string) => {
    setActionLoading((prev) => ({ ...prev, [name]: action }));
    try {
      const endpoint = action === "terminal"
        ? `/api/projects/${encodeURIComponent(name)}/terminal`
        : action === "start"
          ? `/api/projects/${encodeURIComponent(name)}/start`
          : action === "restart"
            ? `/api/projects/${encodeURIComponent(name)}/restart`
            : `/api/projects/${encodeURIComponent(name)}/stop`;

      await fetch(endpoint, { method: "POST" });

      // Refresh projects after action (give server time to start)
      if (action !== "terminal") {
        await new Promise((r) => setTimeout(r, 2000));
        await fetchProjects();
      }
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 text-lg">Error loading projects: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-zinc-400 text-lg py-20">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
        Discovering projects...
      </div>
    );
  }

  const runningCount = projects.filter((p) => p.running).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span>{projects.length} projects</span>
        <span className="text-emerald-500">{runningCount} running</span>
        <span className="text-red-400">{projects.length - runningCount} stopped</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <ProjectCard
            key={p.name}
            name={p.name}
            port={p.port}
            framework={p.framework}
            running={p.running}
            url={p.url}
            lastActive={p.lastActive}
            actionLoading={actionLoading[p.name] || null}
            onStart={() => doAction(p.name, "start")}
            onStop={() => doAction(p.name, "stop")}
            onRestart={() => doAction(p.name, "restart")}
            onTerminal={() => doAction(p.name, "terminal")}
          />
        ))}
      </div>
    </div>
  );
}
