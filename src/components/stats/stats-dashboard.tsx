"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ClaudeStats } from "@/lib/stats";
import { StatsFilters } from "./stats-filters";
import { SummaryCards } from "./summary-cards";
import { StreakBar } from "./streak-bar";
import { HourlyChart } from "./hourly-chart";
import { DailyChart } from "./daily-chart";
import { ToolUsage } from "./tool-usage";
import { UsageCost } from "./usage-cost";
import { ProjectPortfolio } from "./project-portfolio";
import { SessionTimeline } from "./session-timeline";

export function StatsDashboard() {
  const [stats, setStats] = useState<ClaudeStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateRange = searchParams.get("range") || "all";
  const project = searchParams.get("project") || "";
  const model = searchParams.get("model") || "";

  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange !== "all") {
      const d = new Date();
      d.setDate(d.getDate() - Number(dateRange));
      params.set("from", d.toISOString().slice(0, 10));
    }
    if (project) params.set("project", project);
    if (model) params.set("model", model);
    const qs = params.toString();
    return `/api/stats${qs ? `?${qs}` : ""}`;
  }, [dateRange, project, model]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    }
  }, [fetchUrl]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/stats?${params.toString()}`, { scroll: false });
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 text-lg">Error loading stats: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-3 text-zinc-400 text-lg py-20">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
        Loading stats...
      </div>
    );
  }

  const projectNames = stats.projectStats.map((p) => p.name).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const modelNames = Object.keys(stats.modelUsage);

  return (
    <div className="space-y-8">
      <StatsFilters
        dateRange={dateRange}
        project={project}
        model={model}
        projects={projectNames}
        models={modelNames}
        onDateRangeChange={(v) => updateParam("range", v === "all" ? "" : v)}
        onProjectChange={(v) => updateParam("project", v)}
        onModelChange={(v) => updateParam("model", v)}
      />

      <SummaryCards stats={stats} />

      <StreakBar streakStats={stats.streakStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HourlyChart data={stats.hourlyActivity} />
        <DailyChart
          data={stats.dailyActivity}
          topProjects={stats.projectStats}
          recentSessions={stats.sessionTimeline}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ToolUsage data={stats.toolUsage} />
        <UsageCost
          costByModel={stats.costByModel}
          totalCost={stats.estimatedCost}
          modelUsage={stats.modelUsage}
          totalSessions={stats.totalSessions}
          daysActive={stats.streakStats.daysActive}
          sessions={stats.sessionTimeline}
        />
      </div>

      <ProjectPortfolio
        projectStats={stats.projectStats}
        projectTimeline={stats.projectTimeline}
      />

      <SessionTimeline sessions={stats.sessionTimeline} />

      <p className="text-sm text-zinc-600 text-center pb-4">
        Last updated: {new Date(stats.generatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
