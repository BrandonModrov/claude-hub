"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format-utils";

interface HeatmapProps {
  dailyActivity: Record<string, number>;
}

export function ActivityHeatmap({ dailyActivity }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: string; count: number; x: number; y: number } | null>(null);

  const { weeks, months, max } = useMemo(() => {
    // Build 52 weeks ending today
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(0, 0, 0, 0);

    // Go back to start of the 52-week grid (Sunday of the week 52 weeks ago)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 363); // ~52 weeks
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let maxVal = 0;
    const weekData: { day: string; count: number; date: Date }[][] = [];
    const monthLabels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    let weekIdx = 0;
    let currentWeek: { day: string; count: number; date: Date }[] = [];

    while (cursor <= endDate) {
      const dayStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      const count = dailyActivity[dayStr] || 0;
      if (count > maxVal) maxVal = count;

      currentWeek.push({ day: dayStr, count, date: new Date(cursor) });

      // Track month labels
      if (cursor.getMonth() !== lastMonth) {
        monthLabels.push({
          label: cursor.toLocaleDateString("en-US", { month: "short" }),
          weekIdx,
        });
        lastMonth = cursor.getMonth();
      }

      if (cursor.getDay() === 6 || cursor.getTime() === endDate.getTime()) {
        weekData.push(currentWeek);
        currentWeek = [];
        weekIdx++;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weekData.push(currentWeek);
    }

    return { weeks: weekData, months: monthLabels, max: maxVal };
  }, [dailyActivity]);

  function getColor(count: number): string {
    if (count === 0) return "#27272a"; // zinc-800
    const intensity = Math.min(count / Math.max(max, 1), 1);
    if (intensity < 0.25) return "#164e3a";
    if (intensity < 0.5) return "#166534";
    if (intensity < 0.75) return "#15803d";
    return "#22c55e";
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
      <h2 className="font-black text-2xl mb-4">Activity</h2>

      {/* Month labels */}
      <div className="relative ml-8 mb-1 h-4">
        {months.map((m, i) => (
          <span
            key={`${m.label}-${i}`}
            className="absolute text-xs text-zinc-500"
            style={{ left: `${m.weekIdx * 14}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {dayLabels.map((label, i) => (
            <span key={i} className="text-[10px] text-zinc-500 h-[11px] leading-[11px] w-6 text-right">
              {label}
            </span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, di) => {
                const cell = week.find((c) => c.date.getDay() === di);
                if (!cell) return <div key={di} className="w-[11px] h-[11px]" />;
                return (
                  <div
                    key={di}
                    className="w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-colors"
                    style={{ backgroundColor: getColor(cell.count) }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parent = e.currentTarget.closest(".relative")!.getBoundingClientRect();
                      setTooltip({
                        day: cell.day,
                        count: cell.count,
                        x: rect.left - parent.left + rect.width / 2,
                        y: rect.top - parent.top - 8,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 ml-8">
        <span className="text-xs text-zinc-500 mr-1">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div
            key={v}
            className="w-[11px] h-[11px] rounded-[2px]"
            style={{ backgroundColor: getColor(v * Math.max(max, 1)) }}
          />
        ))}
        <span className="text-xs text-zinc-500 ml-1">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded pointer-events-none z-20 whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {formatNumber(tooltip.count)} messages on {new Date(tooltip.day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}
    </div>
  );
}
