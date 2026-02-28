import fs from "fs";
import path from "path";
import os from "os";

export interface HubConfig {
  codeDirectories: string[];
  projectAliases: Record<string, string>;
}

const CONFIG_FILES = ["codecenter.config.json"];

function resolveDir(dir: string): string {
  if (dir.startsWith("~/")) return path.join(os.homedir(), dir.slice(2));
  return dir;
}

let configCache: HubConfig | null = null;

export function loadConfig(): HubConfig {
  if (configCache) return configCache;

  for (const file of CONFIG_FILES) {
    const configPath = path.join(process.cwd(), file);
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      configCache = {
        codeDirectories: (raw.codeDirectories || []).map(resolveDir),
        projectAliases: raw.projectAliases || {},
      };
      return configCache;
    } catch {
      // try next file
    }
  }

  {
    const home = os.homedir();
    configCache = {
      codeDirectories: [path.join(home, "Code"), path.join(home, "code")],
      projectAliases: {},
    };
  }

  return configCache;
}

export function clearConfigCache(): void {
  configCache = null;
}
