import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import type { ProjectConfig } from "./project-registry";

export interface ProcessStatus {
  running: boolean;
  pid: number | null;
  port: number;
  url: string;
}

export function checkPortInUse(port: number): { inUse: boolean; pid: number | null } {
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: "utf-8" }).trim();
    if (output) {
      const pid = parseInt(output.split("\n")[0], 10);
      return { inUse: true, pid: isNaN(pid) ? null : pid };
    }
  } catch {
    // lsof returns non-zero when no process found
  }
  return { inUse: false, pid: null };
}

export function killProcessOnPort(port: number): boolean {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null`, { encoding: "utf-8" });
    return true;
  } catch {
    return false;
  }
}

export function healthCheck(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function needsInstall(projectPath: string): boolean {
  return !fs.existsSync(path.join(projectPath, "node_modules"));
}

function installDependencies(projectPath: string): { success: boolean; error?: string } {
  try {
    // Detect package manager
    const useBun = fs.existsSync(path.join(projectPath, "bun.lockb")) || fs.existsSync(path.join(projectPath, "bun.lock"));
    const useYarn = !useBun && fs.existsSync(path.join(projectPath, "yarn.lock"));
    const usePnpm = !useBun && !useYarn && fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"));
    const cmd = useBun ? "bun install" : useYarn ? "yarn install" : usePnpm ? "pnpm install" : "npm install";

    execSync(cmd, { cwd: projectPath, stdio: "ignore", timeout: 120_000 });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Install failed" };
  }
}

export function startDevServer(config: ProjectConfig): { success: boolean; installed?: boolean; error?: string } {
  // Auto-install dependencies if node_modules is missing
  let installed = false;
  if (needsInstall(config.path)) {
    const installResult = installDependencies(config.path);
    if (!installResult.success) {
      return { success: false, error: `npm install failed: ${installResult.error}` };
    }
    installed = true;
  }

  const portCheck = checkPortInUse(config.port);
  if (portCheck.inUse) {
    killProcessOnPort(config.port);
    try { execSync("sleep 0.5"); } catch { /* ok */ }
  }

  try {
    const [cmd, ...args] = config.startCommand.split(" ");
    const env = { ...process.env, PORT: String(config.port) };

    // For vite, inject --port flag
    if (config.framework === "vite") {
      args.push("--", "--port", String(config.port));
    }

    const child = spawn(cmd, args, {
      cwd: config.path,
      detached: true,
      stdio: "ignore",
      env,
      shell: true,
    });

    child.unref();
    return { success: true, installed };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to start" };
  }
}

export function stopDevServer(port: number): { success: boolean; error?: string } {
  const portCheck = checkPortInUse(port);
  if (!portCheck.inUse) return { success: true };

  const killed = killProcessOnPort(port);
  return killed
    ? { success: true }
    : { success: false, error: "Failed to kill process" };
}

export function restartDevServer(config: ProjectConfig): { success: boolean; error?: string } {
  stopDevServer(config.port);
  try { execSync("sleep 1"); } catch { /* ok */ }
  return startDevServer(config);
}

export function openTerminal(projectPath: string): { success: boolean; error?: string } {
  try {
    // Try iTerm2 first
    try {
      execSync('osascript -e "application id \\"com.googlecode.iterm2\\""', { stdio: "ignore" });
      execSync(`osascript -e 'tell application "iTerm2"
        create window with default profile
        tell current session of current window
          write text "cd ${projectPath.replace(/'/g, "'\\''")}"
        end tell
        activate
      end tell'`);
      return { success: true };
    } catch {
      // iTerm2 not available, fall back to Terminal.app
    }

    execSync(`osascript -e 'tell application "Terminal"
      do script "cd ${projectPath.replace(/'/g, "'\\''")}"
      activate
    end tell'`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to open terminal" };
  }
}

export async function getProjectStatus(config: ProjectConfig): Promise<ProcessStatus> {
  const portCheck = checkPortInUse(config.port);
  const healthy = portCheck.inUse ? await healthCheck(config.port) : false;

  return {
    running: portCheck.inUse && healthy,
    pid: portCheck.pid,
    port: config.port,
    url: `http://localhost:${config.port}`,
  };
}
