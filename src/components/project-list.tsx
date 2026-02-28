"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format-utils";

interface Project {
  name: string;
  port: number;
  framework: string;
  running: boolean;
  url: string;
  lastActive: string | null;
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      setProjects(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 15_000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
          Loading projects...
        </div>
      </div>
    );
  }

  const running = projects.filter((p) => p.running).length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-2xl">Projects</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-500">{running} running</span>
          <span className="text-zinc-500">{projects.length} total</span>
          <Link
            href="/projects"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Manage &rarr;
          </Link>
        </div>
      </div>
      <div className="divide-y divide-zinc-800">
        {projects.map((p) => (
          <div key={p.name} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                p.running ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            />
            {p.running ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm text-zinc-100 hover:text-amber-400 transition-colors"
              >
                {p.name}
              </a>
            ) : (
              <span className="font-medium text-sm text-zinc-500">
                {p.name}
              </span>
            )}
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs font-mono text-zinc-500">
              :{p.port}
            </span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-500">
              {p.framework}
            </span>
            <span className="flex-1" />
            {p.lastActive && (
              <span className="text-xs text-zinc-600">
                {formatDate(p.lastActive)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
