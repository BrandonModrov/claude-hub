"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { PlanUsage } from "@/lib/plan-usage-types";
import type { UsageSnapshot } from "@/lib/usage-snapshots";
import type { CostBreakdown, SessionTimelineEntry } from "@/lib/stats";
import { UsageCurrent } from "./usage-current";
import { UsageCostChart } from "./usage-cost-chart";
import { UsagePlanHistory } from "./usage-plan-history";
import { UsageModelBreakdown } from "./usage-model-breakdown";

interface HistoryData {
  snapshots: UsageSnapshot[];
  stats: {
    dailyActivity: Record<string, number>;
    estimatedCost: number;
    costByModel: Record<string, CostBreakdown>;
    sessionTimeline: SessionTimelineEntry[];
  };
}

const RANGES = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "All", value: "all" },
];

export function UsageDashboard() {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const range = searchParams.get("range") || "30";

  const historyUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (range !== "all") {
      const d = new Date();
      d.setDate(d.getDate() - Number(range));
      params.set("from", d.toISOString().slice(0, 10));
    }
    const qs = params.toString();
    return `/api/usage/history${qs ? `?${qs}` : ""}`;
  }, [range]);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      setUsage(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(historyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistory(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch history");
    }
  }, [historyUrl]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 60_000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "30") params.delete("range");
    else params.set("range", value);
    const qs = params.toString();
    router.replace(`/usage${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  if (error && !history) {
    return (
      <div className="bg-red-950/50 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 text-lg">Error loading usage data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Date range filter */}
      <div className="flex gap-2">
        {RANGES.map((r) => {
          const isActive = r.value === range;
          return (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Current Plan */}
      {usage && <UsageCurrent usage={usage} />}

      {/* Loading state for history */}
      {!history && (
        <div className="flex items-center gap-3 text-zinc-400 text-lg py-10">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
          Loading usage history...
        </div>
      )}

      {history && (
        <>
          {/* Daily Cost */}
          <UsageCostChart
            dailyActivity={history.stats.dailyActivity}
            sessions={history.stats.sessionTimeline}
          />

          {/* Plan Utilization History */}
          <UsagePlanHistory snapshots={history.snapshots} />

          {/* Cost by Model */}
          <UsageModelBreakdown costByModel={history.stats.costByModel} />
        </>
      )}
    </div>
  );
}
