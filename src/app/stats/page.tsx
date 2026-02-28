import { Suspense } from "react";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { RefreshButton } from "@/components/stats/refresh-button";

export default function StatsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="font-black text-5xl tracking-tight">Global Stats</h1>
          <p className="text-lg text-zinc-400 mt-2">
            Aggregate Claude Code usage across all projects
          </p>
        </div>
        <RefreshButton />
      </header>
      <Suspense>
        <StatsDashboard />
      </Suspense>
    </main>
  );
}
