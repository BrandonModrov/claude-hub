"use client";

import type { SessionTimelineEntry } from "@/lib/stats";
import { formatDate, formatDurationMs, formatCost } from "@/lib/format-utils";

interface RecentSessionsProps {
  sessions: SessionTimelineEntry[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-black text-2xl mb-3">Recent Sessions</h2>
        <p className="text-sm text-zinc-500">No sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-black text-2xl mb-4">Recent Sessions</h2>
      <div className="divide-y divide-zinc-800">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span className="font-medium text-sm flex-1 min-w-0 truncate">
              {s.slug || s.id.slice(0, 8)}
            </span>
            <span className="text-xs text-zinc-500 w-28 truncate text-right">
              {s.project}
            </span>
            <span className="text-xs text-zinc-500 w-32 text-right">
              {formatDate(s.startTime)}
            </span>
            <span className="text-xs font-mono text-zinc-600 w-12 text-right">
              {formatDurationMs(s.durationMs)}
            </span>
            <span className="text-xs font-mono text-zinc-500 w-16 text-right">
              {formatCost(s.estimatedCost)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
