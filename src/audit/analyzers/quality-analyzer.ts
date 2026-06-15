import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface QualityMetrics {
  buildSuccess: boolean;
  buildTimeMs: number;
  buildError: string | null;
  tsErrors: number;
  tsErrorDetails: string[];
  fileCount: number;
  totalLines: number;
  hasStyles: boolean;
  hasComponents: boolean;
  hasPages: boolean;
  hasConfig: boolean;
  hasPackageJson: boolean;
  componentCount: number;
  pageCount: number;
  apiRouteCount: number;
  hasResponsiveDesign: boolean;
  hasAccessibility: boolean;
  hasMetadata: boolean;
  hasErrorBoundary: boolean;
  hasLoadingStates: boolean;
  hasDarkMode: boolean;
  lintWarnings: number;
  lintErrors: number;
  score: number;
}

function countFiles(dir: string, ext: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          count += countFiles(fullPath, ext);
        } else if (item.endsWith(ext)) {
          count++;
        }
      } catch { /* skip inaccessible */ }
    }
  } catch { /* skip */ }
  return count;
}

function countLines(dir: string, exts: string[]): number {
  if (!existsSync(dir)) return 0;
  let lines = 0;
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          lines += countLines(fullPath, exts);
        } else if (exts.some(ext => item.endsWith(ext))) {
          const content = require('fs').readFileSync(fullPath, 'utf-8');
          lines += content.split('\n').length;
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return lines;
}

function scanFileContent(dir: string, patterns: RegExp[]): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          count += scanFileContent(fullPath, patterns);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
          const content = require('fs').readFileSync(fullPath, 'utf-8');
          for (const pattern of patterns) {
            if (pattern.test(content)) count++;
            break;
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return count;
}

export function analyzeQuality(projectPath: string, factoryName: string): QualityMetrics {
  const startTime = Date.now();
  let buildSuccess = false;
  let buildError: string | null = null;
  let buildTimeMs = 0;

  // Try to build the project
  const packageJsonPath = join(projectPath, 'package.json');
  const hasPackageJson = existsSync(packageJsonPath);

  if (hasPackageJson) {
    try {
      // Install dependencies
      execSync('npm install --legacy-peer-deps 2>&1', {
        cwd: projectPath,
        timeout: 120000,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Try TypeScript check
      const buildStart = Date.now();
      try {
        execSync('npx tsc --noEmit 2>&1', {
          cwd: projectPath,
          timeout: 60000,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        buildSuccess = true;
      } catch (e: any) {
        // tsc fails = TS errors exist
        buildError = e.stdout || e.message;
      }
      buildTimeMs = Date.now() - buildStart;

      // Also try next build if available
      if (!buildSuccess) {
        try {
          const nextBuildStart = Date.now();
          execSync('npx next build 2>&1', {
            cwd: projectPath,
            timeout: 120000,
            encoding: 'utf-8',
            stdio: 'pipe',
          });
          buildSuccess = true;
          buildTimeMs = Date.now() - nextBuildStart;
        } catch (e: any) {
          buildError = e.stdout || e.message;
        }
      }
    } catch (e: any) {
      buildError = `npm install failed: ${e.message}`;
    }
  }

  // Count TypeScript errors
  let tsErrors = 0;
  let tsErrorDetails: string[] = [];
  try {
    const tscOutput = execSync('npx tsc --noEmit 2>&1', {
      cwd: projectPath,
      timeout: 30000,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    // No errors
  } catch (e: any) {
    const output = e.stdout || e.message || '';
    const errorMatches = output.match(/error TS\d+:/g);
    tsErrors = errorMatches ? errorMatches.length : 0;
    tsErrorDetails = output
      .split('\n')
      .filter((line: string) => line.includes('error TS'))
      .slice(0, 10);
  }

  // File analysis
  const srcDir = join(projectPath, 'src');
  const appDir = join(projectPath, 'app');
  const pagesDir = join(projectPath, 'pages');
  const componentsDir = join(projectPath, 'components');
  const stylesDir = join(projectPath, 'styles');

  const checkDir = existsSync(srcDir) ? srcDir : existsSync(appDir) ? appDir : projectPath;

  const fileCount = countFiles(checkDir, '.tsx') + countFiles(checkDir, '.ts') + countFiles(checkDir, '.jsx') + countFiles(checkDir, '.js');
  const totalLines = countLines(checkDir, ['.tsx', '.ts', '.jsx', '.js']);

  const componentCount = countFiles(checkDir, '.tsx') + countFiles(checkDir, '.jsx');
  const pageCount = countFiles(pagesDir, '.tsx') + countFiles(pagesDir, '.jsx') + countFiles(appDir, 'page.tsx') + countFiles(appDir, 'page.jsx');
  const apiRouteCount = countFiles(join(checkDir, 'api'), '.ts') + countFiles(join(checkDir, 'api'), '.tsx') +
    countFiles(pagesDir, 'api') + (existsSync(join(appDir, 'api')) ? countFiles(join(appDir, 'api'), '.ts') : 0);

  const hasStyles = existsSync(stylesDir) || existsSync(join(projectPath, 'globals.css')) || existsSync(join(checkDir, 'globals.css'));
  const hasComponents = existsSync(componentsDir) || (fileCount > 0);
  const hasPages = pageCount > 0 || existsSync(pagesDir) || existsSync(appDir);
  const hasConfig = existsSync(join(projectPath, 'next.config.js')) || existsSync(join(projectPath, 'next.config.mjs')) || existsSync(join(projectPath, 'next.config.ts'));

  // Content scanning
  const responsivePatterns = [/\bmedia\b.*\bquery\b/i, /@media/, /responsive/i, /flex-wrap/i, /grid-template/i];
  const accessibilityPatterns = [/aria-/i, /role=/i, /alt=/i, /tabIndex/i, /<label/i];
  const metadataPatterns = [/metadata/i, /<head/i, /<title/i, /og:/i, /twitter:/i, /SEO/i];
  const errorBoundaryPatterns = [/ErrorBoundary/i, /componentDidCatch/i, /error\.tsx/i, /error\.jsx/i];
  const loadingPatterns = [/loading/i, /Suspense/i, /useState.*loading/i, /isLoading/i];
  const darkModePatterns = [/dark/i, /theme/i, /prefers-color-scheme/i, /darkMode/i];

  const hasResponsiveDesign = scanFileContent(checkDir, responsivePatterns) > 0;
  const hasAccessibility = scanFileContent(checkDir, accessibilityPatterns) > 0;
  const hasMetadata = scanFileContent(checkDir, metadataPatterns) > 0;
  const hasErrorBoundary = scanFileContent(checkDir, errorBoundaryPatterns) > 0;
  const hasLoadingStates = scanFileContent(checkDir, loadingPatterns) > 0;
  const hasDarkMode = scanFileContent(checkDir, darkModePatterns) > 0;

  // Lint check
  let lintWarnings = 0;
  let lintErrors = 0;
  try {
    const eslintOutput = execSync('npx eslint . --ext .ts,.tsx 2>&1 || true', {
      cwd: projectPath,
      timeout: 30000,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const warningMatches = eslintOutput.match(/\d+ warning/g);
    const errorMatches = eslintOutput.match(/\d+ error/g);
    lintWarnings = warningMatches ? parseInt(warningMatches[0]) : 0;
    lintErrors = errorMatches ? parseInt(errorMatches[0]) : 0;
  } catch { /* eslint not available */ }

  // Calculate score (0-100)
  let score = 0;

  // Build success (40 points)
  if (buildSuccess) score += 40;
  else if (buildError && tsErrors > 0) score += Math.max(0, 20 - tsErrors * 2);

  // TS errors (15 points)
  if (tsErrors === 0) score += 15;
  else if (tsErrors <= 3) score += 10;
  else if (tsErrors <= 10) score += 5;

  // File structure (15 points)
  if (hasPackageJson) score += 3;
  if (hasConfig) score += 3;
  if (hasPages) score += 3;
  if (hasComponents) score += 3;
  if (hasStyles) score += 3;

  // Content quality (30 points)
  if (hasResponsiveDesign) score += 5;
  if (hasAccessibility) score += 5;
  if (hasMetadata) score += 5;
  if (hasErrorBoundary) score += 5;
  if (hasLoadingStates) score += 5;
  if (hasDarkMode) score += 5;

  return {
    buildSuccess,
    buildTimeMs,
    buildError,
    tsErrors,
    tsErrorDetails,
    fileCount,
    totalLines,
    hasStyles,
    hasComponents,
    hasPages,
    hasConfig,
    hasPackageJson,
    componentCount,
    pageCount,
    apiRouteCount,
    hasResponsiveDesign,
    hasAccessibility,
    hasMetadata,
    hasErrorBoundary,
    hasLoadingStates,
    hasDarkMode,
    lintWarnings,
    lintErrors,
    score,
  };
}
