"use client";

interface FiltersProps {
  dateRange: string;
  project: string;
  model: string;
  projects: string[];
  models: string[];
  onDateRangeChange: (range: string) => void;
  onProjectChange: (project: string) => void;
  onModelChange: (model: string) => void;
}

const DATE_PRESETS = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "All", value: "all" },
];

export function StatsFilters({
  dateRange,
  project,
  model,
  projects,
  models,
  onDateRangeChange,
  onProjectChange,
  onModelChange,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date range presets */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onDateRangeChange(preset.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              dateRange === preset.value
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Project dropdown */}
      <select
        value={project}
        onChange={(e) => onProjectChange(e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Model dropdown */}
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
      >
        <option value="">All Models</option>
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
