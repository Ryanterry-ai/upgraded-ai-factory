import { existsSync } from 'fs';
import { join } from 'path';
import { getAllFiles, readFile, type ValidationFinding } from './validators.js';

export function validateComponents(projectDir: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const tsFiles = getAllFiles(projectDir).filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && f.startsWith('src/'));

  const exportedComponents = new Set<string>();
  for (const file of tsFiles) {
    const content = readFile(join(projectDir, file));
    const exports = content.matchAll(/export\s+(?:function|const|class)\s+(\w+)/g);
    for (const m of exports) exportedComponents.add(m[1]);
    const defaultExports = content.matchAll(/export\s+default\s+(?:function|const|class)\s+(\w+)/g);
    for (const m of defaultExports) exportedComponents.add(m[1]);
    const typeExports = content.matchAll(/export\s+(?:type|interface)\s+(\w+)/g);
    for (const m of typeExports) exportedComponents.add(m[1]);
  }

  const componentFiles = tsFiles.filter(f => f.includes('components/'));
  for (const file of componentFiles) {
    const content = readFile(join(projectDir, file));
    const hasExport = /export\s+(?:function|const|class|default)/.test(content);
    if (!hasExport) {
      findings.push({
        severity: 'critical', category: 'component', file,
        message: 'Component file has no exports',
      });
    }
    const hasPropsInterface = /interface\s+\w+Props/.test(content) || /\(\{[^}]+\}/.test(content);
    const hasComponent = /export\s+(?:function|const)\s+\w+/.test(content);
    if (hasComponent && !hasPropsInterface && !content.includes('()')) {
      findings.push({
        severity: 'minor', category: 'component', file,
        message: 'Component has no typed props interface',
      });
    }
  }

  const pageFiles = tsFiles.filter(f => f.includes('app/') && f.endsWith('page.tsx'));
  for (const file of pageFiles) {
    const content = readFile(join(projectDir, file));
    const imports = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);
    for (const m of imports) {
      const importNames = m[1].split(',').map(s => s.trim()).filter(Boolean);
      const importPath = m[2];
      if (importPath.startsWith('@/components/')) {
        const componentName = importPath.replace('@/components/', '');
        for (const name of importNames) {
          if (!exportedComponents.has(name)) {
            const compFile = `src/components/${componentName}.tsx`;
            if (!existsSync(join(projectDir, compFile))) {
              findings.push({
                severity: 'critical', category: 'component', file,
                message: `Page imports '${name}' but component file '${compFile}' does not exist`,
              });
            } else {
              findings.push({
                severity: 'major', category: 'component', file,
                message: `Page imports '${name}' from '${compFile}' but component is not exported`,
              });
            }
          }
        }
      }
    }
  }

  return findings;
}
