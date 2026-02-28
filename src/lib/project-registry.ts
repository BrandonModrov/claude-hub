import fs from "fs";
import path from "path";
import { loadConfig } from "./config";

export interface ProjectConfig {
  path: string;
  port: number;
  startCommand: string;
  framework: "nextjs" | "vite" | "other";
  autoDiscovered: boolean;
}

export interface ProjectRegistry {
  projects: Record<string, ProjectConfig>;
  nextPort: number;
  portRange: { min: number; max: number };
  codeDirectory: string;
}

const REGISTRY_PATH = path.join(process.cwd(), "src", "data", "projects.json");
const RESERVED_PORTS = new Set<number>(); // ports detected from package.json are auto-reserved

export function loadRegistry(): ProjectRegistry {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      projects: {},
      nextPort: 3001,
      portRange: { min: 3001, max: 3099 },
      codeDirectory: loadConfig().codeDirectories[0],
    };
  }
}

export function saveRegistry(registry: ProjectRegistry): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}

function detectFramework(projectPath: string): "nextjs" | "vite" | "other" {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["next"]) return "nextjs";
    if (deps["vite"]) return "vite";
  } catch { /* no package.json */ }
  return "other";
}

function detectPort(projectPath: string): number | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"));
    const devScript = pkg.scripts?.dev || "";
    const match = devScript.match(/(?:--port|-p)\s+(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch { /* no package.json */ }
  return null;
}

function findNextPort(registry: ProjectRegistry): number {
  const usedPorts = new Set([
    ...Object.values(registry.projects).map((p) => p.port),
    ...RESERVED_PORTS,
  ]);
  let port = registry.nextPort;
  while (usedPorts.has(port) && port <= registry.portRange.max) {
    port++;
  }
  return port;
}

export function discoverProjects(): ProjectRegistry {
  const registry = loadRegistry();
  const codeDir = registry.codeDirectory;

  if (!fs.existsSync(codeDir)) return registry;

  const dirs = fs.readdirSync(codeDir).filter((d) => {
    const full = path.join(codeDir, d);
    if (!fs.statSync(full).isDirectory()) return false;
    if (d.startsWith(".") || d === "node_modules") return false;
    return fs.existsSync(path.join(full, "package.json"));
  });

  const currentDirSet = new Set(dirs);
  let changed = false;

  // Remove projects whose directories no longer exist
  for (const name of Object.keys(registry.projects)) {
    const proj = registry.projects[name];
    if (proj.autoDiscovered && !currentDirSet.has(name)) {
      delete registry.projects[name];
      changed = true;
    }
  }

  // Update existing projects if framework changed
  for (const dir of dirs) {
    if (!registry.projects[dir]) continue;
    const projectPath = path.join(codeDir, dir);
    const currentFramework = detectFramework(projectPath);
    if (registry.projects[dir].framework !== currentFramework) {
      registry.projects[dir].framework = currentFramework;
      changed = true;
    }
  }

  // Collect new projects that need port assignment
  const newProjects: { dir: string; projectPath: string; framework: "nextjs" | "vite" | "other"; detectedPort: number | null }[] = [];

  for (const dir of dirs) {
    if (registry.projects[dir]) continue;
    const projectPath = path.join(codeDir, dir);
    newProjects.push({
      dir,
      projectPath,
      framework: detectFramework(projectPath),
      detectedPort: detectPort(projectPath),
    });
  }

  if (newProjects.length === 0) {
    if (changed) saveRegistry(registry);
    return registry;
  }

  // Build set of all claimed ports (existing registry + detected ports from new projects)
  const claimedPorts = new Set([
    ...Object.values(registry.projects).map((p) => p.port),
    ...RESERVED_PORTS,
  ]);

  // First pass: assign projects that have a detected port (if not already claimed)
  for (const proj of newProjects) {
    if (proj.detectedPort && !claimedPorts.has(proj.detectedPort)) {
      registry.projects[proj.dir] = {
        path: proj.projectPath,
        port: proj.detectedPort,
        startCommand: "npm run dev",
        framework: proj.framework,
        autoDiscovered: true,
      };
      claimedPorts.add(proj.detectedPort);
    }
  }

  // Second pass: assign ports to remaining projects
  for (const proj of newProjects) {
    if (registry.projects[proj.dir]) continue; // already assigned in first pass

    let port = registry.nextPort;
    while (claimedPorts.has(port) && port <= registry.portRange.max) {
      port++;
    }

    registry.projects[proj.dir] = {
      path: proj.projectPath,
      port,
      startCommand: "npm run dev",
      framework: proj.framework,
      autoDiscovered: true,
    };
    claimedPorts.add(port);
    registry.nextPort = port + 1;
  }

  saveRegistry(registry);
  return registry;
}

export function getProjectConfig(name: string): ProjectConfig | null {
  const registry = loadRegistry();
  return registry.projects[name] || null;
}

export function getAllProjects(): Record<string, ProjectConfig> {
  const registry = discoverProjects();
  return registry.projects;
}
