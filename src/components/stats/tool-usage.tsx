"use client";

import { formatNumber } from "@/lib/format-utils";

const TOOL_CATEGORIES: Record<string, { color: string; label: string }> = {
  // File operations
  Read: { color: "#3b82f6", label: "File Ops" },
  Write: { color: "#3b82f6", label: "File Ops" },
  Edit: { color: "#3b82f6", label: "File Ops" },
  NotebookEdit: { color: "#3b82f6", label: "File Ops" },
  // Execution
  Bash: { color: "#f59e0b", label: "Execution" },
  // Search
  Grep: { color: "#10b981", label: "Search" },
  Glob: { color: "#10b981", label: "Search" },
  WebSearch: { color: "#10b981", label: "Search" },
  WebFetch: { color: "#10b981", label: "Search" },
  // Planning / Agent
  Agent: { color: "#8b5cf6", label: "Planning" },
  EnterPlanMode: { color: "#8b5cf6", label: "Planning" },
  ExitPlanMode: { color: "#8b5cf6", label: "Planning" },
  TodoWrite: { color: "#8b5cf6", label: "Planning" },
  TaskCreate: { color: "#8b5cf6", label: "Planning" },
  TaskUpdate: { color: "#8b5cf6", label: "Planning" },
  TaskList: { color: "#8b5cf6", label: "Planning" },
  TaskGet: { color: "#8b5cf6", label: "Planning" },
  AskUserQuestion: { color: "#8b5cf6", label: "Planning" },
  Skill: { color: "#8b5cf6", label: "Planning" },
};

function getToolColor(name: string): string {
  return TOOL_CATEGORIES[name]?.color || "#71717a";
}

export function ToolUsage({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const max = entries.length > 0 ? entries[0][1] : 1;
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-black text-2xl">Tool Usage</h2>
        <span className="text-zinc-400 text-sm">{formatNumber(total)} total calls</span>
      </div>
      <div className="space-y-2">
        {entries.slice(0, 15).map(([tool, count]) => {
          const pct = (count / max) * 100;
          const sharePct = ((count / total) * 100).toFixed(1);
          const color = getToolColor(tool);
          return (
            <div key={tool}>
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-mono">{tool}</span>
                <span className="text-zinc-400 text-xs">
                  {formatNumber(count)} <span className="text-zinc-600">({sharePct}%)</span>
                </span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {[
          { label: "File Ops", color: "#3b82f6" },
          { label: "Execution", color: "#f59e0b" },
          { label: "Search", color: "#10b981" },
          { label: "Planning", color: "#8b5cf6" },
        ].map((cat) => (
          <div key={cat.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
            <span className="text-xs text-zinc-500">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
