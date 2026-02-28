"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTokens, formatNumber, formatCost, formatDuration, formatDate, formatDurationMs } from "@/lib/format-utils";
import type { ProjectDetailStats, SessionTimelineEntry } from "@/lib/stats";

export function ProjectDetail({ projectName }: { projectName: string }) {
  const [stats, setStats] = useState<ProjectDetailStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats/${encodeURIComponent(projectName)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("No Claude Code data found for this project");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      setStats(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    }
  }, [projectName]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (error) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-400 text-lg">{error}</p>
        <p className="text-zinc-600 text-sm mt-2">
          This project may not have any Claude Code sessions yet.
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-3 text-zinc-400 text-lg py-20">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
        Loading project stats...
      </div>
    );
  }

  const totalTokens = stats.inputTokens + stats.outputTokens + stats.cacheReadTokens + stats.cacheCreateTokens;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Sessions", value: formatNumber(stats.sessions), sub: "total sessions" },
          { label: "Messages", value: formatNumber(stats.messages), sub: "assistant responses" },
          { label: "Tokens", value: formatTokens(totalTokens), sub: `${formatTokens(stats.inputTokens)} in · ${formatTokens(stats.outputTokens)} out` },
          { label: "Est. Cost", value: formatCost(stats.estimatedCost), sub: "based on API pricing" },
          { label: "Hours", value: stats.totalHoursEstimate.toFixed(1), sub: "estimated from sessions" },
          { label: "Tool Calls", value: formatNumber(stats.totalToolCalls), sub: "read, edit, bash, etc." },
        ].map((c) => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-lg">{c.label}</p>
            <p className="font-black text-3xl mt-1">{c.value}</p>
            <p className="text-zinc-500 text-sm mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HourlyChart data={stats.hourlyActivity} />
        <DailyChart data={stats.dailyActivity} />
      </div>

      {/* Model Usage */}
      <ModelChart data={stats.modelUsage} costByModel={stats.costByModel} />

      {/* Session History */}
      <SessionHistory sessions={stats.sessionHistory} />

      <p className="text-sm text-zinc-600 text-center pb-4">
        Data from ~/.claude/projects/ · {new Date(stats.generatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}

function HourlyChart({ data }: { data: Record<string, number> }) {
  const max = Math.max(...Object.values(data), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">When You Work</h2>
      <div className="space-y-1.5">
        {Array.from({ length: 24 }, (_, h) => {
          const count = data[h] || 0;
          const pct = (count / max) * 100;
          const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
          return (
            <div key={h} className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs w-8 text-right font-mono">{label}</span>
              <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden">
                {pct > 0 && (
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, #f59e0b, #ea580c)`,
                    }}
                  />
                )}
              </div>
              {count > 0 && <span className="text-zinc-500 text-xs w-12 font-mono">{formatNumber(count)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const recent = entries.slice(-60);
  const max = Math.max(...recent.map(([, v]) => v), 1);

  if (recent.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-black text-2xl mb-4">Daily Activity</h2>
        <p className="text-zinc-500">No daily activity data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Daily Activity</h2>
      <div className="flex items-end gap-px h-48">
        {recent.map(([day, count]) => {
          const pct = (count / max) * 100;
          const date = new Date(day + "T12:00:00");
          const label = `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
          return (
            <div
              key={day}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              <div
                className="w-full rounded-t-sm min-h-[2px]"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, #3b82f6, #1d4ed8)`,
                }}
              />
              <div className="absolute bottom-full mb-2 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {label}: {formatNumber(count)} msgs
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-zinc-600 mt-2 font-mono">
        <span>{recent[0][0]}</span>
        <span>{recent[recent.length - 1][0]}</span>
      </div>
    </div>
  );
}

function ModelChart({ data, costByModel }: { data: Record<string, { messages: number; inputTokens: number; outputTokens: number }>; costByModel: Record<string, { totalCost: number }> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens));
  const maxTokens = Math.max(...entries.map(([, v]) => v.inputTokens + v.outputTokens), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Model Usage</h2>
      <div className="space-y-3">
        {entries.map(([model, usage]) => {
          const total = usage.inputTokens + usage.outputTokens;
          const pct = (total / maxTokens) * 100;
          const cost = costByModel[model]?.totalCost || 0;
          return (
            <div key={model}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-lg font-mono">{model}</span>
                <span className="text-zinc-400 text-sm">
                  {formatTokens(total)} tokens · {formatNumber(usage.messages)} msgs · <span className="text-emerald-400">{formatCost(cost)}</span>
                </span>
              </div>
              <div className="h-5 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #8b5cf6, #6d28d9)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionHistory({ sessions }: { sessions: SessionTimelineEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? sessions : sessions.slice(0, 10);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Session History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-zinc-400 text-sm border-b border-zinc-800">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Slug</th>
              <th className="pb-3 font-medium text-right">Duration</th>
              <th className="pb-3 font-medium text-right">Messages</th>
              <th className="pb-3 font-medium text-right">Tokens</th>
              <th className="pb-3 font-medium text-right">Cost</th>
              <th className="pb-3 font-medium text-right">Model</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-3 text-zinc-300">{formatDate(s.startTime)}</td>
                <td className="py-3 text-zinc-400 text-sm">{s.slug || "-"}</td>
                <td className="py-3 text-right font-mono text-zinc-300">{formatDuration(s.startTime, s.endTime)}</td>
                <td className="py-3 text-right font-mono text-zinc-300">{formatNumber(s.messages)}</td>
                <td className="py-3 text-right font-mono text-zinc-300">{formatTokens(s.inputTokens + s.outputTokens)}</td>
                <td className="py-3 text-right font-mono text-emerald-400">{formatCost(s.estimatedCost)}</td>
                <td className="py-3 text-right text-zinc-400 text-sm font-mono">{s.model}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sessions.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showAll ? "Show less" : `Show all ${sessions.length} sessions`}
        </button>
      )}
    </div>
  );
}
