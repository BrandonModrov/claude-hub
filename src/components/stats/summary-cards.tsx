"use client";

import { formatTokens, formatNumber, formatCost } from "@/lib/format-utils";
import type { ClaudeStats } from "@/lib/stats";

interface Card {
  label: string;
  value: string;
  sub: string;
  color?: string;
}

export function SummaryCards({ stats }: { stats: ClaudeStats }) {
  const totalInput = stats.totalInputTokens + stats.totalCacheReadTokens + stats.totalCacheCreateTokens;
  const totalTokens = totalInput + stats.totalOutputTokens;
  const cacheHitRate = totalInput > 0
    ? ((stats.totalCacheReadTokens / totalInput) * 100).toFixed(1)
    : "0";

  const rows: Card[][] = [
    // Row 1: Activity
    [
      { label: "Days Active", value: String(stats.streakStats.daysActive), sub: `avg ${stats.streakStats.avgMessagesPerDay} msgs/day` },
      { label: "Sessions", value: formatNumber(stats.totalSessions), sub: `across ${stats.projectStats.length} projects` },
      { label: "Messages", value: formatNumber(stats.totalMessages), sub: "assistant responses" },
    ],
    // Row 2: Tokens
    [
      { label: "Input", value: formatTokens(stats.totalInputTokens), sub: "prompts + context (non-cached)", color: "text-blue-400" },
      { label: "Output", value: formatTokens(stats.totalOutputTokens), sub: "code and responses written", color: "text-amber-400" },
      { label: "Total Tokens", value: formatTokens(totalTokens), sub: `incl. ${formatTokens(stats.totalCacheReadTokens)} cache reads (${cacheHitRate}% hit rate)` },
    ],
    // Row 3: Effort
    [
      { label: "Tool Calls", value: formatNumber(stats.totalToolCalls), sub: `${Object.keys(stats.toolUsage).length} different tools` },
      { label: "Hours Logged", value: stats.totalHoursEstimate.toFixed(1), sub: "estimated from sessions" },
      { label: "Cost", value: formatCost(stats.estimatedCost), sub: "API equivalent" },
    ],
  ];

  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-4">
          {row.map((c) => (
            <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-400 text-sm">{c.label}</p>
              <p className={`font-black text-3xl mt-1 ${c.color || ""}`}>{c.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
