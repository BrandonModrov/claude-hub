import { XMLParser } from "fast-xml-parser";
import type { NewsItem, NewsFeedResponse } from "./news-types";

const CACHE_TTL = 5 * 60 * 1000;
let cache: { data: NewsFeedResponse; timestamp: number } | null = null;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function timeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

async function fetchAnthropicNews(): Promise<NewsItem[]> {
  const res = await fetch(
    "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml",
    { signal: timeout(10000) }
  );
  const xml = await res.text();
  const feed = parser.parse(xml);
  const items = feed?.rss?.channel?.item ?? [];
  const list = Array.isArray(items) ? items : [items];

  return list.slice(0, 30).map((item: Record<string, string>) => ({
    id: `anthropic-news-${item.link ?? item.title}`,
    title: item.title ?? "",
    url: item.link ?? "",
    source: "anthropic-news" as const,
    sourceLabel: "Anthropic News",
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    summary: stripHtml(item.description ?? ""),
  }));
}

async function fetchClaudeCodeReleases(): Promise<NewsItem[]> {
  const res = await fetch(
    "https://github.com/anthropics/claude-code/releases.atom",
    { signal: timeout(10000) }
  );
  const xml = await res.text();
  const feed = parser.parse(xml);
  const entries = feed?.feed?.entry ?? [];
  const list = Array.isArray(entries) ? entries : [entries];

  return list.map((entry: Record<string, unknown>) => {
    const link = Array.isArray(entry.link) ? entry.link[0] : entry.link;
    const href = typeof link === "object" && link !== null ? (link as Record<string, string>)["@_href"] : String(link ?? "");
    const content = entry.content;
    const contentStr = typeof content === "object" && content !== null
      ? (content as Record<string, string>)["#text"] ?? ""
      : String(content ?? "");
    return {
      id: `claude-code-${entry.id ?? entry.title}`,
      title: String(entry.title ?? ""),
      url: href,
      source: "claude-code" as const,
      sourceLabel: "Claude Code",
      publishedAt: entry.updated ? new Date(String(entry.updated)).toISOString() : new Date().toISOString(),
      summary: stripHtml(contentStr),
    };
  });
}

async function fetchClaudeStatus(): Promise<NewsItem[]> {
  const res = await fetch("https://status.anthropic.com/history.atom", {
    signal: timeout(10000),
  });
  const xml = await res.text();
  const feed = parser.parse(xml);
  const entries = feed?.feed?.entry ?? [];
  const list = Array.isArray(entries) ? entries : [entries];

  return list.map((entry: Record<string, unknown>) => {
    const link = Array.isArray(entry.link) ? entry.link[0] : entry.link;
    const href = typeof link === "object" && link !== null ? (link as Record<string, string>)["@_href"] : String(link ?? "");
    const content = entry.content;
    const contentStr = typeof content === "object" && content !== null
      ? (content as Record<string, string>)["#text"] ?? ""
      : String(content ?? "");
    return {
      id: `claude-status-${entry.id ?? entry.title}`,
      title: String(entry.title ?? ""),
      url: href,
      source: "claude-status" as const,
      sourceLabel: "Claude Status",
      publishedAt: entry.published ? new Date(String(entry.published)).toISOString() : new Date().toISOString(),
      summary: stripHtml(contentStr),
    };
  });
}

async function fetchClaudeBlog(): Promise<NewsItem[]> {
  const res = await fetch(
    "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_claude.xml",
    { signal: timeout(10000) }
  );
  const xml = await res.text();
  const feed = parser.parse(xml);
  const items = feed?.rss?.channel?.item ?? [];
  const list = Array.isArray(items) ? items : [items];

  return list.slice(0, 30).map((item: Record<string, string>) => ({
    id: `claude-blog-${item.link ?? item.title}`,
    title: item.title ?? "",
    url: item.link ?? "",
    source: "claude-blog" as const,
    sourceLabel: "Claude Blog",
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    summary: stripHtml(item.description ?? ""),
    category: item.category,
  }));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export async function fetchAllNews(): Promise<NewsFeedResponse> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const errors: string[] = [];
  const results = await Promise.allSettled([
    fetchAnthropicNews(),
    fetchClaudeCodeReleases(),
    fetchClaudeStatus(),
    fetchClaudeBlog(),
  ]);

  const labels = ["Anthropic News", "Claude Code", "Claude Status", "Claude Blog"];
  const allItems: NewsItem[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    } else {
      errors.push(`${labels[i]}: ${result.reason?.message ?? "Unknown error"}`);
    }
  });

  allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const data: NewsFeedResponse = {
    items: allItems,
    fetchedAt: new Date().toISOString(),
    errors,
  };

  cache = { data, timestamp: Date.now() };
  return data;
}
