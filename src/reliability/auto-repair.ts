import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface RepairResult {
  fixed: string[];
  failed: string[];
  warnings: string[];
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getAllFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

export function autoRepairProject(projectDir: string): RepairResult {
  const result: RepairResult = { fixed: [], failed: [], warnings: [] };
  if (!existsSync(projectDir)) { result.failed.push('Project directory not found'); return result; }

  const files = getAllFiles(projectDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  const srcFiles = files.filter(f => f.includes('src'));

  // 1. Fix missing "use client" directives
  for (const file of srcFiles) {
    if (result.fixed.includes(file)) continue;
    const content = readFileSync(file, 'utf-8');
    const needsClient = /useState|useEffect|useRef|useCallback|useMemo|onClick|onChange|onSubmit|React\.FormEvent|React\.MouseEvent|event\.(prevent|stop)/.test(content);
    const hasClient = content.startsWith('"use client"') || content.includes('\n"use client"');
    if (needsClient && !hasClient) {
      writeFileSync(file, '"use client";\n\n' + content);
      result.fixed.push(`Added "use client" to ${file.replace(projectDir, '')}`);
    }
  }

  // 2. Fix missing component files - scan imports and create stubs
  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');
    const importMatches = [...content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"](@\/[^'"]+)['"]/g)];
    for (const match of importMatches) {
      const importNames = match[1].split(',').map(s => s.trim()).filter(Boolean);
      const importPath = match[2];
      const resolvedPath = importPath.replace('@/', 'src/');

      for (const name of importNames) {
        const componentPath = join(projectDir, `${resolvedPath}.tsx`);
        const tsPath = join(projectDir, `${resolvedPath}.ts`);
        if (!existsSync(componentPath) && !existsSync(tsPath)) {
          // Create stub component
          const stubDir = componentPath.substring(0, componentPath.lastIndexOf('/'));
          if (!existsSync(stubDir)) {
            const { mkdirSync } = require('fs');
            mkdirSync(stubDir, { recursive: true });
          }
          if (name[0] === name[0].toUpperCase()) {
            // Component stub
            const stub = `"use client";\n\nexport function ${name}({ children }: { children?: React.ReactNode }) {\n  return <div className="p-4">{children ?? '${name}'}</div>;\n}\n`;
            writeFileSync(componentPath, stub);
            result.fixed.push(`Created stub component: ${resolvedPath}.tsx`);
          } else {
            // Type/util stub
            const stub = `export type ${name} = Record<string, unknown>;\nexport default {} as ${name};\n`;
            writeFileSync(tsPath, stub);
            result.fixed.push(`Created stub type: ${resolvedPath}.ts`);
          }
        }
      }
    }
  }

  // 3. Fix missing "use client" on components that import client-side hooks
  for (const file of srcFiles) {
    if (file.includes('layout.tsx') || file.includes('page.tsx') && !file.includes('app/page.tsx')) continue;
    const content = readFileSync(file, 'utf-8');
    const hasHookImport = /import.*(?:useState|useEffect|useRef|useCallback|useMemo).*from\s+['"]react['"]/.test(content);
    const hasClient = content.startsWith('"use client"');
    if (hasHookImport && !hasClient) {
      writeFileSync(file, '"use client";\n\n' + content);
      result.fixed.push(`Added "use client" to ${file.replace(projectDir, '')}`);
    }
  }

  // 4. Fix TypeScript strict mode issues - make optional props have defaults
  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');
    // Fix: props that are required but used with ? in destructuring
    if (content.includes('{ children }:') && !content.includes('{ children }: {')) {
      // This is a common pattern issue
    }
  }

  // 5. Ensure all API routes have proper imports
  const apiDir = join(projectDir, 'src/app/api');
  if (existsSync(apiDir)) {
    const apiFiles = getAllFiles(apiDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const file of apiFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('NextResponse') && !content.includes("from 'next/server'")) {
        const fixed = content.replace(
          /^(import.*from.*['"][^'"]+['"];\n?)/m,
          `$1import { NextResponse } from 'next/server';\n`
        );
        writeFileSync(file, fixed);
        result.fixed.push(`Added NextResponse import to ${file.replace(projectDir, '')}`);
      }
    }
  }

  // 6. Fix missing globals.css reference in layout
  const layoutFile = join(projectDir, 'src/app/layout.tsx');
  if (existsSync(layoutFile)) {
    const content = readFileSync(layoutFile, 'utf-8');
    const hasCssImport = content.includes("globals.css");
    if (!hasCssImport) {
      const fixed = content.replace(
        /^(export default function)/m,
        "import './globals.css';\n\n$1"
      );
      writeFileSync(layoutFile, fixed);
      result.fixed.push('Added globals.css import to layout.tsx');
    }
  }

  return result;
}

export function repairAllProjects(baseDir: string): Record<string, RepairResult> {
  const results: Record<string, RepairResult> = {};
  if (!existsSync(baseDir)) return results;

  const factories = readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const factory of factories) {
    const factoryDir = join(baseDir, factory.name);
    const projects = readdirSync(factoryDir, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const project of projects) {
      const projectDir = join(factoryDir, project.name);
      // Find the actual project dir (may be nested)
      const subDirs = readdirSync(projectDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const sub of subDirs) {
        const actualDir = join(projectDir, sub.name);
        if (existsSync(join(actualDir, 'package.json'))) {
          results[`${factory.name}/${project.name}/${sub.name}`] = autoRepairProject(actualDir);
        }
      }
    }
  }
  return results;
}
