"use client";

import { useEffect, useState, useCallback } from "react";
import type { ClaudeStats } from "@/lib/stats";
import { PlanUsageBar } from "@/components/plan-usage";
import { DashboardStats } from "@/components/dashboard-stats";
import { ActivityHeatmap } from "@/components/stats/activity-heatmap";
import { ProjectList } from "@/components/project-list";
import { RecentSessions } from "@/components/recent-sessions";
import { NewsInline } from "@/components/news-inline";

export function Dashboard() {
  const [stats, setStats] = useState<ClaudeStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      setStats(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <PlanUsageBar />

      {stats ? (
        <>
          <DashboardStats stats={stats} />
          <ActivityHeatmap dailyActivity={stats.dailyActivity} />
          <ProjectList />
          <RecentSessions sessions={stats.sessionTimeline.slice(0, 5)} />
        </>
      ) : (
        <>
          {/* Skeleton while stats load — projects + news load independently */}
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 h-20 animate-pulse"
              />
            ))}
          </div>
          <ProjectList />
        </>
      )}

      <NewsInline />
    </div>
  );
}
