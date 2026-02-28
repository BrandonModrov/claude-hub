"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NewsFeedResponse } from "@/lib/news-types";
import { timeAgo } from "@/lib/format-utils";

export function NewsInline() {
  const [items, setItems] = useState<NewsFeedResponse["items"]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) return;
        const data: NewsFeedResponse = await res.json();
        setItems(data.items.slice(0, 3));
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-2xl">News</h2>
        <Link
          href="/news"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          See all &rarr;
        </Link>
      </div>
      <div className="divide-y divide-zinc-800">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 group"
          >
            <span className="text-xs text-zinc-600 w-20 flex-shrink-0">
              {item.sourceLabel}
            </span>
            <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors flex-1 min-w-0 truncate">
              {item.title}
            </span>
            <span className="text-xs text-zinc-600 w-16 text-right flex-shrink-0">
              {timeAgo(item.publishedAt)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
