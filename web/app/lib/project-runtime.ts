/**
 * Project Runtime Manager
 * Handles creating, starting, and stopping Next.js dev servers per project.
 * Each project gets its own directory and dev server for live preview.
 */

import { execSync, spawn, ChildProcess } from "child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync, readdirSync, readFileSync, copyFileSync } from "fs";
import { join } from "path";

const RUNTIME_DIR = join(process.cwd(), ".runtime");
const MAX_CONCURRENT_SERVERS = 5;
const SERVER_STARTUP_TIMEOUT = 30000;
const BASE_PORT = 4000;

interface ProjectRuntime {
  projectId: string;
  port: number;
  process: ChildProcess | null;
  status: "starting" | "running" | "stopped" | "error";
  startedAt: number;
  url: string;
}

const activeRuntimes = new Map<string, ProjectRuntime>();
let nextPort = BASE_PORT;

function getProjectDir(projectId: string): string {
  return join(RUNTIME_DIR, projectId);
}

function getAvailablePort(): number {
  const usedPorts = new Set(Array.from(activeRuntimes.values()).map((r) => r.port));
  while (usedPorts.has(nextPort)) {
    nextPort++;
  }
  return nextPort++;
}

export function createProject(projectId: string, files: { path: string; content: string; type: string }[]): string {
  const projectDir = getProjectDir(projectId);

  // Clean up existing project
  if (existsSync(projectDir)) {
    rmSync(projectDir, { recursive: true, force: true });
  }

  mkdirSync(projectDir, { recursive: true });

  // Write all files
  for (const file of files) {
    const filePath = join(projectDir, file.path);
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, file.content, "utf-8");
  }

  // Install dependencies
  try {
    execSync("npm install", {
      cwd: projectDir,
      stdio: "pipe",
      timeout: 60000,
      env: { ...process.env, NODE_ENV: "development" },
    });
  } catch {
    // Non-critical — dev server will still start
  }

  return projectDir;
}

export function updateProjectFile(projectId: string, filePath: string, content: string): boolean {
  const projectDir = getProjectDir(projectId);
  const fullPath = join(projectDir, filePath);

  if (!existsSync(projectDir)) return false;

  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fullPath, content, "utf-8");
  return true;
}

export function getProjectFile(projectId: string, filePath: string): string | null {
  const projectDir = getProjectDir(projectId);
  const fullPath = join(projectDir, filePath);

  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, "utf-8");
}

export function listProjectFiles(projectId: string): string[] {
  const projectDir = getProjectDir(projectId);
  if (!existsSync(projectDir)) return [];

  const files: string[] = [];
  function walkDir(dir: string, prefix: string = "") {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const fullPath = join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }
  walkDir(projectDir);
  return files;
}

export async function startDevServer(projectId: string): Promise<ProjectRuntime> {
  // Check if already running
  const existing = activeRuntimes.get(projectId);
  if (existing && existing.status === "running") {
    return existing;
  }

  // Check server limit
  const runningCount = Array.from(activeRuntimes.values()).filter((r) => r.status === "running").length;
  if (runningCount >= MAX_CONCURRENT_SERVERS) {
    // Stop oldest server
    const oldest = Array.from(activeRuntimes.values()).sort((a, b) => a.startedAt - b.startedAt)[0];
    if (oldest) {
      await stopDevServer(oldest.projectId);
    }
  }

  const projectDir = getProjectDir(projectId);
  if (!existsSync(projectDir)) {
    throw new Error(`Project ${projectId} not found`);
  }

  const port = existing?.port || getAvailablePort();
  const runtime: ProjectRuntime = {
    projectId,
    port,
    process: null,
    status: "starting",
    startedAt: Date.now(),
    url: `http://localhost:${port}`,
  };

  activeRuntimes.set(projectId, runtime);

  try {
    const child = spawn("npx", ["next", "dev", "--port", String(port)], {
      cwd: projectDir,
      stdio: "pipe",
      env: { ...process.env, NODE_ENV: "development", PORT: String(port) },
    });

    runtime.process = child;

    child.on("error", () => {
      runtime.status = "error";
    });

    child.on("exit", () => {
      runtime.status = "stopped";
      runtime.process = null;
    });

    // Wait for server to be ready
    await waitForServer(port, SERVER_STARTUP_TIMEOUT);
    runtime.status = "running";

    return runtime;
  } catch (err) {
    runtime.status = "error";
    throw err;
  }
}

export async function stopDevServer(projectId: string): Promise<void> {
  const runtime = activeRuntimes.get(projectId);
  if (!runtime) return;

  if (runtime.process) {
    try {
      runtime.process.kill("SIGTERM");
    } catch {
      // Ignore
    }
  }

  runtime.status = "stopped";
  runtime.process = null;
  activeRuntimes.delete(projectId);
}

export function getRuntime(projectId: string): ProjectRuntime | null {
  return activeRuntimes.get(projectId) || null;
}

export function getAllRuntimes(): ProjectRuntime[] {
  return Array.from(activeRuntimes.values());
}

async function waitForServer(port: number, timeout: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server on port ${port} did not start within ${timeout}ms`);
}

// Cleanup on process exit
process.on("exit", () => {
  for (const runtime of activeRuntimes.values()) {
    if (runtime.process) {
      try {
        runtime.process.kill("SIGTERM");
      } catch {
        // Ignore
      }
    }
  }
});

process.on("SIGINT", () => {
  for (const runtime of activeRuntimes.values()) {
    if (runtime.process) {
      try {
        runtime.process.kill("SIGTERM");
      } catch {
        // Ignore
      }
    }
  }
  process.exit(0);
});
