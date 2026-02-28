import type { CostBreakdown } from "../cost-estimation";

export type { CostBreakdown };

export interface ModelUsage {
  messages: number;
  inputTokens: number;
  outputTokens: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  daysActive: number;
  mostActiveDay: string;
  mostActiveDayMessages: number;
  avgMessagesPerDay: number;
  avgSessionDurationMs: number;
}

export interface CacheEfficiency {
  totalCacheReads: number;
  totalCacheCreates: number;
  totalInputTokens: number;
  hitRate: number;
  estimatedSavings: number;
}

export interface SessionTimelineEntry {
  id: string;
  slug: string;
  project: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  messages: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
  branch: string;
  version: string;
  toolUsage: Record<string, number>;
}

export interface ProjectTimelineEntry {
  name: string;
  firstActive: string;
  lastActive: string;
  sessions: number;
  messages: number;
  estimatedCost: number;
  dailyActivity: Record<string, number>;
}

export interface ProjectStat {
  name: string;
  messages: number;
  sessions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
  estimatedCost: number;
  lastActive: string;
}

export interface ClaudeStats {
  totalSessions: number;
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreateTokens: number;
  totalToolCalls: number;
  estimatedCost: number;
  costByModel: Record<string, CostBreakdown>;
  totalHoursEstimate: number;
  hourlyActivity: Record<number, number>;
  dailyActivity: Record<string, number>;
  modelUsage: Record<string, ModelUsage>;
  projectStats: ProjectStat[];
  streakStats: StreakStats;
  cacheEfficiency: CacheEfficiency;
  toolUsage: Record<string, number>;
  sessionTimeline: SessionTimelineEntry[];
  projectTimeline: ProjectTimelineEntry[];
  generatedAt: string;
}

export interface ProjectDetailStats {
  name: string;
  messages: number;
  sessions: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
  estimatedCost: number;
  costByModel: Record<string, CostBreakdown>;
  totalToolCalls: number;
  totalHoursEstimate: number;
  hourlyActivity: Record<number, number>;
  dailyActivity: Record<string, number>;
  modelUsage: Record<string, ModelUsage>;
  sessionHistory: SessionTimelineEntry[];
  generatedAt: string;
}

export interface SessionData {
  id: string;
  slug: string;
  project: string;
  messages: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
  toolCalls: number;
  toolUsage: Record<string, number>;
  firstActive: string;
  lastActive: string;
  hourly: Record<number, number>;
  daily: Record<string, number>;
  modelUsage: Record<string, ModelUsage>;
  primaryModel: string;
  branch: string;
  version: string;
}

export interface StatsFilters {
  from?: string;
  to?: string;
  project?: string;
  model?: string;
}
