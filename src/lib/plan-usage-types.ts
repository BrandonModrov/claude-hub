export interface PlanUsage {
  account: { email: string; plan: string } | null;
  fiveHour: { utilization: number; resetsAt: string | null };
  sevenDay: { utilization: number; resetsAt: string | null };
  sevenDayOpus: { utilization: number; resetsAt: string | null } | null;
  sevenDaySonnet: { utilization: number; resetsAt: string | null } | null;
  extraUsage: {
    isEnabled: boolean;
    monthlyLimit: number;
    usedCredits: number;
    utilization: number;
  } | null;
}
