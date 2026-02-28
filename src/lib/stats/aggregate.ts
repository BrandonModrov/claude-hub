import { estimateCost } from "../cost-estimation";
import { getAllSessions } from "./parse-session";
import type {
  ClaudeStats,
  ProjectDetailStats,
  SessionData,
  SessionTimelineEntry,
  ProjectTimelineEntry,
  StreakStats,
  CacheEfficiency,
  StatsFilters,
  CostBreakdown,
  ModelUsage,
} from "./types";

function estimateSessionHours(sessions: SessionData[]): number {
  let totalMs = 0;
  for (const s of sessions) {
    if (s.firstActive && s.lastActive) {
      const span = new Date(s.lastActive).getTime() - new Date(s.firstActive).getTime();
      totalMs += Math.min(span, 4 * 60 * 60 * 1000);
    }
  }
  return totalMs / (1000 * 60 * 60);
}

function computeSessionCost(session: SessionData): { total: number; byModel: Record<string, CostBreakdown> } {
  let total = 0;
  const byModel: Record<string, CostBreakdown> = {};

  for (const [model, usage] of Object.entries(session.modelUsage)) {
    const modelFrac = usage.messages / Math.max(session.messages, 1);
    const cost = estimateCost(
      model,
      usage.inputTokens,
      usage.outputTokens,
      session.cacheReadTokens * modelFrac,
      session.cacheCreateTokens * modelFrac
    );
    total += cost.totalCost;
    byModel[model] = cost;
  }

  return { total, byModel };
}

function computeStreaks(dailyActivity: Record<string, number>, sessions: SessionData[]): StreakStats {
  const days = Object.keys(dailyActivity).sort();
  if (days.length === 0) {
    return { currentStreak: 0, longestStreak: 0, daysActive: 0, mostActiveDay: "", mostActiveDayMessages: 0, avgMessagesPerDay: 0, avgSessionDurationMs: 0 };
  }

  // Find most active day
  let mostActiveDay = days[0];
  let mostActiveDayMessages = dailyActivity[days[0]];
  for (const day of days) {
    if (dailyActivity[day] > mostActiveDayMessages) {
      mostActiveDay = day;
      mostActiveDayMessages = dailyActivity[day];
    }
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  // Build set of active days for fast lookup
  const activeDays = new Set(days);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Walk backwards from today to find current streak
  const d = new Date(today);
  while (true) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (activeDays.has(ds)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else {
      // Allow today to not count yet (check yesterday)
      if (ds === todayStr) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }

  // Walk all days in range to find longest streak
  if (days.length > 0) {
    const start = new Date(days[0] + "T12:00:00");
    const end = new Date(days[days.length - 1] + "T12:00:00");
    const cursor = new Date(start);
    while (cursor <= end) {
      const cs = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (activeDays.has(cs)) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Avg session duration
  let totalDurationMs = 0;
  let durationCount = 0;
  for (const s of sessions) {
    if (s.firstActive && s.lastActive) {
      const span = new Date(s.lastActive).getTime() - new Date(s.firstActive).getTime();
      if (span > 0 && span < 4 * 60 * 60 * 1000) {
        totalDurationMs += span;
        durationCount++;
      }
    }
  }

  const totalMessages = Object.values(dailyActivity).reduce((a, b) => a + b, 0);

  return {
    currentStreak,
    longestStreak,
    daysActive: days.length,
    mostActiveDay,
    mostActiveDayMessages,
    avgMessagesPerDay: days.length > 0 ? Math.round(totalMessages / days.length) : 0,
    avgSessionDurationMs: durationCount > 0 ? Math.round(totalDurationMs / durationCount) : 0,
  };
}

function computeCacheEfficiency(sessions: SessionData[]): CacheEfficiency {
  let totalCacheReads = 0;
  let totalCacheCreates = 0;
  let totalInputTokens = 0;

  for (const s of sessions) {
    totalCacheReads += s.cacheReadTokens;
    totalCacheCreates += s.cacheCreateTokens;
    totalInputTokens += s.inputTokens;
  }

  const totalCacheTokens = totalCacheReads + totalCacheCreates;
  const allInput = totalInputTokens + totalCacheTokens;
  const hitRate = allInput > 0 ? totalCacheReads / allInput : 0;

  // Savings: cache reads cost ~90% less than regular input for most models
  // Estimate using average Sonnet pricing as baseline
  const regularCostPer1M = 3;
  const cacheReadCostPer1M = 0.30;
  const savingsPerToken = (regularCostPer1M - cacheReadCostPer1M) / 1_000_000;
  const estimatedSavings = totalCacheReads * savingsPerToken;

  return { totalCacheReads, totalCacheCreates, totalInputTokens, hitRate, estimatedSavings };
}

function buildSessionTimeline(sessions: SessionData[]): SessionTimelineEntry[] {
  return sessions
    .map((s) => {
      const { total } = computeSessionCost(s);
      const durationMs = s.firstActive && s.lastActive
        ? new Date(s.lastActive).getTime() - new Date(s.firstActive).getTime()
        : 0;

      return {
        id: s.id,
        slug: s.slug,
        project: s.project,
        startTime: s.firstActive,
        endTime: s.lastActive,
        durationMs,
        messages: s.messages,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        estimatedCost: total,
        model: s.primaryModel,
        branch: s.branch,
        version: s.version,
        toolUsage: s.toolUsage,
      };
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
}

function buildProjectTimeline(sessions: SessionData[]): ProjectTimelineEntry[] {
  const projMap: Record<string, ProjectTimelineEntry> = {};

  for (const s of sessions) {
    if (!projMap[s.project]) {
      projMap[s.project] = {
        name: s.project,
        firstActive: s.firstActive,
        lastActive: s.lastActive,
        sessions: 0,
        messages: 0,
        estimatedCost: 0,
        dailyActivity: {},
      };
    }
    const p = projMap[s.project];
    p.sessions++;
    p.messages += s.messages;
    p.estimatedCost += computeSessionCost(s).total;

    if (s.firstActive && (!p.firstActive || s.firstActive < p.firstActive)) p.firstActive = s.firstActive;
    if (s.lastActive && (!p.lastActive || s.lastActive > p.lastActive)) p.lastActive = s.lastActive;

    for (const [day, count] of Object.entries(s.daily)) {
      p.dailyActivity[day] = (p.dailyActivity[day] || 0) + count;
    }
  }

  return Object.values(projMap).sort((a, b) => b.messages - a.messages);
}

function applyFilters(sessions: SessionData[], filters: StatsFilters): SessionData[] {
  let filtered = sessions;

  if (filters.from) {
    const fromDate = filters.from;
    filtered = filtered.filter((s) => {
      if (!s.firstActive) return false;
      return s.firstActive.slice(0, 10) >= fromDate;
    });
  }

  if (filters.to) {
    const toDate = filters.to;
    filtered = filtered.filter((s) => {
      if (!s.firstActive) return false;
      return s.firstActive.slice(0, 10) <= toDate;
    });
  }

  if (filters.project) {
    const proj = filters.project.toLowerCase();
    filtered = filtered.filter((s) => s.project.toLowerCase() === proj);
  }

  if (filters.model) {
    const model = filters.model.toLowerCase();
    filtered = filtered.filter((s) => s.primaryModel.toLowerCase().includes(model));
  }

  return filtered;
}

export function parseClaudeData(filters?: StatsFilters): ClaudeStats {
  let sessions = getAllSessions();
  if (filters) sessions = applyFilters(sessions, filters);

  const stats: ClaudeStats = {
    totalSessions: 0,
    totalMessages: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreateTokens: 0,
    totalToolCalls: 0,
    estimatedCost: 0,
    costByModel: {},
    totalHoursEstimate: 0,
    hourlyActivity: {},
    dailyActivity: {},
    modelUsage: {},
    projectStats: [],
    streakStats: { currentStreak: 0, longestStreak: 0, daysActive: 0, mostActiveDay: "", mostActiveDayMessages: 0, avgMessagesPerDay: 0, avgSessionDurationMs: 0 },
    cacheEfficiency: { totalCacheReads: 0, totalCacheCreates: 0, totalInputTokens: 0, hitRate: 0, estimatedSavings: 0 },
    toolUsage: {},
    sessionTimeline: [],
    projectTimeline: [],
    generatedAt: new Date().toISOString(),
  };

  for (let h = 0; h < 24; h++) stats.hourlyActivity[h] = 0;

  const projAcc: Record<string, {
    messages: number;
    sessions: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreateTokens: number;
    estimatedCost: number;
    lastActive: string;
  }> = {};

  for (const session of sessions) {
    stats.totalSessions++;
    stats.totalMessages += session.messages;
    stats.totalInputTokens += session.inputTokens;
    stats.totalOutputTokens += session.outputTokens;
    stats.totalCacheReadTokens += session.cacheReadTokens;
    stats.totalCacheCreateTokens += session.cacheCreateTokens;
    stats.totalToolCalls += session.toolCalls;

    for (const [h, count] of Object.entries(session.hourly)) {
      stats.hourlyActivity[Number(h)] = (stats.hourlyActivity[Number(h)] || 0) + count;
    }
    for (const [day, count] of Object.entries(session.daily)) {
      stats.dailyActivity[day] = (stats.dailyActivity[day] || 0) + count;
    }

    // Tool usage aggregation
    for (const [tool, count] of Object.entries(session.toolUsage)) {
      stats.toolUsage[tool] = (stats.toolUsage[tool] || 0) + count;
    }

    // Model usage + cost
    for (const [model, usage] of Object.entries(session.modelUsage)) {
      if (!stats.modelUsage[model]) {
        stats.modelUsage[model] = { messages: 0, inputTokens: 0, outputTokens: 0 };
      }
      stats.modelUsage[model].messages += usage.messages;
      stats.modelUsage[model].inputTokens += usage.inputTokens;
      stats.modelUsage[model].outputTokens += usage.outputTokens;
    }

    const { total: sessionCost, byModel } = computeSessionCost(session);
    stats.estimatedCost += sessionCost;

    for (const [model, cost] of Object.entries(byModel)) {
      if (!stats.costByModel[model]) {
        stats.costByModel[model] = { inputCost: 0, outputCost: 0, cacheReadCost: 0, cacheWriteCost: 0, totalCost: 0 };
      }
      stats.costByModel[model].inputCost += cost.inputCost;
      stats.costByModel[model].outputCost += cost.outputCost;
      stats.costByModel[model].cacheReadCost += cost.cacheReadCost;
      stats.costByModel[model].cacheWriteCost += cost.cacheWriteCost;
      stats.costByModel[model].totalCost += cost.totalCost;
    }

    // Per-project
    const projName = session.project;
    if (!projAcc[projName]) {
      projAcc[projName] = { messages: 0, sessions: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreateTokens: 0, estimatedCost: 0, lastActive: "" };
    }
    projAcc[projName].messages += session.messages;
    projAcc[projName].sessions++;
    projAcc[projName].tokens += session.inputTokens + session.outputTokens + session.cacheReadTokens + session.cacheCreateTokens;
    projAcc[projName].inputTokens += session.inputTokens;
    projAcc[projName].outputTokens += session.outputTokens;
    projAcc[projName].cacheReadTokens += session.cacheReadTokens;
    projAcc[projName].cacheCreateTokens += session.cacheCreateTokens;
    projAcc[projName].estimatedCost += sessionCost;
    if (!projAcc[projName].lastActive || session.lastActive > projAcc[projName].lastActive) {
      projAcc[projName].lastActive = session.lastActive;
    }
  }

  stats.totalHoursEstimate = estimateSessionHours(sessions);
  stats.projectStats = Object.entries(projAcc)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.messages - a.messages);

  stats.streakStats = computeStreaks(stats.dailyActivity, sessions);
  stats.cacheEfficiency = computeCacheEfficiency(sessions);
  stats.sessionTimeline = buildSessionTimeline(sessions);
  stats.projectTimeline = buildProjectTimeline(sessions);

  return stats;
}

export function parseProjectData(projectName: string): ProjectDetailStats | null {
  const sessions = getAllSessions().filter(
    (s) => s.project.toLowerCase() === projectName.toLowerCase()
  );

  if (sessions.length === 0) return null;

  const detail: ProjectDetailStats = {
    name: projectName,
    messages: 0,
    sessions: sessions.length,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreateTokens: 0,
    estimatedCost: 0,
    costByModel: {},
    totalToolCalls: 0,
    totalHoursEstimate: 0,
    hourlyActivity: {},
    dailyActivity: {},
    modelUsage: {},
    sessionHistory: [],
    generatedAt: new Date().toISOString(),
  };

  for (let h = 0; h < 24; h++) detail.hourlyActivity[h] = 0;

  for (const session of sessions) {
    detail.messages += session.messages;
    detail.inputTokens += session.inputTokens;
    detail.outputTokens += session.outputTokens;
    detail.cacheReadTokens += session.cacheReadTokens;
    detail.cacheCreateTokens += session.cacheCreateTokens;
    detail.totalToolCalls += session.toolCalls;

    for (const [h, count] of Object.entries(session.hourly)) {
      detail.hourlyActivity[Number(h)] = (detail.hourlyActivity[Number(h)] || 0) + count;
    }
    for (const [day, count] of Object.entries(session.daily)) {
      detail.dailyActivity[day] = (detail.dailyActivity[day] || 0) + count;
    }

    const { total: sessionCost, byModel } = computeSessionCost(session);
    detail.estimatedCost += sessionCost;

    for (const [model, usage] of Object.entries(session.modelUsage)) {
      if (!detail.modelUsage[model]) {
        detail.modelUsage[model] = { messages: 0, inputTokens: 0, outputTokens: 0 };
      }
      detail.modelUsage[model].messages += usage.messages;
      detail.modelUsage[model].inputTokens += usage.inputTokens;
      detail.modelUsage[model].outputTokens += usage.outputTokens;
    }

    for (const [model, cost] of Object.entries(byModel)) {
      if (!detail.costByModel[model]) {
        detail.costByModel[model] = { inputCost: 0, outputCost: 0, cacheReadCost: 0, cacheWriteCost: 0, totalCost: 0 };
      }
      detail.costByModel[model].inputCost += cost.inputCost;
      detail.costByModel[model].outputCost += cost.outputCost;
      detail.costByModel[model].cacheReadCost += cost.cacheReadCost;
      detail.costByModel[model].cacheWriteCost += cost.cacheWriteCost;
      detail.costByModel[model].totalCost += cost.totalCost;
    }

    const durationMs = session.firstActive && session.lastActive
      ? new Date(session.lastActive).getTime() - new Date(session.firstActive).getTime()
      : 0;

    detail.sessionHistory.push({
      id: session.id,
      slug: session.slug,
      project: session.project,
      startTime: session.firstActive,
      endTime: session.lastActive,
      durationMs,
      messages: session.messages,
      inputTokens: session.inputTokens,
      outputTokens: session.outputTokens,
      estimatedCost: sessionCost,
      model: session.primaryModel,
      branch: session.branch,
      version: session.version,
      toolUsage: session.toolUsage,
    });
  }

  detail.totalHoursEstimate = estimateSessionHours(sessions);
  detail.sessionHistory.sort((a, b) => b.startTime.localeCompare(a.startTime));

  return detail;
}
