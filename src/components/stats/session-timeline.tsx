"use client";

import { useState, useMemo } from "react";
import { formatNumber, formatCost, formatDurationMs, formatDate } from "@/lib/format-utils";
import type { SessionTimelineEntry } from "@/lib/stats";

const PAGE_SIZE = 20;

const TOP_TOOLS = ["Bash", "Read", "Edit", "Write", "Grep", "Glob", "Agent"];

export function SessionTimeline({ sessions }: { sessions: SessionTimelineEntry[] }) {
  const [page, setPage] = useState(1);
  const displayed = sessions.slice(0, page * PAGE_SIZE);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; sessions: SessionTimelineEntry[] }[] = [];
    let currentDate = "";
    let currentGroup: SessionTimelineEntry[] = [];

    for (const s of displayed) {
      const date = s.startTime ? s.startTime.slice(0, 10) : "unknown";
      if (date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, sessions: currentGroup });
        }
        currentDate = date;
        currentGroup = [];
      }
      currentGroup.push(s);
    }
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, sessions: currentGroup });
    }
    return groups;
  }, [displayed]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Session Timeline</h2>
        <span className="text-zinc-400 text-sm">{formatNumber(sessions.length)} sessions</span>
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.date}>
            <h3 className="text-sm font-medium text-zinc-400 mb-2 sticky top-0 bg-zinc-900 py-1">
              {group.date !== "unknown"
                ? new Date(group.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                : "Unknown Date"}
            </h3>
            <div className="space-y-2">
              {group.sessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {displayed.length < sessions.length && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="mt-4 w-full py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
        >
          Load more ({sessions.length - displayed.length} remaining)
        </button>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: SessionTimelineEntry }) {
  const tools = Object.entries(session.toolUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {session.slug && (
              <span className="text-sm font-medium text-zinc-200">{session.slug}</span>
            )}
            <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded-full text-zinc-300">
              {session.project}
            </span>
            {session.branch && session.branch !== "main" && (
              <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full">
                {session.branch}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
            <span>{formatDate(session.startTime)}</span>
            {session.durationMs > 0 && (
              <span>{formatDurationMs(session.durationMs)}</span>
            )}
            <span>{formatNumber(session.messages)} msgs</span>
            <span className="text-emerald-400">{formatCost(session.estimatedCost)}</span>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-500 flex-shrink-0">{session.model.replace("claude-", "")}</span>
      </div>

      {/* Tool badges */}
      {tools.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {tools.map(([name, count]) => (
            <span key={name} className="text-[10px] px-1.5 py-0.5 bg-zinc-700/50 rounded text-zinc-400">
              {name} <span className="text-zinc-500">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
