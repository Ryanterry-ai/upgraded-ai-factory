import { MemoryStore, type Project, type Pattern, type BlueprintRecord, type Generation, type Evaluation } from './memory-store.js';
import { RetrievalSystem, type RetrievalContext } from './retrieval-system.js';
import type { Blueprint, FactoryType, FactoryResult } from '../core/types.js';

export interface MemoryConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  openaiKey?: string;
  retrieval?: {
    maxProjects?: number;
    maxPatterns?: number;
    maxBlueprints?: number;
    maxGenerations?: number;
    minSimilarity?: number;
  };
}

export class MemoryIntegration {
  private store: MemoryStore;
  private retrieval: RetrievalSystem;
  private enabled: boolean;

  constructor(config?: MemoryConfig) {
    this.store = new MemoryStore(config);
    this.retrieval = new RetrievalSystem(this.store, config?.retrieval);
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getStore(): MemoryStore {
    return this.store;
  }

  getRetrieval(): RetrievalSystem {
    return this.retrieval;
  }

  async retrieveContext(prompt: string, factory?: FactoryType): Promise<RetrievalContext> {
    if (!this.enabled) {
      return {
        relevantProjects: [],
        relevantPatterns: [],
        relevantBlueprints: [],
        relevantGenerations: [],
        topPatterns: [],
        successfulGenerations: [],
      };
    }
    return this.retrieval.retrieve(prompt, factory);
  }

  async recordGeneration(
    prompt: string,
    factory: FactoryType,
    result: FactoryResult,
    buildSuccess: boolean,
    buildTimeMs: number,
    tsErrors: number = 0,
    lintWarnings: number = 0
  ): Promise<{ project: Project; generation: Generation }> {
    if (!this.enabled) {
      return { project: { name: '', factory, prompt, quality_score: 0, build_success: false, file_count: 0 }, generation: { factory, prompt, build_success: false, build_time_ms: 0, file_count: 0, ts_errors: 0, lint_warnings: 0 } };
    }

    const projectName = result.blueprint?.project?.name || 'unknown';
    const fileCount = result.files?.length || 0;

    const project: Project = {
      name: projectName,
      factory,
      prompt,
      quality_score: this.calculateQualityScore(buildSuccess, tsErrors, lintWarnings, fileCount),
      build_success: buildSuccess,
      file_count: fileCount,
    };

    const savedProject = await this.store.saveProject(project);

    const embedding = await this.store.embedText(prompt);

    const blueprintRecord: BlueprintRecord = {
      project_id: savedProject.id!,
      json: result.blueprint,
      embedding,
    };
    await this.store.saveBlueprint(blueprintRecord);

    const generation: Generation = {
      factory,
      prompt,
      result: { projectName, fileCount, files: result.files?.map(f => f.path) },
      build_success: buildSuccess,
      build_time_ms: buildTimeMs,
      file_count: fileCount,
      ts_errors: tsErrors,
      lint_warnings: lintWarnings,
      embedding,
    };
    const savedGeneration = await this.store.saveGeneration(generation);

    if (buildSuccess) {
      await this.extractPatterns(result.blueprint, factory);
      await this.extractComponents(result.files || [], factory);
    }

    return { project: savedProject, generation: savedGeneration };
  }

  async recordEvaluation(projectId: string, scores: {
    seo: number;
    ux: number;
    perf: number;
    security: number;
    accessibility: number;
    codeQuality: number;
  }, findings?: Record<string, unknown>): Promise<Evaluation> {
    const evaluation: Evaluation = {
      project_id: projectId,
      seo_score: scores.seo,
      ux_score: scores.ux,
      perf_score: scores.perf,
      security_score: scores.security,
      accessibility_score: scores.accessibility,
      code_quality_score: scores.codeQuality,
      overall_score: (scores.seo + scores.ux + scores.perf + scores.security + scores.accessibility + scores.codeQuality) / 6,
      findings,
    };
    return this.store.saveEvaluation(evaluation);
  }

  private async extractPatterns(blueprint: Blueprint, factory: FactoryType): Promise<void> {
    if (!blueprint) return;

    const patterns: Pattern[] = [];

    if (blueprint.navigation) {
      patterns.push({
        category: 'navigation',
        description: `${blueprint.navigation.type} navigation with ${blueprint.navigation.items?.length || 0} items`,
        success_rate: 1.0,
        usage_count: 1,
        metadata: { factory, type: blueprint.navigation.type },
      });
    }

    if (blueprint.colors) {
      patterns.push({
        category: 'colors',
        description: `Color scheme with primary: ${blueprint.colors.primary?.main || 'default'}`,
        success_rate: 1.0,
        usage_count: 1,
        metadata: { factory, colors: blueprint.colors },
      });
    }

    if (blueprint.typography) {
      patterns.push({
        category: 'typography',
        description: `Typography: ${blueprint.typography.fontFamilies?.join(', ') || 'default'}`,
        success_rate: 1.0,
        usage_count: 1,
        metadata: { factory, typography: blueprint.typography },
      });
    }

    if (blueprint.pages && blueprint.pages.length > 0) {
      patterns.push({
        category: 'pages',
        description: `${blueprint.pages.length}-page structure: ${blueprint.pages.map(p => p.name).join(', ')}`,
        success_rate: 1.0,
        usage_count: 1,
        metadata: { factory, pageCount: blueprint.pages.length, pages: blueprint.pages.map(p => p.name) },
      });
    }

    for (const pattern of patterns) {
      const embedding = await this.store.embedText(`${pattern.category}: ${pattern.description}`);
      pattern.embedding = embedding;
      await this.store.savePattern(pattern);
    }
  }

  private async extractComponents(files: Array<{ path: string; content: string; type: string }>, factory: FactoryType): Promise<void> {
    const componentFiles = files.filter(f => f.type === 'component');

    for (const file of componentFiles.slice(0, 10)) {
      const name = file.path.split('/').pop()?.replace(/\.tsx$/, '') || 'unknown';
      const embedding = await this.store.embedText(`${name} ${file.content.substring(0, 500)}`);
      await this.store.saveComponent({
        name,
        factory,
        category: 'component',
        code: file.content,
        usage_count: 1,
        success_rate: 1.0,
        embedding,
      });
    }
  }

  private calculateQualityScore(buildSuccess: boolean, tsErrors: number, lintWarnings: number, fileCount: number): number {
    let score = 0;
    if (buildSuccess) score += 40;
    if (tsErrors === 0) score += 20;
    else if (tsErrors < 5) score += 10;
    if (lintWarnings === 0) score += 15;
    else if (lintWarnings < 5) score += 8;
    if (fileCount >= 10) score += 15;
    else if (fileCount >= 5) score += 8;
    if (fileCount >= 15) score += 10;
    return Math.min(100, score);
  }

  async getStats(): Promise<Record<string, number>> {
    return this.store.getStats();
  }
}

export function createMemoryIntegration(config?: MemoryConfig): MemoryIntegration {
  return new MemoryIntegration(config);
}
