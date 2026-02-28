"use client";

import { formatTokens, formatNumber } from "@/lib/format-utils";
import type { ModelUsage as ModelUsageType } from "@/lib/stats";

export function ModelUsage({ data }: { data: Record<string, ModelUsageType> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens));
  const maxTokens = Math.max(...entries.map(([, v]) => v.inputTokens + v.outputTokens), 1);
  const totalTokens = entries.reduce((sum, [, v]) => sum + v.inputTokens + v.outputTokens, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Model Usage</h2>
      <div className="space-y-3">
        {entries.map(([model, usage]) => {
          const total = usage.inputTokens + usage.outputTokens;
          const pct = (total / maxTokens) * 100;
          const sharePct = totalTokens > 0 ? ((total / totalTokens) * 100).toFixed(1) : "0";
          return (
            <div key={model}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-mono">{model}</span>
                <span className="text-zinc-400 text-sm">
                  {formatTokens(total)} tokens · {formatNumber(usage.messages)} msgs · <span className="text-purple-400">{sharePct}%</span>
                </span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
