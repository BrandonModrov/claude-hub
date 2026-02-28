"use client";

import Link from "next/link";
import { StatusDot } from "./status-dot";
import { formatDate } from "@/lib/format-utils";

interface ProjectCardProps {
  name: string;
  port: number;
  framework: string;
  running: boolean;
  url: string;
  lastActive: string | null;
  actionLoading: string | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onTerminal: () => void;
}

export function ProjectCard({
  name,
  port,
  framework,
  running,
  url,
  lastActive,
  actionLoading,
  onStart,
  onRestart,
  onTerminal,
}: ProjectCardProps) {
  const isLoading = actionLoading !== null;

  const frameworkLabel: Record<string, string> = {
    nextjs: "Next.js",
    vite: "Vite",
    other: "Node",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <StatusDot status={running ? "running" : "stopped"} />
          <h3 className="font-bold text-lg">{name}</h3>
        </div>
        <span className="text-xs text-zinc-500 font-mono">:{port}</span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-medium">
          {frameworkLabel[framework] || framework}
        </span>
        {lastActive && (
          <span className="text-xs text-zinc-500 ml-auto">{formatDate(lastActive)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          onClick={onTerminal}
          disabled={isLoading}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Open terminal at project directory"
        >
          {actionLoading === "terminal" ? (
            <Spinner />
          ) : (
            <>Terminal</>
          )}
        </button>

        <button
          onClick={running ? onRestart : onStart}
          disabled={isLoading}
          className={`flex-1 border rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            running
              ? "bg-amber-900/30 hover:bg-amber-900/50 border-amber-800 text-amber-300"
              : "bg-emerald-900/30 hover:bg-emerald-900/50 border-emerald-800 text-emerald-300"
          }`}
          title={running ? "Kill and restart dev server" : "Start dev server (auto-installs deps if needed)"}
        >
          {actionLoading === "start" || actionLoading === "restart" ? (
            <span className="flex items-center justify-center gap-1.5">
              <Spinner />
              <span className="text-xs">Setting up...</span>
            </span>
          ) : running ? (
            <>Restart</>
          ) : (
            <>Start</>
          )}
        </button>

        <Link
          href={`/projects/${encodeURIComponent(name)}`}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-center"
        >
          Stats
        </Link>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
    </div>
  );
}
