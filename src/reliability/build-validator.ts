import { execSync } from 'child_process';
import { type ValidationFinding } from './validators.js';

function runCmd(cmd: string, cwd: string, timeout = 120000): { ok: boolean; output: string } {
  try {
    const out = execSync(cmd, { cwd, timeout, encoding: 'utf-8', stdio: 'pipe' });
    return { ok: true, output: out };
  } catch (e: any) {
    return { ok: false, output: (e.stdout || '') + (e.stderr || '') + (e.message || '') };
  }
}

export function validateBuild(projectDir: string): { findings: ValidationFinding[]; buildTimeMs: number } {
  const findings: ValidationFinding[] = [];
  const t0 = Date.now();

  const install = runCmd('npm install --legacy-peer-deps 2>&1', projectDir, 120000);
  if (!install.ok) {
    findings.push({
      severity: 'critical', category: 'build', file: 'package.json',
      message: `npm install failed: ${extractError(install.output)}`,
    });
    return { findings, buildTimeMs: Date.now() - t0 };
  }

  const typecheck = runCmd('npx tsc --noEmit 2>&1', projectDir, 120000);
  if (!typecheck.ok) {
    const errors = extractTypeErrors(typecheck.output);
    for (const err of errors.slice(0, 10)) {
      findings.push({
        severity: 'critical', category: 'build', file: err.file || 'unknown',
        message: err.message, line: err.line,
      });
    }
  }

  const build = runCmd('npm run build 2>&1', projectDir, 120000);
  if (!build.ok) {
    const errors = extractBuildErrors(build.output);
    for (const err of errors.slice(0, 10)) {
      findings.push({
        severity: 'critical', category: 'build', file: err.file || 'unknown',
        message: err.message, line: err.line,
      });
    }
  }

  const lint = runCmd('npx next lint 2>&1', projectDir, 60000);
  if (!lint.ok) {
    const warnings = extractLintWarnings(lint.output);
    for (const w of warnings.slice(0, 5)) {
      findings.push({
        severity: 'minor', category: 'build', file: w.file || 'unknown',
        message: w.message, line: w.line,
      });
    }
  }

  return { findings, buildTimeMs: Date.now() - t0 };
}

function extractError(output: string): string {
  const lines = output.split('\n').filter(l => l.includes('ERR') || l.includes('error') || l.includes('Error'));
  return lines.slice(0, 3).join(' | ').substring(0, 200);
}

function extractTypeErrors(output: string): Array<{ file: string; message: string; line?: number }> {
  const errors: Array<{ file: string; message: string; line?: number }> = [];
  const matches = output.matchAll(/(?:src\/[^\s]+\.tsx?):(\d+):\d+\s*-\s*error\s*TS\d+:\s*(.+)/g);
  for (const m of matches) {
    errors.push({ file: m[1], message: m[2].substring(0, 150), line: parseInt(m[1]) });
  }
  if (errors.length === 0) {
    const genericMatches = output.matchAll(/error\s+TS\d+:\s*(.+)/g);
    for (const m of genericMatches) {
      errors.push({ file: '', message: m[1].substring(0, 150) });
    }
  }
  return errors;
}

function extractBuildErrors(output: string): Array<{ file: string; message: string; line?: number }> {
  const errors: Array<{ file: string; message: string; line?: number }> = [];
  const moduleErrors = output.matchAll(/Module not found:\s+Can't resolve '([^']+)'/g);
  for (const m of moduleErrors) {
    errors.push({ file: '', message: `Missing module: ${m[1]}` });
  }
  const typeErrors = output.matchAll(/Type error:\s+(.+)/g);
  for (const m of typeErrors) {
    errors.push({ file: '', message: m[1].substring(0, 150) });
  }
  const buildErrors = output.matchAll(/Error:\s+(.+)/g);
  for (const m of buildErrors) {
    if (!errors.find(e => e.message === m[1].substring(0, 150))) {
      errors.push({ file: '', message: m[1].substring(0, 150) });
    }
  }
  return errors;
}

function extractLintWarnings(output: string): Array<{ file: string; message: string; line?: number }> {
  const warnings: Array<{ file: string; message: string; line?: number }> = [];
  const matches = output.matchAll(/([^\s]+\.tsx?):(\d+):\d+\s+(warning|error)\s+(.+?)\s+(.+?)\s/g);
  for (const m of matches) {
    warnings.push({ file: m[1], message: `${m[4]}: ${m[5]}`, line: parseInt(m[2]) });
  }
  return warnings;
}
