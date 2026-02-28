import fs from "fs";
import path from "path";
import os from "os";
import type { SessionData } from "./types";
import { loadConfig, clearConfigCache } from "../config";

function normalizeProjectName(name: string): string {
  const aliases = loadConfig().projectAliases;
  return aliases[name] || aliases[name.toLowerCase()] || name;
}

function projectFromPath(cwd: string): string | null {
  for (const codeDir of loadConfig().codeDirectories) {
    if (cwd.startsWith(codeDir + "/")) {
      const projectRoot = cwd.slice(codeDir.length + 1).split("/")[0];
      if (projectRoot) return projectRoot;
    }
  }
  return null;
}

function extractProjectsFromText(text: string): string[] {
  const projects: string[] = [];
  for (const dir of loadConfig().codeDirectories) {
    const escaped = dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped + "/([\\w][\\w-]*)", "g");
    let match;
    while ((match = pattern.exec(text)) !== null) {
      projects.push(match[1]);
    }
  }
  return projects;
}

function detectProject(lines: string[]): string {
  const cwdCounts: Record<string, number> = {};
  const pathCounts: Record<string, number> = {};
  const home = os.homedir();

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);

      const cwd = obj.cwd as string | undefined;
      if (cwd && cwd !== home) {
        const proj = projectFromPath(cwd);
        if (proj) {
          const normalized = normalizeProjectName(proj);
          cwdCounts[normalized] = (cwdCounts[normalized] || 0) + 1;
        }
      }

      const message = obj.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (Array.isArray(content)) {
        for (const block of content as Record<string, unknown>[]) {
          if (block.type === "tool_use") {
            const input = block.input as Record<string, unknown> | undefined;
            if (input) {
              for (const val of Object.values(input)) {
                if (typeof val === "string") {
                  for (const proj of extractProjectsFromText(val)) {
                    const normalized = normalizeProjectName(proj);
                    pathCounts[normalized] = (pathCounts[normalized] || 0) + 1;
                  }
                }
              }
            }
          }
        }
      }

      if (typeof content === "string") {
        for (const proj of extractProjectsFromText(content)) {
          const normalized = normalizeProjectName(proj);
          pathCounts[normalized] = (pathCounts[normalized] || 0) + 1;
        }
      } else if (Array.isArray(content)) {
        for (const block of content as Record<string, unknown>[]) {
          if (block.type === "text" && typeof block.text === "string") {
            for (const proj of extractProjectsFromText(block.text)) {
              const normalized = normalizeProjectName(proj);
              pathCounts[normalized] = (pathCounts[normalized] || 0) + 1;
            }
          }
        }
      }
    } catch { /* skip */ }
  }

  let best = "";
  let bestCount = 0;
  for (const [proj, count] of Object.entries(cwdCounts)) {
    if (count > bestCount) { best = proj; bestCount = count; }
  }
  if (best) return best;

  for (const [proj, count] of Object.entries(pathCounts)) {
    if (count > bestCount) { best = proj; bestCount = count; }
  }
  if (best) return best;

  return "home";
}

function friendlyFolderName(dirName: string): string {
  const parts = dirName.replace(/^-/, "").split("-");
  const codeIdx = parts.lastIndexOf("Code");
  if (codeIdx === -1) {
    const codeLower = parts.lastIndexOf("code");
    if (codeLower !== -1 && codeLower < parts.length - 1) return parts.slice(codeLower + 1).join("-");
  } else if (codeIdx < parts.length - 1) {
    return parts.slice(codeIdx + 1).join("-");
  }
  if (parts.length <= 2 && parts[0] === "Users") return "home";
  return dirName;
}

export function parseSession(filePath: string, folderProject: string): SessionData | null {
  let raw: string;
  try { raw = fs.readFileSync(filePath, "utf-8"); } catch { return null; }

  const lines = raw.split("\n").filter(Boolean);
  if (lines.length === 0) return null;

  const id = path.basename(filePath, ".jsonl");
  const overrides = loadOverrides();
  const detected = overrides[id] ?? (folderProject === "home" ? detectProject(lines) : folderProject);
  const project = normalizeProjectName(detected);

  const session: SessionData = {
    id,
    slug: "",
    project,
    messages: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreateTokens: 0,
    toolCalls: 0,
    toolUsage: {},
    firstActive: "",
    lastActive: "",
    hourly: {},
    daily: {},
    modelUsage: {},
    primaryModel: "unknown",
    branch: "",
    version: "",
  };

  const modelCounts: Record<string, number> = {};

  for (const line of lines) {
    let obj: Record<string, unknown>;
    try { obj = JSON.parse(line); } catch { continue; }

    // Extract slug (appears on some assistant messages)
    if (!session.slug && typeof obj.slug === "string") {
      session.slug = obj.slug;
    }

    // Extract version and branch from any message
    if (!session.version && typeof obj.version === "string") {
      session.version = obj.version;
    }
    if (!session.branch && typeof obj.gitBranch === "string") {
      session.branch = obj.gitBranch;
    }

    if (obj.type !== "assistant") continue;
    const message = obj.message as Record<string, unknown> | undefined;
    if (!message) continue;

    const model = message.model as string | undefined;
    if (!model || model === "<synthetic>") continue;

    const usage = message.usage as Record<string, number> | undefined;
    const timestamp = obj.timestamp as string | undefined;

    session.messages++;
    modelCounts[model] = (modelCounts[model] || 0) + 1;

    if (usage) {
      const inp = usage.input_tokens || 0;
      const out = usage.output_tokens || 0;
      const cacheRead = usage.cache_read_input_tokens || 0;
      const cacheCreate = usage.cache_creation_input_tokens || 0;

      session.inputTokens += inp;
      session.outputTokens += out;
      session.cacheReadTokens += cacheRead;
      session.cacheCreateTokens += cacheCreate;

      if (!session.modelUsage[model]) {
        session.modelUsage[model] = { messages: 0, inputTokens: 0, outputTokens: 0 };
      }
      session.modelUsage[model].messages++;
      session.modelUsage[model].inputTokens += inp;
      session.modelUsage[model].outputTokens += out;
    }

    // Extract tool usage by name
    const content = message.content as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "tool_use") {
          session.toolCalls++;
          const toolName = (block.name as string) || "unknown";
          session.toolUsage[toolName] = (session.toolUsage[toolName] || 0) + 1;
        }
      }
    }

    if (timestamp) {
      const date = new Date(timestamp);
      const hour = date.getHours();
      session.hourly[hour] = (session.hourly[hour] || 0) + 1;
      const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      session.daily[dayStr] = (session.daily[dayStr] || 0) + 1;

      if (!session.firstActive || timestamp < session.firstActive) session.firstActive = timestamp;
      if (!session.lastActive || timestamp > session.lastActive) session.lastActive = timestamp;
    }
  }

  let maxCount = 0;
  for (const [model, count] of Object.entries(modelCounts)) {
    if (count > maxCount) { session.primaryModel = model; maxCount = count; }
  }

  return session.messages > 0 ? session : null;
}

const OVERRIDES_PATH = path.join(os.homedir(), ".claude", "session-overrides.json");

let overridesCache: Record<string, string> | null = null;

function loadOverrides(): Record<string, string> {
  if (overridesCache) return overridesCache;
  try {
    overridesCache = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"));
    return overridesCache!;
  } catch {
    return {};
  }
}

export function getOverrides(): Record<string, string> {
  return loadOverrides();
}

export function setOverride(sessionId: string, project: string) {
  const overrides = loadOverrides();
  overrides[sessionId] = project;
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));
  overridesCache = overrides;
  sessionCache = null;
}

export function removeOverride(sessionId: string) {
  const overrides = loadOverrides();
  delete overrides[sessionId];
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));
  overridesCache = overrides;
  sessionCache = null;
}

let sessionCache: SessionData[] | null = null;

export function clearSessionCache() {
  sessionCache = null;
  overridesCache = null;
  clearConfigCache();
}

export function getAllSessions(): SessionData[] {
  if (sessionCache) return sessionCache;

  const claudeDir = path.join(os.homedir(), ".claude");
  const projectsDir = path.join(claudeDir, "projects");
  if (!fs.existsSync(projectsDir)) return [];

  const sessions: SessionData[] = [];
  const projectDirs = fs.readdirSync(projectsDir).filter((d) =>
    fs.statSync(path.join(projectsDir, d)).isDirectory()
  );

  for (const projDir of projectDirs) {
    const projPath = path.join(projectsDir, projDir);
    const folderProject = friendlyFolderName(projDir);
    const jsonlFiles = fs.readdirSync(projPath).filter((f) => f.endsWith(".jsonl"));

    for (const file of jsonlFiles) {
      const session = parseSession(path.join(projPath, file), folderProject);
      if (session) sessions.push(session);
    }
  }

  sessionCache = sessions;
  return sessions;
}
