import { Dashboard } from "@/components/dashboard";
import { LiveClock } from "@/components/live-clock";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-black text-5xl tracking-tight">CodeCenter</h1>
          <p className="text-lg text-zinc-400 mt-2">
            Your Claude Code command center
          </p>
        </div>
        <LiveClock />
      </header>
      <Dashboard />
    </main>
  );
}
