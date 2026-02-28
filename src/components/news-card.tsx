import type { NewsItem, NewsSource } from "@/lib/news-types";

const badgeStyles: Record<NewsSource, string> = {
  "anthropic-news": "bg-amber-900/40 text-amber-300 border-amber-800",
  "claude-code": "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  "claude-status": "bg-blue-900/40 text-blue-300 border-blue-800",
  "claude-blog": "bg-purple-900/40 text-purple-300 border-purple-800",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded border ${badgeStyles[item.source]}`}
        >
          {item.sourceLabel}
        </span>
        <span className="text-xs text-zinc-500">{relativeTime(item.publishedAt)}</span>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-zinc-100 hover:text-amber-400 transition-colors leading-snug"
      >
        {item.title}
      </a>
      {item.summary && (
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{item.summary}</p>
      )}
    </div>
  );
}
