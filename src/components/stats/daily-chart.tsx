"use client";

import { formatNumber, formatDurationMs } from "@/lib/format-utils";
import type { ProjectStat, SessionTimelineEntry } from "@/lib/stats";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  data: Record<string, number>;
  topProjects: ProjectStat[];
  recentSessions: SessionTimelineEntry[];
}

export function DailyChart({ data, topProjects, recentSessions }: Props) {
  const dayTotals = new Array(7).fill(0);
  for (const [dateStr, count] of Object.entries(data)) {
    const d = new Date(dateStr + "T12:00:00");
    dayTotals[d.getDay()] += count;
  }

  const max = Math.max(...dayTotals, 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Days You Work</h2>
      <div className="space-y-1.5">
        {DAY_NAMES.map((name, i) => {
          const count = dayTotals[i];
          const pct = (count / max) * 100;
          return (
            <div key={name} className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs w-8 text-right font-mono">{name}</span>
              <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden">
                {pct > 0 && (
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, #3b82f6, #6366f1)`,
                    }}
                  />
                )}
              </div>
              {count > 0 && <span className="text-zinc-500 text-xs w-12 font-mono">{formatNumber(count)}</span>}
            </div>
          );
        })}
      </div>

      {/* Top Projects */}
      {topProjects.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <h3 className="text-zinc-400 text-sm mb-2">Top Projects</h3>
          <div className="space-y-1.5">
            {topProjects.slice(0, 5).map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600 text-xs w-4 font-mono">{i + 1}</span>
                  <span className="text-sm text-zinc-300 truncate">{p.name}</span>
                </div>
                <span className="text-zinc-500 text-xs font-mono">{formatNumber(p.messages)} msgs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <h3 className="text-zinc-400 text-sm mb-2">Recent Sessions</h3>
          <div className="space-y-1.5">
            {recentSessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-zinc-300 truncate">{s.project}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-zinc-600 text-xs">
                    {new Date(s.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-zinc-500 text-xs font-mono">
                    {s.durationMs > 0 ? formatDurationMs(s.durationMs) : `${s.messages}m`}
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
