import { Suspense } from "react";
import { UsageDashboard } from "@/components/usage-dashboard";

export default function UsagePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10">
        <h1 className="font-black text-5xl tracking-tight">Usage</h1>
        <p className="text-lg text-zinc-400 mt-2">
          Track your Claude Code plan usage and costs
        </p>
      </header>
      <Suspense>
        <UsageDashboard />
      </Suspense>
    </main>
  );
}
