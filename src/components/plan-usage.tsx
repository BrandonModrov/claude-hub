"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { PlanUsage } from "@/lib/plan-usage-types";

function formatRelativeReset(iso: string | null): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs} hr ${remainMins} min`;
}

function formatAbsoluteReset(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (d.getTime() - Date.now() <= 0) return "now";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[d.getDay()];
  const h = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  const mins = d.getMinutes();
  const minStr = mins > 0 ? `:${mins.toString().padStart(2, "0")}` : "";
  return `${day} ${h}${minStr} ${ampm}`;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getBarColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#10b981";
}

function UsageBar({
  label,
  pct,
  resetText,
  subtitle,
}: {
  label: string;
  pct: number;
  resetText: string;
  subtitle?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-sm font-mono text-zinc-400">{pct}% used</span>
      </div>
      {resetText && (
        <p className="text-xs text-zinc-500 mb-1.5">Resets {resetText}</p>
      )}
      {subtitle && !resetText && (
        <p className="text-xs text-zinc-500 mb-1.5">{subtitle}</p>
      )}
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: getBarColor(pct),
          }}
        />
      </div>
    </div>
  );
}

export function PlanUsageBar() {
  const [usage, setUsage] = useState<PlanUsage | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      setUsage(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 60_000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  if (!usage) return null;

  const sessionReset = formatRelativeReset(usage.fiveHour.resetsAt);
  const weeklyReset = formatAbsoluteReset(usage.sevenDay.resetsAt);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg">Plan Usage</h2>
          <Link href="/usage" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            View details &rarr;
          </Link>
          {usage.account && (
            <span className="text-sm text-zinc-500">
              {usage.account.email}
              <span className="ml-2 bg-zinc-800 px-2 py-0.5 rounded text-xs font-medium text-zinc-400">
                {usage.account.plan}
              </span>
            </span>
          )}
        </div>
        {usage.extraUsage && (
          <span className={`text-sm font-mono ${usage.extraUsage.utilization >= 100 ? "text-red-400" : "text-zinc-400"}`}>
            {formatCurrency(usage.extraUsage.usedCredits)} / {formatCurrency(usage.extraUsage.monthlyLimit)} extra
          </span>
        )}
      </div>
      <div className="flex gap-6">
        <UsageBar
          label="Current session"
          pct={usage.fiveHour.utilization}
          resetText={sessionReset ? `in ${sessionReset}` : ""}
        />
        <UsageBar
          label="Weekly limits"
          pct={usage.sevenDay.utilization}
          resetText={weeklyReset}
        />
        {usage.sevenDayOpus && (
          <UsageBar
            label="Opus"
            pct={usage.sevenDayOpus.utilization}
            resetText={formatAbsoluteReset(usage.sevenDayOpus.resetsAt)}
          />
        )}
        {usage.sevenDaySonnet && (
          <UsageBar
            label="Sonnet"
            pct={usage.sevenDaySonnet.utilization}
            resetText={formatAbsoluteReset(usage.sevenDaySonnet.resetsAt)}
            subtitle={usage.sevenDaySonnet.utilization === 0 ? "You haven't used Sonnet yet" : undefined}
          />
        )}
      </div>
    </div>
  );
}
