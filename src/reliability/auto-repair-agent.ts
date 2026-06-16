import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { getAllFiles, type ValidationFinding } from './validators.js';

export interface RepairAction {
  file: string;
  action: string;
  description: string;
}

export function autoRepair(projectDir: string, findings: ValidationFinding[]): RepairAction[] {
  const actions: RepairAction[] = [];

  const criticalFindings = findings.filter(f => f.severity === 'critical');
  for (const finding of criticalFindings) {
    switch (finding.category) {
      case 'client-component':
        if (finding.message.includes('Missing "use client"')) {
          const fixed = addUseClientDirective(projectDir, finding.file);
          if (fixed) actions.push({ file: finding.file, action: 'add_use_client', description: 'Added "use client" directive' });
        }
        break;
      case 'component':
        if (finding.message.includes('does not exist')) {
          const fixed = createStubComponent(projectDir, finding.file, finding.message);
          if (fixed) actions.push({ file: finding.file, action: 'create_stub', description: 'Created stub component' });
        }
        break;
      case 'import':
        if (finding.message.includes('Missing module')) {
          const fixed = createStubForMissingImport(projectDir, finding.file, finding.message);
          if (fixed) actions.push({ file: finding.file, action: 'create_stub', description: 'Created stub for missing import' });
        }
        break;
    }
  }

  const majorFindings = findings.filter(f => f.severity === 'major');
  for (const finding of majorFindings) {
    switch (finding.category) {
      case 'artifact':
        if (finding.message.includes('Missing dependency')) {
          const fixed = addMissingDependency(projectDir, finding.message);
          if (fixed) actions.push({ file: 'package.json', action: 'add_dep', description: finding.message });
        }
        break;
    }
  }

  return actions;
}

function addUseClientDirective(projectDir: string, file: string): boolean {
  const fullPath = join(projectDir, file);
  if (!existsSync(fullPath)) return false;
  const content = readFileSync(fullPath, 'utf-8');
  if (content.startsWith('"use client"')) return false;
  writeFileSync(fullPath, '"use client";\n\n' + content);
  return true;
}

function createStubComponent(projectDir: string, file: string, message: string): boolean {
  const match = message.match(/component file '([^']+)'/);
  if (!match) return false;
  const compPath = match[1];
  const fullPath = join(projectDir, compPath);
  if (existsSync(fullPath)) return false;

  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const name = compPath.split('/').pop()?.replace(/\.tsx$/, '') || 'Component';
  const stub = `"use client";\n\nexport function ${name}({ children }: { children?: React.ReactNode }) {\n  return <div className="p-4">{children ?? '${name}'}</div>;\n}\n`;
  writeFileSync(fullPath, stub);
  return true;
}

function createStubForMissingImport(projectDir: string, file: string, message: string): boolean {
  const match = message.match(/Missing module: (@\/[^\s]+)/);
  if (!match) return false;
  const importPath = match[1];
  const resolved = importPath.replace('@/', 'src/');
  const fullPath = join(projectDir, resolved + '.tsx');
  if (existsSync(fullPath)) return false;
  const tsPath = join(projectDir, resolved + '.ts');
  if (existsSync(tsPath)) return false;

  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const name = resolved.split('/').pop() || 'unknown';
  if (name[0] === name[0].toUpperCase()) {
    writeFileSync(fullPath, `"use client";\n\nexport function ${name}({ children }: { children?: React.ReactNode }) {\n  return <div className="p-4">{children ?? '${name}'}</div>;\n}\n`);
  } else {
    writeFileSync(tsPath, `export type ${name} = Record<string, unknown>;\nexport default {} as ${name};\n`);
  }
  return true;
}

function addMissingDependency(projectDir: string, message: string): boolean {
  const match = message.match(/Missing dependency: (\w+)/);
  if (!match) return false;
  const dep = match[1];
  const pkgPath = join(projectDir, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const versions: Record<string, string> = {
    next: '^14.2.0', react: '^18.3.0', 'react-dom': '^18.3.0',
    typescript: '^5.5.0', tailwindcss: '^3.4.0', postcss: '^8.4.0',
    autoprefixer: '^10.4.0',
  };
  if (versions[dep]) {
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.devDependencies) pkg.devDependencies = {};
    if (dep === 'typescript' || dep === 'tailwindcss' || dep === 'postcss' || dep === 'autoprefixer') {
      pkg.devDependencies[dep] = versions[dep];
    } else {
      pkg.dependencies[dep] = versions[dep];
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    return true;
  }
  return false;
}
