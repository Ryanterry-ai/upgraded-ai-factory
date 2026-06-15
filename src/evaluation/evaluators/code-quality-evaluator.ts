import { ProjectContext } from '../types.js';

export class CodeQualityEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for TypeScript strict mode
    const tsconfig = ctx.fileMap.get('tsconfig.json');
    if (tsconfig && tsconfig.includes('"strict"')) {
      score += 10;
    } else {
      findings.push({ rule: 'code:typescript-strict', message: 'TypeScript strict mode not enabled', severity: 'major' });
    }

    // Check for component count (reasonable structure)
    const componentCount = this.countFileType(ctx, '.tsx');
    if (componentCount >= 3) {
      score += 10;
    } else if (componentCount >= 1) {
      score += 5;
    } else {
      findings.push({ rule: 'code:components', message: 'Very few components found', severity: 'major' });
    }

    // Check for proper imports (no relative path hell)
    const hasRelativeImports = this.fileMapHasPattern(ctx, /from\s+['"]\.\.\/\.\.\/\.\.\//);
    if (!hasRelativeImports) {
      score += 5;
    } else {
      findings.push({ rule: 'code:imports', message: 'Deep relative imports detected (consider path aliases)', severity: 'minor' });
    }

    // Check for barrel exports (index files)
    const hasBarrelExports = this.hasAnyFile(ctx, ['index.ts', 'index.tsx']);
    if (hasBarrelExports) {
      score += 5;
    } else {
      findings.push({ rule: 'code:barrel-exports', message: 'No barrel export files found', severity: 'info' });
    }

    // Check for type definitions
    const hasTypes = this.fileMapHasPattern(ctx, /interface\s+\w+|type\s+\w+\s*=|enum\s+\w+/);
    if (hasTypes) {
      score += 10;
    } else {
      findings.push({ rule: 'code:types', message: 'No type definitions found', severity: 'major' });
    }

    // Check for error handling patterns
    const hasTryCatch = this.fileMapHasPattern(ctx, /try\s*\{|\.catch\(/);
    if (hasTryCatch) {
      score += 10;
    } else {
      findings.push({ rule: 'code:error-handling', message: 'No try/catch or .catch() error handling', severity: 'major' });
    }

    // Check for constants / configuration
    const hasConstants = this.fileMapHasPattern(ctx, /const\s+[A-Z_]+\s*[:=]|export\s+const\s+[A-Z]/);
    if (hasConstants) {
      score += 5;
    } else {
      findings.push({ rule: 'code:constants', message: 'No constants or configuration exports found', severity: 'info' });
    }

    // Check for utility functions
    const hasUtils = this.hasAnyFile(ctx, ['utils.ts', 'utils.tsx', 'helpers.ts', 'lib.ts', 'src/utils.ts', 'lib/utils.ts']);
    if (hasUtils) {
      score += 5;
    } else {
      findings.push({ rule: 'code:utils', message: 'No utility files found', severity: 'info' });
    }

    // Check for no console.log in production code
    const hasConsoleLog = this.fileMapHasPattern(ctx, /console\.log\(/);
    if (!hasConsoleLog) {
      score += 5;
    } else {
      findings.push({ rule: 'code:console-log', message: 'console.log statements found in production code', severity: 'minor' });
    }

    // Check for no any types
    const hasAny = this.fileMapHasPattern(ctx, /:\s*any\b|<any>/);
    if (!hasAny) {
      score += 5;
    } else {
      findings.push({ rule: 'code:no-any', message: 'Usage of "any" type detected', severity: 'minor' });
    }

    // Check for consistent file naming
    const hasConsistent = this.fileMapHasPattern(ctx, /export\s+default\s+(function|class)\s+[A-Z]/);
    if (hasConsistent) {
      score += 5;
    }

    // Check for React best practices
    const hasReactFC = this.fileMapHasPattern(ctx, /React\.FC|:\s*React\.FC/);
    const hasPropsInterface = this.fileMapHasPattern(ctx, /interface\s+\w+Props|type\s+\w+Props/);
    if (hasPropsInterface) {
      score += 10;
    } else if (hasReactFC) {
      score += 5;
    } else {
      findings.push({ rule: 'code:props', message: 'No Props interface/type definitions found', severity: 'minor' });
    }

    // Check for Next.js patterns
    const hasNextPatterns = this.fileMapHasPattern(ctx, /useRouter|useParams|useSearchParams|usePathname/);
    if (hasNextPatterns) {
      score += 5;
    }

    // Check for state management patterns
    const hasState = this.fileMapHasPattern(ctx, /useState|useReducer|createContext|useContext|zustand|jotai|redux/i);
    if (hasState) {
      score += 5;
    } else {
      findings.push({ rule: 'code:state', message: 'No state management patterns found', severity: 'info' });
    }

    const summary = score >= 80 ? 'Code quality is high' :
      score >= 60 ? 'Code quality has room for improvement' :
      score >= 40 ? 'Code quality needs work' :
      'Code quality is lacking';

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
