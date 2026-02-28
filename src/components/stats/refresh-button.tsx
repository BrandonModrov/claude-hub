"use client";

import { useState, useCallback } from "react";

export function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch("/api/stats/refresh", { method: "POST" });
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50 mt-2"
    >
      <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {refreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}
