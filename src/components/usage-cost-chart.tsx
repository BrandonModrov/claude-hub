"use client";

import { formatCost } from "@/lib/format-utils";
import type { SessionTimelineEntry } from "@/lib/stats";

interface Props {
  dailyActivity: Record<string, number>;
  sessions: SessionTimelineEntry[];
}

export function UsageCostChart({ sessions }: Props) {
  // Aggregate cost per day from sessions
  const dailyCost: Record<string, number> = {};
  for (const s of sessions) {
    const day = s.startTime.slice(0, 10);
    dailyCost[day] = (dailyCost[day] || 0) + s.estimatedCost;
  }

  const days = Object.keys(dailyCost).sort();
  if (days.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-black text-2xl mb-4">Daily Cost</h2>
        <p className="text-zinc-500 text-sm">No session data available yet.</p>
      </div>
    );
  }

  const maxCost = Math.max(...Object.values(dailyCost), 0.01);
  const totalCost = Object.values(dailyCost).reduce((a, b) => a + b, 0);
  const avgCost = days.length > 0 ? totalCost / days.length : 0;

  // Show last 30 days max for readability
  const displayDays = days.slice(-30);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Daily Cost</h2>
        <div className="text-right">
          <span className="text-lg font-bold text-emerald-400">{formatCost(totalCost)}</span>
          <span className="text-zinc-600 text-xs block">total ({formatCost(avgCost)}/day avg)</span>
        </div>
      </div>
      <div className="flex items-end gap-px" style={{ height: 160 }}>
        {displayDays.map((day) => {
          const cost = dailyCost[day];
          const pct = (cost / maxCost) * 100;
          const d = new Date(day + "T12:00:00");
          const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div
              key={day}
              className="flex-1 flex flex-col justify-end items-center group relative"
              style={{ minWidth: 0 }}
            >
              <div
                className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: "linear-gradient(180deg, #10b981, #059669)",
                  minHeight: 2,
                }}
                title={`${label}: ${formatCost(cost)}`}
              />
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {label}: {formatCost(cost)}
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis labels: first, middle, last */}
      {displayDays.length > 1 && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-zinc-600">
            {new Date(displayDays[0] + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="text-xs text-zinc-600">
            {new Date(displayDays[displayDays.length - 1] + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      )}
    </div>
  );
}
