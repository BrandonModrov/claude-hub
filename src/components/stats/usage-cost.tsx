"use client";

import { formatCost, formatTokens, formatNumber } from "@/lib/format-utils";
import type { CostBreakdown, ModelUsage, SessionTimelineEntry } from "@/lib/stats";

interface Props {
  costByModel: Record<string, CostBreakdown>;
  totalCost: number;
  modelUsage: Record<string, ModelUsage>;
  totalSessions: number;
  daysActive: number;
  sessions: SessionTimelineEntry[];
}

export function UsageCost({ costByModel, totalCost, modelUsage, totalSessions, daysActive, sessions }: Props) {
  const models = Object.keys(modelUsage).sort(
    (a, b) => (modelUsage[b].inputTokens + modelUsage[b].outputTokens) - (modelUsage[a].inputTokens + modelUsage[a].outputTokens)
  );

  const maxTokens = Math.max(
    ...models.map((m) => modelUsage[m].inputTokens + modelUsage[m].outputTokens), 1
  );

  const totalTokens = Object.values(modelUsage).reduce(
    (sum, v) => sum + v.inputTokens + v.outputTokens, 0
  );

  // Aggregate cost breakdown across all models
  const costTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  for (const cost of Object.values(costByModel)) {
    costTotals.input += cost.inputCost;
    costTotals.output += cost.outputCost;
    costTotals.cacheRead += cost.cacheReadCost;
    costTotals.cacheWrite += cost.cacheWriteCost;
  }
  const maxCostCategory = Math.max(costTotals.input, costTotals.output, costTotals.cacheRead, costTotals.cacheWrite, 1);

  const costCategories = [
    { label: "Output", value: costTotals.output, color: "#f59e0b" },
    { label: "Input", value: costTotals.input, color: "#3b82f6" },
    { label: "Cache Reads", value: costTotals.cacheRead, color: "#10b981" },
    { label: "Cache Writes", value: costTotals.cacheWrite, color: "#8b5cf6" },
  ].filter((c) => c.value > 0);

  // Averages
  const avgPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;
  const avgPerDay = daysActive > 0 ? totalCost / daysActive : 0;

  // Top 5 costliest sessions
  const costliestSessions = [...sessions]
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, 5);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Models & Cost</h2>
        <div className="text-right">
          <span className="text-2xl font-bold text-emerald-400">{formatCost(totalCost)}</span>
          <span className="text-zinc-600 text-xs block">API equivalent</span>
        </div>
      </div>

      {/* Per-model breakdown */}
      <div className="space-y-4">
        {models.map((model) => {
          const usage = modelUsage[model];
          const cost = costByModel[model];
          const tokens = usage.inputTokens + usage.outputTokens;
          const pct = (tokens / maxTokens) * 100;
          const sharePct = totalTokens > 0 ? ((tokens / totalTokens) * 100).toFixed(1) : "0";

          return (
            <div key={model}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-mono">{model}</span>
                <span className="text-zinc-400 text-xs">{sharePct}%</span>
              </div>
              <div className="h-5 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #8b5cf6, #6d28d9)`,
                  }}
                />
              </div>
              <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                <span>{formatNumber(usage.messages)} msgs</span>
                <span>in {formatTokens(usage.inputTokens)}</span>
                <span>out {formatTokens(usage.outputTokens)}</span>
                {cost && <span className="text-emerald-500">{formatCost(cost.totalCost)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost Breakdown */}
      {costCategories.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <h3 className="text-zinc-400 text-sm mb-2">Where Cost Goes</h3>
          <div className="space-y-1.5">
            {costCategories.map((cat) => {
              const pct = (cat.value / maxCostCategory) * 100;
              const sharePct = totalCost > 0 ? ((cat.value / totalCost) * 100).toFixed(1) : "0";
              return (
                <div key={cat.label}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xs text-zinc-300">{cat.label}</span>
                    <span className="text-xs text-zinc-500">
                      {formatCost(cat.value)} <span className="text-zinc-600">({sharePct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Averages */}
      <div className="mt-5 pt-4 border-t border-zinc-800">
        <h3 className="text-zinc-400 text-sm mb-2">Averages</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-lg font-bold text-emerald-400">{formatCost(avgPerSession)}</span>
            <span className="text-zinc-600 text-xs block">per session</span>
          </div>
          <div>
            <span className="text-lg font-bold text-emerald-400">{formatCost(avgPerDay)}</span>
            <span className="text-zinc-600 text-xs block">per active day</span>
          </div>
        </div>
      </div>

      {/* Costliest Sessions */}
      {costliestSessions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <h3 className="text-zinc-400 text-sm mb-2">Costliest Sessions</h3>
          <div className="space-y-1.5">
            {costliestSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-zinc-300 truncate">{s.project}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-zinc-600 text-xs">
                    {new Date(s.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-emerald-400 text-xs font-mono">
                    {formatCost(s.estimatedCost)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
