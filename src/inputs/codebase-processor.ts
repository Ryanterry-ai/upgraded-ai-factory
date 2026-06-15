import * as fs from 'fs';
import * as path from 'path';
import type { StudioInput } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';

export class CodebaseProcessor implements InputProcessor {
  type = 'codebase' as const;

  canProcess(input: StudioInput): boolean {
    return !!input.codebasePath;
  }

  async process(input: StudioInput): Promise<ProcessedInput> {
    const codebasePath = input.codebasePath!;
    
    if (!fs.existsSync(codebasePath)) {
      throw new Error(`Codebase not found: ${codebasePath}`);
    }

    const analysis = this.analyzeCodebase(codebasePath);
    const prompt = input.prompt || this.generatePrompt(codebasePath, analysis);

    return {
      type: 'codebase',
      prompt,
      metadata: {
        title: `Codebase: ${path.basename(codebasePath)}`,
        description: `Analyzed ${analysis.fileCount} files (${analysis.framework || 'unknown framework'})`,
        structure: analysis,
      },
    };
  }

  private analyzeCodebase(dirPath: string): Record<string, unknown> {
    const files: string[] = [];
    let totalSize = 0;

    const scan = (dir: string, depth: number = 0) => {
      if (depth > 5) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(fullPath, depth + 1);
          } else if (entry.isFile()) {
            files.push(fullPath);
            totalSize += fs.statSync(fullPath).size;
          }
        }
      } catch {}
    };

    scan(dirPath);

    const extCounts: Record<string, number> = {};
    files.forEach(f => {
      const ext = path.extname(f).toLowerCase();
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    });

    let framework = 'unknown';
    const packageJsonPath = path.join(dirPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps['next']) framework = 'nextjs';
        else if (allDeps['react']) framework = 'react';
        else if (allDeps['vue']) framework = 'vue';
        else if (allDeps['svelte']) framework = 'svelte';
        else if (allDeps['angular'] || allDeps['@angular/core']) framework = 'angular';
      } catch {}
    }

    const hasComponents = files.some(f => /component/i.test(f));
    const hasPages = files.some(f => /page|route/i.test(f));
    const hasApi = files.some(f => /api|server/i.test(f));
    const hasStyles = files.some(f => /\.(css|scss|less|styled)/i.test(f));
    const hasTests = files.some(f => /\.(test|spec)\./i.test(f));

    return { fileCount: files.length, totalSize, extCounts, framework, hasComponents, hasPages, hasApi, hasStyles, hasTests };
  }

  private generatePrompt(dirPath: string, analysis: Record<string, unknown>): string {
    const name = path.basename(dirPath);
    const framework = analysis.framework || 'unknown';
    return `Rebuild and improve the "${name}" ${framework} codebase. Maintain existing functionality while upgrading to modern patterns and best practices.`;
  }
}
