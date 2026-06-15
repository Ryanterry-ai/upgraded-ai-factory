import { ProjectContext } from '../types.js';

export class BuildEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check package.json
    if (ctx.packageJson) {
      score += 10;
      if (ctx.packageJson.scripts?.build) score += 5;
      if (ctx.packageJson.scripts?.start) score += 3;
      if (ctx.packageJson.dependencies) score += 5;
    } else {
      findings.push({ rule: 'build:package-json', message: 'Missing package.json', severity: 'critical' });
    }

    // Check tsconfig
    const tsconfig = ctx.fileMap.get('tsconfig.json');
    if (tsconfig) {
      score += 10;
      if (tsconfig.includes('"strict"')) score += 5;
    } else {
      findings.push({ rule: 'build:tsconfig', message: 'Missing tsconfig.json', severity: 'critical' });
    }

    // Check next.config
    const nextConfig = ctx.fileMap.get('next.config.js') || ctx.fileMap.get('next.config.mjs') || ctx.fileMap.get('next.config.ts');
    if (nextConfig) {
      score += 5;
    } else {
      findings.push({ rule: 'build:next-config', message: 'Missing next.config.js', severity: 'major' });
    }

    // Check app structure
    const hasAppDir = this.hasAnyFile(ctx, ['app', 'src/app', 'pages', 'src/pages']);
    if (hasAppDir) {
      score += 10;
    } else {
      findings.push({ rule: 'build:app-structure', message: 'No app or pages directory found', severity: 'critical' });
    }

    // Check for layout
    const hasLayout = this.hasAnyFile(ctx, ['app/layout.tsx', 'app/layout.jsx', 'src/app/layout.tsx', 'pages/_app.tsx']);
    if (hasLayout) {
      score += 5;
    } else {
      findings.push({ rule: 'build:layout', message: 'No layout component found', severity: 'major' });
    }

    // Check for components
    const componentCount = this.countFileType(ctx, '.tsx');
    if (componentCount >= 3) {
      score += 10;
    } else if (componentCount >= 1) {
      score += 5;
    } else {
      findings.push({ rule: 'build:components', message: 'No React components found', severity: 'critical' });
    }

    // Check for globals.css
    const hasStyles = this.hasAnyFile(ctx, ['globals.css', 'src/globals.css', 'app/globals.css', 'styles/globals.css']);
    if (hasStyles) {
      score += 5;
    } else {
      findings.push({ rule: 'build:styles', message: 'No global styles found', severity: 'minor' });
    }

    // Check for types
    const typeCount = this.countFileType(ctx, '.ts');
    if (typeCount >= 2) {
      score += 5;
    } else {
      findings.push({ rule: 'build:types', message: 'Limited TypeScript usage', severity: 'minor' });
    }

    // Check for imports (valid structure)
    const hasImports = this.fileMapHasPattern(ctx, /import\s+/);
    if (hasImports) {
      score += 5;
    } else {
      findings.push({ rule: 'build:imports', message: 'No import statements found', severity: 'major' });
    }

    // Check for exports
    const hasExports = this.fileMapHasPattern(ctx, /export\s+(default|const|function|class)/);
    if (hasExports) {
      score += 5;
    } else {
      findings.push({ rule: 'build:exports', message: 'No exports found', severity: 'minor' });
    }

    // Check for environment example
    if (ctx.fileMap.has('.env.example') || ctx.fileMap.has('.env.local.example')) {
      score += 5;
    } else {
      findings.push({ rule: 'build:env', message: 'No .env.example found', severity: 'minor' });
    }

    // Check for README
    if (ctx.fileMap.has('README.md')) {
      score += 5;
    } else {
      findings.push({ rule: 'build:readme', message: 'No README.md found', severity: 'minor' });
    }

    // Check for lock file
    if (ctx.fileMap.has('package-lock.json') || ctx.fileMap.has('yarn.lock') || ctx.fileMap.has('pnpm-lock.yaml')) {
      score += 5;
    } else {
      findings.push({ rule: 'build:lockfile', message: 'No lock file found', severity: 'minor' });
    }

    // Check for node_modules (dependencies installed)
    if (ctx.fileMap.has('node_modules/.package-lock.json') || ctx.fileMap.has('node_modules/.yarn-integrity')) {
      score += 5;
    }

    const summary = score >= 80 ? 'Build structure is solid' :
      score >= 60 ? 'Build structure has minor gaps' :
      score >= 40 ? 'Build structure needs improvement' :
      'Build structure is incomplete';

    return { score, maxScore, findings, summary };
  }

  private hasAnyFile(ctx: ProjectContext, paths: string[]): boolean {
    return paths.some(p => ctx.fileMap.has(p));
  }

  private countFileType(ctx: ProjectContext, ext: string): number {
    let count = 0;
    for (const key of ctx.fileMap.keys()) {
      if (key.endsWith(ext)) count++;
    }
    return count;
  }

  private fileMapHasPattern(ctx: ProjectContext, pattern: RegExp): boolean {
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
        if (pattern.test(content)) return true;
      }
    }
    return false;
  }
}
