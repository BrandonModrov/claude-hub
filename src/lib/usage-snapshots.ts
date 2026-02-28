import { readFileSync, appendFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { PlanUsage } from "./plan-usage-types";

export interface UsageSnapshot {
  timestamp: string;
  fiveHour: number;
  sevenDay: number;
  sevenDayOpus: number | null;
  sevenDaySonnet: number | null;
  extraUsageUsed: number | null;
  extraUsageLimit: number | null;
  account: { email: string; plan: string } | null;
}

const SNAPSHOT_DIR = join(homedir(), ".claude", "codecenter");
const SNAPSHOT_FILE = join(SNAPSHOT_DIR, "usage-snapshots.jsonl");
const DEBOUNCE_MS = 30 * 60 * 1000; // 30 minutes

function ensureDir() {
  if (!existsSync(SNAPSHOT_DIR)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

export function saveSnapshot(usage: PlanUsage): void {
  ensureDir();

  // Debounce: skip if last snapshot was < 30 min ago
  if (existsSync(SNAPSHOT_FILE)) {
    const content = readFileSync(SNAPSHOT_FILE, "utf-8").trim();
    if (content) {
      const lines = content.split("\n");
      const lastLine = lines[lines.length - 1];
      try {
        const last: UsageSnapshot = JSON.parse(lastLine);
        const elapsed = Date.now() - new Date(last.timestamp).getTime();
        if (elapsed < DEBOUNCE_MS) return;
      } catch { /* corrupted line, continue */ }
    }
  }

  const snapshot: UsageSnapshot = {
    timestamp: new Date().toISOString(),
    fiveHour: usage.fiveHour.utilization,
    sevenDay: usage.sevenDay.utilization,
    sevenDayOpus: usage.sevenDayOpus?.utilization ?? null,
    sevenDaySonnet: usage.sevenDaySonnet?.utilization ?? null,
    extraUsageUsed: usage.extraUsage?.usedCredits ?? null,
    extraUsageLimit: usage.extraUsage?.monthlyLimit ?? null,
    account: usage.account,
  };

  appendFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot) + "\n");
}

export function getSnapshots(from?: string, to?: string): UsageSnapshot[] {
  if (!existsSync(SNAPSHOT_FILE)) return [];

  const content = readFileSync(SNAPSHOT_FILE, "utf-8").trim();
  if (!content) return [];

  const snapshots: UsageSnapshot[] = [];
  for (const line of content.split("\n")) {
    try {
      const snap: UsageSnapshot = JSON.parse(line);
      const date = snap.timestamp.slice(0, 10);
      if (from && date < from) continue;
      if (to && date > to) continue;
      snapshots.push(snap);
    } catch { /* skip corrupted lines */ }
  }

  return snapshots;
}
