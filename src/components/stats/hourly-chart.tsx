"use client";

import { formatNumber } from "@/lib/format-utils";

export function HourlyChart({ data }: { data: Record<string, number> }) {
  const max = Math.max(...Object.values(data), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">When You Work</h2>
      <div className="space-y-1.5">
        {Array.from({ length: 24 }, (_, h) => {
          const count = data[h] || 0;
          const pct = (count / max) * 100;
          const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
          return (
            <div key={h} className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs w-8 text-right font-mono">{label}</span>
              <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden">
                {pct > 0 && (
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, #f59e0b, #ea580c)`,
                    }}
                  />
                )}
              </div>
              {count > 0 && <span className="text-zinc-500 text-xs w-12 font-mono">{formatNumber(count)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
