import { existsSync } from 'fs';
import { join } from 'path';
import { getAllFiles, readFile, type ValidationFinding } from './validators.js';

export function validateTypes(projectDir: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const tsFiles = getAllFiles(projectDir).filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && f.startsWith('src/'));

  const definedTypes = new Set<string>();
  for (const file of tsFiles) {
    const content = readFile(join(projectDir, file));
    const types = content.matchAll(/(?:export\s+)?(?:type|interface)\s+(\w+)/g);
    for (const m of types) definedTypes.add(m[1]);
  }

  for (const file of tsFiles) {
    const content = readFile(join(projectDir, file));
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const typeRef = line.match(/:\s*(\w+)(?:\[\]|<\w+>)?[,;)\s]/);
      if (typeRef) {
        const typeName = typeRef[1];
        const builtins = ['string', 'number', 'boolean', 'void', 'null', 'undefined', 'any', 'unknown', 'never', 'object', 'React', 'JSX'];
        if (!builtins.includes(typeName) && !definedTypes.has(typeName) && /^[A-Z]/.test(typeName)) {
          const isImported = content.includes(`import`) && content.includes(typeName);
          if (!isImported) {
            findings.push({
              severity: 'minor', category: 'type', file,
              message: `Possibly undefined type reference: ${typeName}`, line: i + 1,
            });
          }
        }
      }
    }

    const anyUsage = content.match(/\bany\b/g);
    if (anyUsage && anyUsage.length > 0) {
      findings.push({
        severity: 'minor', category: 'type', file,
        message: `Uses 'any' type (${anyUsage.length} occurrences)`,
      });
    }

    const implicitAny = content.match(/=\s*function\s*\([^)]*\)\s*{[^}]*}\s*$/gm);
    if (implicitAny) {
      findings.push({
        severity: 'minor', category: 'type', file,
        message: 'Possible implicit any in function parameters',
      });
    }
  }

  return findings;
}
