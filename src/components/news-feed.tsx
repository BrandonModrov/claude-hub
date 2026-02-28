"use client";

import { useEffect, useState } from "react";
import type { NewsFeedResponse, NewsSource } from "@/lib/news-types";
import { NewsCard } from "./news-card";

const filters: { label: string; value: NewsSource | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Anthropic News", value: "anthropic-news" },
  { label: "Claude Code", value: "claude-code" },
  { label: "Claude Status", value: "claude-status" },
  { label: "Claude Blog", value: "claude-blog" },
];

export function NewsFeed() {
  const [data, setData] = useState<NewsFeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NewsSource | "all">("all");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load news");
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-red-300 text-sm">
        Failed to load news: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  const items = filter === "all" ? data.items : data.items.filter((i) => i.source === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="text-zinc-500 text-sm py-10 text-center">No items to show.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Errors from sources */}
      {data.errors.length > 0 && (
        <div className="text-xs text-zinc-600 mt-4">
          Some sources had issues: {data.errors.join(", ")}
        </div>
      )}
    </div>
  );
}
