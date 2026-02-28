"use client";

import { formatCost } from "@/lib/format-utils";
import type { CostBreakdown } from "@/lib/stats";

const MODEL_COLORS: Record<string, string> = {
  opus: "#8b5cf6",
  sonnet: "#3b82f6",
  haiku: "#10b981",
};

function getModelColor(model: string): string {
  const lower = model.toLowerCase();
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#6b7280";
}

interface Props {
  costByModel: Record<string, CostBreakdown>;
}

export function UsageModelBreakdown({ costByModel }: Props) {
  const models = Object.entries(costByModel)
    .map(([name, cost]) => ({ name, cost: cost.totalCost }))
    .sort((a, b) => b.cost - a.cost);

  const totalCost = models.reduce((sum, m) => sum + m.cost, 0);
  const maxCost = Math.max(...models.map((m) => m.cost), 0.01);

  if (models.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-black text-2xl mb-4">Cost by Model</h2>
        <p className="text-zinc-500 text-sm">No cost data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Cost by Model</h2>
        <span className="text-lg font-bold text-emerald-400">{formatCost(totalCost)}</span>
      </div>
      <div className="space-y-3">
        {models.map(({ name, cost }) => {
          const pct = (cost / maxCost) * 100;
          const sharePct = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : "0";
          return (
            <div key={name}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-mono text-zinc-300">{name}</span>
                <span className="text-xs text-zinc-400">
                  {formatCost(cost)} <span className="text-zinc-600">({sharePct}%)</span>
                </span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getModelColor(name),
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
