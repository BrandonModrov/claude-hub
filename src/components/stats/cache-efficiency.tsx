"use client";

import { formatTokens, formatCost } from "@/lib/format-utils";
import type { CacheEfficiency as CacheEfficiencyType } from "@/lib/stats";

export function CacheEfficiency({ data }: { data: CacheEfficiencyType }) {
  const hitPct = (data.hitRate * 100).toFixed(1);
  const circumference = 2 * Math.PI * 45;
  const filled = (data.hitRate * circumference);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Cache Efficiency</h2>

      <div className="flex items-center gap-8">
        {/* Donut chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-black text-2xl text-emerald-400">{hitPct}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 flex-1">
          <div>
            <p className="text-zinc-500 text-sm">Cache Reads</p>
            <p className="font-bold text-lg">{formatTokens(data.totalCacheReads)} tokens</p>
          </div>
          <div>
            <p className="text-zinc-500 text-sm">Cache Creates</p>
            <p className="font-bold text-lg">{formatTokens(data.totalCacheCreates)} tokens</p>
          </div>
          <div>
            <p className="text-zinc-500 text-sm">Est. Savings</p>
            <p className="font-bold text-lg text-emerald-400">{formatCost(data.estimatedSavings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
