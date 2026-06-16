import { existsSync } from 'fs';
import { join } from 'path';
import { getAllFiles, readFile, type ValidationFinding } from './validators.js';

export function validateImports(projectDir: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const srcDir = join(projectDir, 'src');
  if (!existsSync(srcDir)) return findings;

  const tsFiles = getAllFiles(projectDir).filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && f.startsWith('src/'));
  const existingModules = new Set<string>();

  for (const f of tsFiles) {
    existingModules.add(f.replace(/\.(tsx|ts)$/, ''));
    if (f.endsWith('.tsx')) existingModules.add(f.replace(/\.tsx$/, ''));
    if (f.endsWith('.ts')) existingModules.add(f.replace(/\.ts$/, ''));
  }

  for (const file of tsFiles) {
    const content = readFile(join(projectDir, file));
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const namedImportMatch = line.match(/import\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/);
      if (namedImportMatch) {
        const importPath = namedImportMatch[1];
        if (importPath.startsWith('@/')) {
          const resolved = importPath.replace('@/', 'src/');
          const candidates = [
            resolved, resolved + '.tsx', resolved + '.ts',
            resolved + '/index.tsx', resolved + '/index.ts',
          ];
          const found = candidates.some(c => existingModules.has(c.replace(/\.(tsx|ts)$/, '')));
          if (!found) {
            findings.push({
              severity: 'critical', category: 'import', file,
              message: `Missing module: ${importPath}`, line: i + 1,
            });
          }
        }
        continue;
      }

      const defaultImportMatch = line.match(/import\s+\w+\s+from\s+['"]([^'"]+)['"]/);
      if (defaultImportMatch) {
        const importPath = defaultImportMatch[1];
        if (importPath.startsWith('@/')) {
          const resolved = importPath.replace('@/', 'src/');
          const candidates = [
            resolved, resolved + '.tsx', resolved + '.ts',
            resolved + '/index.tsx', resolved + '/index.ts',
          ];
          const found = candidates.some(c => existingModules.has(c.replace(/\.(tsx|ts)$/, '')));
          if (!found) {
            findings.push({
              severity: 'critical', category: 'import', file,
              message: `Missing module: ${importPath}`, line: i + 1,
            });
          }
        }
      }

      const sideEffectMatch = line.match(/import\s+['"]([^'"]+)['"]/);
      if (sideEffectMatch) {
        const importPath = sideEffectMatch[1];
        if (importPath.startsWith('@/')) {
          const resolved = importPath.replace('@/', 'src/');
          const candidates = [
            resolved, resolved + '.css', resolved + '.tsx', resolved + '.ts',
          ];
          const found = candidates.some(c => existingModules.has(c.replace(/\.(css|tsx|ts)$/, '')));
          if (!found) {
            findings.push({
              severity: 'minor', category: 'import', file,
              message: `Missing side-effect import: ${importPath}`, line: i + 1,
            });
          }
        }
      }
    }
  }

  return findings;
}
