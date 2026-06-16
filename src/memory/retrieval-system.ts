import { MemoryStore, type Project, type Pattern, type BlueprintRecord, type Generation, type SimilarityResult } from './memory-store.js';
import type { Blueprint, FactoryType } from '../core/types.js';

export interface RetrievalContext {
  relevantProjects: SimilarityResult<Project>[];
  relevantPatterns: SimilarityResult<Pattern>[];
  relevantBlueprints: SimilarityResult<BlueprintRecord>[];
  relevantGenerations: SimilarityResult<Generation>[];
  topPatterns: Pattern[];
  successfulGenerations: Generation[];
}

export interface RetrievalConfig {
  maxProjects?: number;
  maxPatterns?: number;
  maxBlueprints?: number;
  maxGenerations?: number;
  minSimilarity?: number;
}

export class RetrievalSystem {
  private store: MemoryStore;
  private config: RetrievalConfig;

  constructor(store: MemoryStore, config?: RetrievalConfig) {
    this.store = store;
    this.config = {
      maxProjects: config?.maxProjects || 5,
      maxPatterns: config?.maxPatterns || 10,
      maxBlueprints: config?.maxBlueprints || 5,
      maxGenerations: config?.maxGenerations || 5,
      minSimilarity: config?.minSimilarity || 0.3,
    };
  }

  async retrieve(prompt: string, factory?: FactoryType): Promise<RetrievalContext> {
    const embedding = await this.store.embedText(prompt);

    const [relevantProjects, relevantPatterns, relevantBlueprints, relevantGenerations, topPatterns, successfulGenerations] = await Promise.all([
      this.store.findSimilarProjects(embedding, this.config.maxProjects),
      this.store.findSimilarPatterns(embedding, this.config.maxPatterns),
      this.store.findSimilarBlueprints(embedding, this.config.maxBlueprints),
      this.store.findSimilarGenerations(embedding, this.config.maxGenerations),
      this.store.getTopPatterns(undefined, this.config.maxPatterns),
      this.store.getSuccessfulGenerations(factory, this.config.maxGenerations),
    ]);

    return {
      relevantProjects: relevantProjects.filter((r: { score: number }) => r.score >= this.config.minSimilarity!),
      relevantPatterns: relevantPatterns.filter((r: { score: number }) => r.score >= this.config.minSimilarity!),
      relevantBlueprints: relevantBlueprints.filter((r: { score: number }) => r.score >= this.config.minSimilarity!),
      relevantGenerations: relevantGenerations.filter((r: { score: number }) => r.score >= this.config.minSimilarity!),
      topPatterns,
      successfulGenerations,
    };
  }

  formatContextForGeneration(context: RetrievalContext): string {
    const sections: string[] = [];

    if (context.relevantProjects.length > 0) {
      sections.push('## Similar Successful Projects');
      for (const { item, score } of context.relevantProjects.slice(0, 3)) {
        sections.push(`- **${item.name}** (${item.factory}, score: ${(score * 100).toFixed(0)}%) — ${item.prompt.substring(0, 80)}`);
      }
    }

    if (context.relevantPatterns.length > 0) {
      sections.push('\n## Relevant Patterns');
      for (const { item, score } of context.relevantPatterns.slice(0, 5)) {
        sections.push(`- **${item.category}**: ${item.description.substring(0, 100)} (success: ${(item.success_rate * 100).toFixed(0)}%, match: ${(score * 100).toFixed(0)}%)`);
      }
    }

    if (context.relevantBlueprints.length > 0) {
      sections.push('\n## Reference Blueprints');
      for (const { item, score } of context.relevantBlueprints.slice(0, 3)) {
        if (item.json) {
          const bp = item.json as Blueprint;
          sections.push(`- **${bp.project?.name || 'Unknown'}**: ${bp.pages?.length || 0} pages, ${bp.components?.length || 0} components (match: ${(score * 100).toFixed(0)}%)`);
        }
      }
    }

    if (context.topPatterns.length > 0) {
      sections.push('\n## Top Patterns (by success rate)');
      for (const pattern of context.topPatterns.slice(0, 5)) {
        sections.push(`- **${pattern.category}**: ${pattern.description.substring(0, 100)} (success: ${(pattern.success_rate * 100).toFixed(0)}%, used: ${pattern.usage_count}x)`);
      }
    }

    if (context.successfulGenerations.length > 0) {
      sections.push('\n## Successful Generation Examples');
      for (const gen of context.successfulGenerations.slice(0, 3)) {
        sections.push(`- **${gen.factory}**: "${gen.prompt.substring(0, 60)}..." (${gen.file_count} files, ${gen.build_time_ms}ms)`);
      }
    }

    return sections.join('\n');
  }
}

export function createRetrievalSystem(store: MemoryStore, config?: RetrievalConfig): RetrievalSystem {
  return new RetrievalSystem(store, config);
}
