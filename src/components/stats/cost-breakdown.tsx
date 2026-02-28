"use client";

import { formatCost, formatTokens } from "@/lib/format-utils";
import type { CostBreakdown as CostBreakdownType, CacheEfficiency } from "@/lib/stats";

export function CostBreakdown({ costByModel, totalCost, cacheHitRate, cacheEfficiency }: {
  costByModel: Record<string, CostBreakdownType>;
  totalCost: number;
  cacheHitRate: number;
  cacheEfficiency?: CacheEfficiency;
}) {
  const entries = Object.entries(costByModel).sort(([, a], [, b]) => b.totalCost - a.totalCost);
  const maxCost = Math.max(...entries.map(([, v]) => v.totalCost), 0.01);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-black text-2xl">Cost</h2>
        <span className="text-2xl font-bold text-emerald-400">{formatCost(totalCost)}</span>
      </div>
      <p className="text-zinc-600 text-xs mb-4">API equivalent — actual cost depends on your plan</p>

      <div className="space-y-3">
        {entries.map(([model, cost]) => {
          const pct = (cost.totalCost / maxCost) * 100;
          return (
            <div key={model}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-mono">{model}</span>
                <span className="text-zinc-400 text-sm">{formatCost(cost.totalCost)}</span>
              </div>
              <div className="h-5 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #10b981, #059669)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {cacheEfficiency && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs">Cache hit rate</span>
            <span className="text-emerald-400 font-bold text-sm">{(cacheHitRate * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs">Reads</span>
            <span className="text-zinc-300 text-sm">{formatTokens(cacheEfficiency.totalCacheReads)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs">Saved</span>
            <span className="text-emerald-400 text-sm">{formatCost(cacheEfficiency.estimatedSavings)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
