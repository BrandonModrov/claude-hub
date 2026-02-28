# CodeCenter

A local dashboard for managing dev projects and tracking Claude Code usage across your machine.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## What it does

- **Project dashboard** — see all your projects in one place, start/stop/restart dev servers, check health status
- **Claude Code analytics** — parse your session logs to show tokens, costs, tool usage, activity heatmaps, streaks, and per-project breakdowns
- **News feed** — aggregated updates from Anthropic, Claude Code releases, and the Claude blog

## Quick start

```bash
git clone https://github.com/BrandonModrov/codecenter.git
cd codecenter
npm install
npm run setup   # asks for your code directory + port
npm run build
npm run start
```

Zero-config also works — defaults to `~/Code` on port 3000 (Next.js default).

## Configuration

Running `npm run setup` creates two files (both gitignored):

**`codecenter.config.json`** — code directories and project name aliases:

```json
{
  "codeDirectories": ["~/Code"],
  "projectAliases": {
    "old-name": "current-name"
  }
}
```

**`.env.local`** — port assignment:

```
PORT=3030
```

See `codecenter.config.example.json` for reference.

## Features

### Project Management

Each project in your code directory gets a card showing framework, port, and run status. You can start, stop, restart, or open a terminal from the dashboard. Projects are auto-discovered from `package.json` files in your code directory.

### Stats Dashboard (`/stats`)

Aggregate analytics from all your Claude Code sessions:

- **Summary cards** — days active, sessions, messages, tokens, tool calls, hours, estimated cost
- **Activity heatmap** — GitHub-style 52-week view of daily usage
- **Streak tracking** — current and longest coding streaks
- **Hourly & daily charts** — when you code and how much
- **Tool usage breakdown** — which Claude Code tools you use most
- **Models & cost** — per-model token usage, cost breakdowns, costliest sessions
- **Project table & timeline** — messages, tokens, and cost per project
- **Session timeline** — detailed history of every coding session

Filter by date range, project, or model. Data refreshes automatically.

### News (`/news`)

Curated feed from Anthropic News, Claude Code releases, Claude status, and the Claude blog. Filterable by source.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Custom chart components (no external chart library)
- Session data parsed from `~/.claude/projects/` JSONL files

## API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/projects` | GET | List all projects with health status |
| `/api/projects/[name]/start` | POST | Start a dev server |
| `/api/projects/[name]/stop` | POST | Stop a dev server |
| `/api/projects/[name]/restart` | POST | Restart a dev server |
| `/api/projects/[name]/terminal` | POST | Open terminal at project |
| `/api/stats` | GET | Global stats (supports `?project=`, `?model=`, `?days=` filters) |
| `/api/stats/[project]` | GET | Per-project stats |
| `/api/stats/refresh` | POST | Clear cache and re-parse sessions |
| `/api/stats/overrides` | POST | Override a session's project assignment |
| `/api/usage` | GET | Current Claude API plan usage |
| `/api/news` | GET | News feed |

## Shell aliases (optional)

Add these to your `~/.zshrc` or `~/.bashrc` for quick access:

```bash
alias cc="cd ~/Code/codecenter && claude"   # open project + launch Claude Code
alias cc-open="open http://localhost:3030"   # open dashboard in browser
```

Adjust the path and port to match your setup.

## Running as a background service (macOS)

To keep the dashboard always running, create a LaunchAgent:

```bash
# ~/Library/LaunchAgents/com.codecenter.dev.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.codecenter.dev</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npx</string>
        <string>next</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/codecenter</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3030</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.codecenter.dev.plist
```

## License

MIT
