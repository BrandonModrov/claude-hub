# CodeCenter — Development Guide

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Custom React components (no external chart library)
- **Data**: Session logs parsed from `~/.claude/projects/` JSONL files

## Project Structure

```
src/
├── app/              # Pages (thin) and API routes (thin)
│   ├── api/          # validate → call lib → return JSON
│   ├── projects/     # /projects page + /projects/[name] detail
│   ├── stats/        # /stats page
│   └── usage/        # /usage page — plan utilization + cost history
├── components/       # UI components (dashboard-*.tsx, project-*.tsx, etc.)
│   └── stats/        # Stats dashboard sub-components
├── lib/              # Business logic
│   ├── config.ts     # Reads codecenter.config.json
│   ├── stats/        # Session parsing and aggregation
│   └── ...           # Process management, cost estimation, etc.
└── data/             # Generated data (gitignored)
```

## Conventions

- **Pages are thin** — import components, render, done. Under 50 lines.
- **API routes are thin** — validate input, call a lib function, return `NextResponse.json()`.
- **Business logic lives in `src/lib/`** — not in pages or API routes.
- **One component per file** — `project-card.tsx`, not `project-components.tsx`.
- **Props over globals** — components accept data as props, parent fetches.
- **`"use client"` only where needed** — hooks, event handlers, interactivity.
- **No external chart library** — all charts are custom components in `src/components/stats/`.

## Configuration

User-specific config lives in `codecenter.config.json` (gitignored). Code reads it via `src/lib/config.ts`:

```typescript
import { loadConfig } from "@/lib/config";
const config = loadConfig(); // { codeDirectories, projectAliases }
```

Never hardcode paths like `~/Code` — always go through `loadConfig()`.

## Stats Pipeline

1. **Parse**: `src/lib/stats/parse-session.ts` reads JSONL files from `~/.claude/projects/`
2. **Aggregate**: `src/lib/stats/aggregate.ts` combines sessions into stats objects
3. **Serve**: API routes in `src/app/api/stats/` return filtered results
4. **Display**: `src/components/stats/stats-dashboard.tsx` orchestrates all stat cards

## Commands

```bash
npm run dev      # Start dev server (reads PORT from .env.local)
npm run build    # Production build
npm run start    # Start production server
npm run setup    # Interactive first-time setup
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Central config loader — all path/alias config flows through here |
| `src/lib/stats/parse-session.ts` | Parses Claude Code session JSONL into structured data |
| `src/lib/stats/aggregate.ts` | Aggregates sessions into stats with filters |
| `src/lib/project-registry.ts` | Auto-discovers projects, manages port assignments |
| `src/lib/cost-estimation.ts` | Token-to-dollar cost calculation per model |
| `src/lib/plan-usage-types.ts` | Shared PlanUsage interface (used by server lib + client components) |
| `src/lib/usage-snapshots.ts` | Persists plan usage snapshots to `~/.claude/codecenter/usage-snapshots.jsonl` |
| `src/components/dashboard.tsx` | Homepage orchestrator — fetches stats, renders all dashboard sections |
| `src/components/stats/stats-dashboard.tsx` | Stats page orchestrator — fetches data, passes to children |
