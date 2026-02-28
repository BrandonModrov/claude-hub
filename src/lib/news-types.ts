export type NewsSource =
  | "anthropic-news"
  | "claude-code"
  | "claude-status"
  | "claude-blog";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: NewsSource;
  sourceLabel: string;
  publishedAt: string;
  summary: string;
  category?: string;
}

export interface NewsFeedResponse {
  items: NewsItem[];
  fetchedAt: string;
  errors: string[];
}
