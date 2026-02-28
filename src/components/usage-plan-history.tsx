"use client";

import type { UsageSnapshot } from "@/lib/usage-snapshots";

interface Props {
  snapshots: UsageSnapshot[];
}

function getZoneColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#10b981";
}

export function UsagePlanHistory({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-black text-2xl mb-4">Plan Utilization History</h2>
        <div className="text-center py-8">
          <p className="text-zinc-400 text-sm">
            Tracking started — utilization history will appear as data accumulates.
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            A snapshot is saved every 30 minutes when the dashboard is loaded.
          </p>
        </div>
      </div>
    );
  }

  const chartHeight = 160;
  const points = snapshots.map((s, i) => ({
    x: (i / (snapshots.length - 1)) * 100,
    y: s.sevenDay,
    timestamp: s.timestamp,
    fiveHour: s.fiveHour,
  }));

  // Build SVG polyline
  const polyline = points
    .map((p) => `${p.x},${100 - p.y}`)
    .join(" ");

  // Build gradient fill area
  const areaPath = `M ${points[0].x},100 ` +
    points.map((p) => `L ${p.x},${100 - p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},100 Z`;

  const latestPct = points[points.length - 1].y;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Plan Utilization History</h2>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: getZoneColor(latestPct) }}>
            {latestPct}%
          </span>
          <span className="text-zinc-600 text-xs block">current 7-day</span>
        </div>
      </div>
      <div className="relative" style={{ height: chartHeight }}>
        {/* Zone bands */}
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-[10] bg-red-950/20 border-b border-red-900/30" />
          <div className="flex-[20] bg-amber-950/10 border-b border-amber-900/20" />
          <div className="flex-[70] bg-emerald-950/10" />
        </div>
        {/* Zone labels */}
        <div className="absolute right-2 top-0 text-[10px] text-red-700">90%</div>
        <div className="absolute right-2 top-[10%] text-[10px] text-amber-700">70%</div>

        {/* SVG chart */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Fill area */}
          <path
            d={areaPath}
            fill="url(#utilGradient)"
            opacity="0.3"
          />
          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {/* Dots at each point */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={100 - p.y}
              r="2"
              fill={getZoneColor(p.y)}
              vectorEffect="non-scaling-stroke"
            >
              <title>
                {new Date(p.timestamp).toLocaleString()}: {p.y}% weekly, {p.fiveHour}% session
              </title>
            </circle>
          ))}
          <defs>
            <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* X-axis time labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-zinc-600">
          {new Date(snapshots[0].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span className="text-xs text-zinc-600">
          {new Date(snapshots[snapshots.length - 1].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <p className="text-xs text-zinc-600 mt-2">
        {snapshots.length} snapshots recorded
      </p>
    </div>
  );
}
