import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

export interface ValidationFinding {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  file: string;
  message: string;
  line?: number;
}

export interface ValidationReport {
  projectDir: string;
  factory: string;
  prompt: string;
  findings: ValidationFinding[];
  score: number;
  passed: boolean;
}

export function getAllFiles(dir: string, base?: string): string[] {
  const files: string[] = [];
  const root = base || dir;
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      files.push(...getAllFiles(fp, root));
    } else {
      files.push(fp.replace(root, '').replace(/\\/g, '/').replace(/^\//, ''));
    }
  }
  return files;
}

export function readFile(path: string): string {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}
