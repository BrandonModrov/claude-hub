"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatNumber, formatTokens, formatCost, timeAgo } from "@/lib/format-utils";
import type { ProjectStat, ProjectTimelineEntry } from "@/lib/stats";

interface Props {
  projectStats: ProjectStat[];
  projectTimeline: ProjectTimelineEntry[];
}

export function ProjectPortfolio({ projectStats, projectTimeline }: Props) {
  const [view, setView] = useState<"timeline" | "table">("table");

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Projects</h2>
        <div className="flex gap-1 bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${view === "table" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            Table
          </button>
          <button
            onClick={() => setView("timeline")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${view === "timeline" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {view === "timeline" ? (
        <TimelineView data={projectTimeline} />
      ) : (
        <TableView projects={projectStats} />
      )}
    </div>
  );
}

function TimelineView({ data }: { data: ProjectTimelineEntry[] }) {
  const { allDays, dayLabels, maxMessages } = useMemo(() => {
    // Collect all unique days across all projects
    const daySet = new Set<string>();
    let maxMsg = 0;
    for (const p of data) {
      for (const [day, count] of Object.entries(p.dailyActivity || {})) {
        daySet.add(day);
        if (count > maxMsg) maxMsg = count;
      }
    }
    const days = Array.from(daySet).sort();

    // Build labels — show date for each day
    const labels: { day: string; label: string; idx: number }[] = [];
    let lastLabel = "";
    days.forEach((day, idx) => {
      const d = new Date(day + "T12:00:00");
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (label !== lastLabel) {
        labels.push({ day, label, idx });
        lastLabel = label;
      }
    });

    return { allDays: days, dayLabels: labels, maxMessages: maxMsg };
  }, [data]);

  const colors = [
    "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444",
    "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
  ];

  if (allDays.length === 0) return <p className="text-zinc-500 text-sm">No activity data</p>;

  return (
    <div className="space-y-2">
      {data.map((project, i) => {
        const color = colors[i % colors.length];
        const activity = project.dailyActivity || {};

        return (
          <div key={project.name} className="flex items-center gap-3">
            <Link
              href={`/projects/${encodeURIComponent(project.name)}`}
              className="w-32 text-sm font-medium truncate hover:text-amber-400 transition-colors flex-shrink-0"
            >
              {project.name}
            </Link>
            <div className="flex-1 h-6 bg-zinc-800 rounded-sm relative overflow-hidden flex">
              {allDays.map((day) => {
                const count = activity[day] || 0;
                const opacity = count > 0 ? Math.max(0.3, count / maxMessages) : 0;
                return (
                  <div
                    key={day}
                    className="flex-1 h-full border-r border-zinc-700/30"
                    style={{
                      backgroundColor: count > 0 ? color : "transparent",
                      opacity: count > 0 ? opacity : 1,
                    }}
                    title={count > 0 ? `${day}: ${formatNumber(count)} msgs` : day}
                  />
                );
              })}
            </div>
            <span className="text-zinc-500 text-xs w-20 text-right flex-shrink-0">
              {project.sessions}s · {formatNumber(project.messages)}m
            </span>
          </div>
        );
      })}

      {/* Day labels */}
      <div className="relative ml-[8.5rem] mr-[5.75rem] mt-1 h-4">
        {dayLabels
          .filter((_, i, arr) => {
            // Show at most ~10 labels to avoid crowding
            const step = Math.max(1, Math.floor(arr.length / 10));
            return i % step === 0 || i === arr.length - 1;
          })
          .map((dl) => (
            <span
              key={dl.day}
              className="absolute text-[10px] text-zinc-600 font-mono"
              style={{ left: `${(dl.idx / Math.max(allDays.length - 1, 1)) * 100}%`, transform: "translateX(-50%)" }}
            >
              {dl.label}
            </span>
          ))}
      </div>
    </div>
  );
}

function TableView({ projects }: { projects: ProjectStat[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-zinc-400 text-sm border-b border-zinc-800">
            <th className="pb-3 font-medium">Project</th>
            <th className="pb-3 font-medium text-right">Messages</th>
            <th className="pb-3 font-medium text-right">Tokens</th>
            <th className="pb-3 font-medium text-right">Est. Cost</th>
            <th className="pb-3 font-medium text-right">Sessions</th>
            <th className="pb-3 font-medium text-right">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="py-3">
                <Link
                  href={`/projects/${encodeURIComponent(p.name)}`}
                  className="text-sm font-medium hover:text-amber-400 transition-colors"
                >
                  {p.name}
                </Link>
              </td>
              <td className="py-3 text-right font-mono text-zinc-300 text-sm">{formatNumber(p.messages)}</td>
              <td className="py-3 text-right font-mono text-zinc-300 text-sm">{formatTokens(p.tokens)}</td>
              <td className="py-3 text-right font-mono text-emerald-400 text-sm">{formatCost(p.estimatedCost)}</td>
              <td className="py-3 text-right font-mono text-zinc-300 text-sm">{p.sessions}</td>
              <td className="py-3 text-right text-zinc-400 text-sm">{timeAgo(p.lastActive)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
