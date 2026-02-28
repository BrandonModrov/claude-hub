"use client";

import { formatDurationMs } from "@/lib/format-utils";
import type { StreakStats } from "@/lib/stats";

export function StreakBar({ streakStats }: { streakStats: StreakStats }) {
  const items = [
    { label: "Days Active", value: String(streakStats.daysActive) },
    { label: "Current Streak", value: `${streakStats.currentStreak}d` },
    { label: "Longest Streak", value: `${streakStats.longestStreak}d` },
    {
      label: "Most Active Day",
      value: streakStats.mostActiveDay
        ? new Date(streakStats.mostActiveDay + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "-",
      sub: streakStats.mostActiveDayMessages > 0 ? `${streakStats.mostActiveDayMessages} msgs` : undefined,
    },
    { label: "Avg Msgs/Day", value: String(streakStats.avgMessagesPerDay) },
    {
      label: "Avg Session",
      value: streakStats.avgSessionDurationMs > 0 ? formatDurationMs(streakStats.avgSessionDurationMs) : "-",
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-zinc-500 text-xs">{item.label}</p>
            <p className="font-black text-xl">{item.value}</p>
            {item.sub && <p className="text-zinc-600 text-xs">{item.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
