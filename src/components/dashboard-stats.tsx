"use client";

import type { ClaudeStats } from "@/lib/stats";
import { formatNumber, formatCost, formatTokens } from "@/lib/format-utils";

interface DashboardStatsProps {
  stats: ClaudeStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens
    + stats.totalCacheReadTokens + stats.totalCacheCreateTokens;

  const items = [
    { label: "Sessions", value: formatNumber(stats.totalSessions) },
    { label: "Messages", value: formatNumber(stats.totalMessages) },
    { label: "Tokens", value: formatTokens(totalTokens) },
    { label: "Streak", value: `${stats.streakStats.currentStreak}d`, sub: "current" },
    { label: "Streak", value: `${stats.streakStats.longestStreak}d`, sub: "best" },
    { label: "API Equivalent", value: formatCost(stats.estimatedCost) },
  ];

  return (
    <div className="grid grid-cols-6 gap-4">
      {items.map((item) => (
        <div
          key={item.sub ? `${item.label}-${item.sub}` : item.label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center"
        >
          <p className="text-2xl font-black tracking-tight">{item.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          {"sub" in item && item.sub && (
            <p className="text-xs text-zinc-600 mt-0.5">{item.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
