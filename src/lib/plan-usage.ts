import { execSync } from "child_process";

export type { PlanUsage } from "./plan-usage-types";
import type { PlanUsage } from "./plan-usage-types";

function getOAuthToken(): string | null {
  try {
    const raw = execSync(
      'security find-generic-password -s "Claude Code-credentials" -w',
      { encoding: "utf-8", timeout: 5000 }
    ).trim();
    const data = JSON.parse(raw);
    return data?.claudeAiOauth?.accessToken || null;
  } catch {
    return null;
  }
}

const PLAN_LABELS: Record<string, string> = {
  claude_max: "Max",
  claude_pro: "Pro",
  claude_team: "Team",
  claude_enterprise: "Enterprise",
};

async function fetchProfile(token: string): Promise<{ email: string; plan: string } | null> {
  try {
    const res = await fetch("https://api.anthropic.com/api/oauth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "oauth-2025-04-20",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const orgType = data.organization?.organization_type || "";
    return {
      email: data.account?.email || "unknown",
      plan: PLAN_LABELS[orgType] || orgType || "unknown",
    };
  } catch {
    return null;
  }
}

export async function fetchPlanUsage(): Promise<PlanUsage | null> {
  const token = getOAuthToken();
  if (!token) return null;

  try {
    const [usageRes, account] = await Promise.all([
      fetch("https://api.anthropic.com/api/oauth/usage", {
        headers: {
          Authorization: `Bearer ${token}`,
          "anthropic-beta": "oauth-2025-04-20",
          "Content-Type": "application/json",
        },
      }),
      fetchProfile(token),
    ]);

    if (!usageRes.ok) return null;

    const data = await usageRes.json();

    return {
      account,
      fiveHour: {
        utilization: data.five_hour?.utilization ?? 0,
        resetsAt: data.five_hour?.resets_at ?? null,
      },
      sevenDay: {
        utilization: data.seven_day?.utilization ?? 0,
        resetsAt: data.seven_day?.resets_at ?? null,
      },
      sevenDayOpus: data.seven_day_opus
        ? { utilization: data.seven_day_opus.utilization, resetsAt: data.seven_day_opus.resets_at }
        : null,
      sevenDaySonnet: data.seven_day_sonnet
        ? { utilization: data.seven_day_sonnet.utilization, resetsAt: data.seven_day_sonnet.resets_at }
        : null,
      extraUsage: data.extra_usage
        ? {
            isEnabled: data.extra_usage.is_enabled,
            monthlyLimit: data.extra_usage.monthly_limit,
            usedCredits: data.extra_usage.used_credits,
            utilization: data.extra_usage.utilization,
          }
        : null,
    };
  } catch {
    return null;
  }
}
