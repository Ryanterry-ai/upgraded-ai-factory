import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { StudioEngine } from '../core/engine.js';
import { allPrompts, BenchmarkPrompt } from './prompts/benchmark-prompts.js';
import { analyzeQuality, QualityMetrics } from './analyzers/quality-analyzer.js';

export interface BenchmarkResult {
  promptId: string;
  prompt: string;
  factory: string;
  complexity: string;
  outputPath: string;
  generationSuccess: boolean;
  generationError: string | null;
  generationTimeMs: number;
  quality: QualityMetrics;
  timestamp: string;
}

export interface FactoryScorecard {
  factory: string;
  totalProjects: number;
  successfulGenerations: number;
  successfulBuilds: number;
  avgScore: number;
  avgBuildTimeMs: number;
  avgTsErrors: number;
  avgFileCount: number;
  avgLines: number;
  avgComponentCount: number;
  avgPageCount: number;
  responsiveRate: number;
  accessibilityRate: number;
  metadataRate: number;
  errorBoundaryRate: number;
  loadingStateRate: number;
  darkModeRate: number;
  lintWarnings: number;
  lintErrors: number;
  results: BenchmarkResult[];
  weakestPrompts: string[];
  strongestPrompts: string[];
}

export interface AuditReport {
  timestamp: string;
  totalProjects: number;
  totalFactories: number;
  overallScore: number;
  overallBuildRate: number;
  factoryScorecards: FactoryScorecard[];
  weakFactories: string[];
  strongFactories: string[];
  recommendations: string[];
}

const BENCHMARK_DIR = join(process.cwd(), 'benchmarks');

export async function runBenchmark(
  factoryName: string,
  prompt: BenchmarkPrompt,
  index: number
): Promise<BenchmarkResult> {
  const projectDir = join(BENCHMARK_DIR, factoryName, prompt.id);
  mkdirSync(projectDir, { recursive: true });

  const timestamp = new Date().toISOString();
  let generationSuccess = false;
  let generationError: string | null = null;
  let generationTimeMs = 0;

  try {
    const engine = new StudioEngine();
    const startTime = Date.now();

    await engine.generate({
      prompt: prompt.prompt,
      outputDir: projectDir,
      factory: factoryName,
      dryRun: false,
    });

    generationTimeMs = Date.now() - startTime;
    generationSuccess = true;
  } catch (e: any) {
    generationError = e.message || 'Unknown error';
  }

  // Analyze quality even if generation failed (partial output)
  let quality: QualityMetrics;
  try {
    quality = analyzeQuality(projectDir, factoryName);
  } catch (e: any) {
    quality = {
      buildSuccess: false,
      buildTimeMs: 0,
      buildError: e.message,
      tsErrors: 0,
      tsErrorDetails: [],
      fileCount: 0,
      totalLines: 0,
      hasStyles: false,
      hasComponents: false,
      hasPages: false,
      hasConfig: false,
      hasPackageJson: false,
      componentCount: 0,
      pageCount: 0,
      apiRouteCount: 0,
      hasResponsiveDesign: false,
      hasAccessibility: false,
      hasMetadata: false,
      hasErrorBoundary: false,
      hasLoadingStates: false,
      hasDarkMode: false,
      lintWarnings: 0,
      lintErrors: 0,
      score: 0,
    };
  }

  return {
    promptId: prompt.id,
    prompt: prompt.prompt,
    factory: factoryName,
    complexity: prompt.complexity,
    outputPath: projectDir,
    generationSuccess,
    generationError,
    generationTimeMs,
    quality,
    timestamp,
  };
}

export async function runFactoryBenchmarks(
  factoryName: string,
  count: number = 20
): Promise<FactoryScorecard> {
  const prompts = allPrompts[factoryName];
  if (!prompts) {
    throw new Error(`No prompts found for factory: ${factoryName}`);
  }

  const selectedPrompts = prompts.slice(0, count);
  const results: BenchmarkResult[] = [];

  console.log(`\n🏭 Running ${selectedPrompts.length} benchmarks for ${factoryName} factory...`);

  for (let i = 0; i < selectedPrompts.length; i++) {
    const prompt = selectedPrompts[i];
    console.log(`  [${i + 1}/${selectedPrompts.length}] ${prompt.id}: ${prompt.prompt.substring(0, 60)}...`);

    try {
      const result = await runBenchmark(factoryName, prompt, i);
      results.push(result);

      const status = result.generationSuccess ? '✅' : '❌';
      const buildStatus = result.quality.buildSuccess ? '🔨' : '⚠️';
      console.log(`    ${status} Generated ${buildStatus} Score: ${result.quality.score}/100`);
    } catch (e: any) {
      console.log(`    ❌ Failed: ${e.message}`);
      results.push({
        promptId: prompt.id,
        prompt: prompt.prompt,
        factory: factoryName,
        complexity: prompt.complexity,
        outputPath: '',
        generationSuccess: false,
        generationError: e.message,
        generationTimeMs: 0,
        quality: {
          buildSuccess: false, buildTimeMs: 0, buildError: e.message,
          tsErrors: 0, tsErrorDetails: [], fileCount: 0, totalLines: 0,
          hasStyles: false, hasComponents: false, hasPages: false, hasConfig: false,
          hasPackageJson: false, componentCount: 0, pageCount: 0, apiRouteCount: 0,
          hasResponsiveDesign: false, hasAccessibility: false, hasMetadata: false,
          hasErrorBoundary: false, hasLoadingStates: false, hasDarkMode: false,
          lintWarnings: 0, lintErrors: 0, score: 0,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  return generateScorecard(factoryName, results);
}

export function generateScorecard(factoryName: string, results: BenchmarkResult[]): FactoryScorecard {
  const successfulGenerations = results.filter(r => r.generationSuccess).length;
  const successfulBuilds = results.filter(r => r.quality.buildSuccess).length;
  const scores = results.map(r => r.quality.score);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const buildTimes = results.map(r => r.quality.buildTimeMs).filter(t => t > 0);
  const avgBuildTimeMs = buildTimes.length > 0 ? buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length : 0;
  const tsErrorsList = results.map(r => r.quality.tsErrors);
  const avgTsErrors = tsErrorsList.length > 0 ? tsErrorsList.reduce((a, b) => a + b, 0) / tsErrorsList.length : 0;
  const fileCounts = results.map(r => r.quality.fileCount);
  const avgFileCount = fileCounts.length > 0 ? fileCounts.reduce((a, b) => a + b, 0) / fileCounts.length : 0;
  const linesList = results.map(r => r.quality.totalLines);
  const avgLines = linesList.length > 0 ? linesList.reduce((a, b) => a + b, 0) / linesList.length : 0;
  const componentCounts = results.map(r => r.quality.componentCount);
  const avgComponentCount = componentCounts.length > 0 ? componentCounts.reduce((a, b) => a + b, 0) / componentCounts.length : 0;
  const pageCounts = results.map(r => r.quality.pageCount);
  const avgPageCount = pageCounts.length > 0 ? pageCounts.reduce((a, b) => a + b, 0) / pageCounts.length : 0;

  const responsiveCount = results.filter(r => r.quality.hasResponsiveDesign).length;
  const accessibilityCount = results.filter(r => r.quality.hasAccessibility).length;
  const metadataCount = results.filter(r => r.quality.hasMetadata).length;
  const errorBoundaryCount = results.filter(r => r.quality.hasErrorBoundary).length;
  const loadingStateCount = results.filter(r => r.quality.hasLoadingStates).length;
  const darkModeCount = results.filter(r => r.quality.hasDarkMode).length;

  const totalLintWarnings = results.reduce((sum, r) => sum + r.quality.lintWarnings, 0);
  const totalLintErrors = results.reduce((sum, r) => sum + r.quality.lintErrors, 0);

  // Identify weakest and strongest
  const sorted = [...results].sort((a, b) => a.quality.score - b.quality.score);
  const weakestPrompts = sorted.slice(0, 5).map(r => r.promptId);
  const strongestPrompts = sorted.slice(-5).map(r => r.promptId).reverse();

  return {
    factory: factoryName,
    totalProjects: results.length,
    successfulGenerations,
    successfulBuilds,
    avgScore: Math.round(avgScore * 10) / 10,
    avgBuildTimeMs: Math.round(avgBuildTimeMs),
    avgTsErrors: Math.round(avgTsErrors * 10) / 10,
    avgFileCount: Math.round(avgFileCount),
    avgLines: Math.round(avgLines),
    avgComponentCount: Math.round(avgComponentCount),
    avgPageCount: Math.round(avgPageCount),
    responsiveRate: Math.round((responsiveCount / results.length) * 100),
    accessibilityRate: Math.round((accessibilityCount / results.length) * 100),
    metadataRate: Math.round((metadataCount / results.length) * 100),
    errorBoundaryRate: Math.round((errorBoundaryCount / results.length) * 100),
    loadingStateRate: Math.round((loadingStateCount / results.length) * 100),
    darkModeRate: Math.round((darkModeCount / results.length) * 100),
    lintWarnings: totalLintWarnings,
    lintErrors: totalLintErrors,
    results,
    weakestPrompts,
    strongestPrompts,
  };
}
