"use client";

import { formatDurationMs } from "@/lib/format-utils";
import type { StreakStats } from "@/lib/stats";

export function StreakSidebar({ streakStats }: { streakStats: StreakStats }) {
  const items = [
    { label: "Days Active", value: String(streakStats.daysActive) },
    { label: "Current Streak", value: `${streakStats.currentStreak} days` },
    { label: "Longest Streak", value: `${streakStats.longestStreak} days` },
    {
      label: "Most Active Day",
      value: streakStats.mostActiveDay
        ? new Date(streakStats.mostActiveDay + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "-",
      sub: streakStats.mostActiveDayMessages > 0 ? `${streakStats.mostActiveDayMessages} messages` : undefined,
    },
    { label: "Avg Messages/Day", value: String(streakStats.avgMessagesPerDay) },
    {
      label: "Avg Session Length",
      value: streakStats.avgSessionDurationMs > 0 ? formatDurationMs(streakStats.avgSessionDurationMs) : "-",
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Streaks</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-zinc-500 text-sm">{item.label}</p>
            <p className="font-black text-2xl">{item.value}</p>
            {item.sub && <p className="text-zinc-600 text-xs">{item.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
