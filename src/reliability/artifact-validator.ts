import { existsSync, readFileSync as readFsSync } from 'fs';
import { join } from 'path';
import { getAllFiles, type ValidationFinding } from './validators.js';

const REQUIRED_CONFIGS = [
  'package.json',
  'tsconfig.json',
  'next.config.mjs',
  'tailwind.config.mjs',
  'postcss.config.mjs',
];

const REQUIRED_APP = [
  'src/app/layout.tsx',
  'src/app/globals.css',
];

export function validateArtifactCompleteness(projectDir: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const files = getAllFiles(projectDir);

  for (const cfg of REQUIRED_CONFIGS) {
    if (!existsSync(join(projectDir, cfg))) {
      findings.push({ severity: 'critical', category: 'artifact', file: cfg, message: `Missing required config: ${cfg}` });
    }
  }

  for (const appFile of REQUIRED_APP) {
    if (!existsSync(join(projectDir, appFile))) {
      findings.push({ severity: 'critical', category: 'artifact', file: appFile, message: `Missing required app file: ${appFile}` });
    }
  }

  const hasPage = files.some(f => f.endsWith('page.tsx'));
  if (!hasPage) {
    findings.push({ severity: 'critical', category: 'artifact', file: 'src/app/page.tsx', message: 'No page.tsx found in project' });
  }

  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFsSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const required = ['next', 'react', 'react-dom', 'typescript', 'tailwindcss'];
      for (const dep of required) {
        if (!deps[dep]) {
          findings.push({ severity: 'major', category: 'artifact', file: 'package.json', message: `Missing dependency: ${dep}` });
        }
      }
      if (!pkg.scripts?.build) {
        findings.push({ severity: 'major', category: 'artifact', file: 'package.json', message: 'Missing build script' });
      }
      if (!pkg.scripts?.lint) {
        findings.push({ severity: 'minor', category: 'artifact', file: 'package.json', message: 'Missing lint script' });
      }
    } catch {
      findings.push({ severity: 'critical', category: 'artifact', file: 'package.json', message: 'Invalid package.json' });
    }
  }

  const tsconfigPath = join(projectDir, 'tsconfig.json');
  if (existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(readFsSync(tsconfigPath, 'utf-8'));
      if (!tsconfig.compilerOptions?.strict) {
        findings.push({ severity: 'minor', category: 'artifact', file: 'tsconfig.json', message: 'TypeScript strict mode not enabled' });
      }
      if (!tsconfig.compilerOptions?.paths?.['@/*']) {
        findings.push({ severity: 'major', category: 'artifact', file: 'tsconfig.json', message: 'Missing @/* path alias in tsconfig' });
      }
    } catch {
      findings.push({ severity: 'critical', category: 'artifact', file: 'tsconfig.json', message: 'Invalid tsconfig.json' });
    }
  }

  return findings;
}
