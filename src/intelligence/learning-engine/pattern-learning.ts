// Phase 8: Pattern Learning Engine

import {
  Pattern,
  PatternType,
  PatternSource,
  Generation,
  GeneratedArtifact,
  QualityMetrics,
  UserEdit,
  createPattern,
  calculateRankingScore,
  calculateTier
} from '../models.js';

export interface PatternExtractionConfig {
  minQualityScore: number;
  minSuccessRate: number;
  maxPatternsPerGeneration: number;
  enableAutoExtraction: boolean;
  enableUserEditLearning: boolean;
}

const DEFAULT_EXTRACTION_CONFIG: PatternExtractionConfig = {
  minQualityScore: 0.7,
  minSuccessRate: 0.8,
  maxPatternsPerGeneration: 5,
  enableAutoExtraction: true,
  enableUserEditLearning: true
};

export interface ExtractedPattern {
  pattern: Pattern;
  confidence: number;
  reason: string;
}

export class PatternLearningEngine {
  private patterns: Map<string, Pattern> = new Map();
  private config: PatternExtractionConfig;

  constructor(config: Partial<PatternExtractionConfig> = {}) {
    this.config = { ...DEFAULT_EXTRACTION_CONFIG, ...config };
  }

  async learnFromGeneration(generation: Generation): Promise<ExtractedPattern[]> {
    if (!this.config.enableAutoExtraction) {
      return [];
    }

    const extractedPatterns: ExtractedPattern[] = [];

    for (const artifact of generation.output.artifacts) {
      if (this.shouldExtractPattern(artifact, generation)) {
        const pattern = this.extractPattern(artifact, generation);
        if (pattern) {
          extractedPatterns.push(pattern);
          this.patterns.set(pattern.pattern.id, pattern.pattern);
        }
      }
    }

    return extractedPatterns;
  }

  private shouldExtractPattern(artifact: GeneratedArtifact, generation: Generation): boolean {
    if (!artifact.quality) return false;

    if (artifact.quality.overallScore < this.config.minQualityScore) {
      return false;
    }

    if (artifact.approved || artifact.quality.buildSuccess) {
      return true;
    }

    return false;
  }

  private extractPattern(artifact: GeneratedArtifact, generation: Generation): ExtractedPattern | null {
    const existingPattern = this.findSimilarPattern(artifact, generation.factoryType);

    if (existingPattern) {
      this.updatePattern(existingPattern, artifact, generation);
      return {
        pattern: existingPattern,
        confidence: 0.8,
        reason: 'Updated existing pattern'
      };
    }

    const pattern = createPattern(
      artifact.type as PatternType,
      artifact.name,
      artifact.content,
      generation.factoryType,
      'system',
      'generated'
    );

    pattern.ranking.qualityScore = artifact.quality.overallScore;
    pattern.ranking.successRate = artifact.quality.buildSuccess ? 1 : 0;
    pattern.ranking.score = calculateRankingScore(
      pattern.ranking.successRate,
      pattern.ranking.qualityScore,
      0,
      0
    );
    pattern.ranking.tier = calculateTier(pattern.ranking.score);

    return {
      pattern,
      confidence: 0.9,
      reason: 'New pattern discovered'
    };
  }

  private findSimilarPattern(artifact: GeneratedArtifact, factoryType: string): Pattern | null {
    for (const pattern of this.patterns.values()) {
      if (pattern.type === artifact.type && pattern.metadata.factory === factoryType) {
        const similarity = this.calculateSimilarity(pattern.content, artifact.content);
        if (similarity > 0.8) {
          return pattern;
        }
      }
    }
    return null;
  }

  private calculateSimilarity(content1: unknown, content2: unknown): number {
    const str1 = JSON.stringify(content1);
    const str2 = JSON.stringify(content2);

    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    let matches = 0;
    const minLen = Math.min(len1, len2);
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  private updatePattern(pattern: Pattern, artifact: GeneratedArtifact, generation: Generation): void {
    pattern.usage.totalUses++;
    if (artifact.quality.buildSuccess) {
      pattern.usage.successfulUses++;
    } else {
      pattern.usage.failedUses++;
    }

    pattern.ranking.successRate = pattern.usage.totalUses > 0
      ? pattern.usage.successfulUses / pattern.usage.totalUses
      : 0;

    pattern.ranking.qualityScore = (
      pattern.ranking.qualityScore + artifact.quality.overallScore
    ) / 2;

    pattern.ranking.usageFrequency = pattern.usage.totalUses;
    pattern.ranking.lastUsed = new Date().toISOString();

    pattern.ranking.score = calculateRankingScore(
      pattern.ranking.successRate,
      pattern.ranking.qualityScore,
      pattern.ranking.userApproval,
      pattern.ranking.usageFrequency
    );
    pattern.ranking.tier = calculateTier(pattern.ranking.score);

    pattern.updatedAt = new Date().toISOString();
  }

  async learnFromUserEdit(edit: UserEdit, patternId: string): Promise<Pattern | null> {
    if (!this.config.enableUserEditLearning) {
      return null;
    }

    const pattern = this.patterns.get(patternId);
    if (!pattern) return null;

    const editedPattern = createPattern(
      pattern.type,
      `${pattern.name}_edited`,
      edit.after,
      pattern.metadata.factory,
      pattern.metadata.agent,
      'user_edited'
    );

    editedPattern.metadata.parentPatternId = pattern.id;
    pattern.metadata.childPatternIds.push(editedPattern.id);

    editedPattern.ranking.qualityScore = pattern.ranking.qualityScore * 1.1;
    editedPattern.ranking.userApproval = 1;
    editedPattern.ranking.score = calculateRankingScore(
      editedPattern.ranking.successRate,
      editedPattern.ranking.qualityScore,
      editedPattern.ranking.userApproval,
      0
    );
    editedPattern.ranking.tier = calculateTier(editedPattern.ranking.score);

    this.patterns.set(editedPattern.id, editedPattern);

    return editedPattern;
  }

  getPattern(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }

  getPatternsByType(type: PatternType): Pattern[] {
    return Array.from(this.patterns.values()).filter(p => p.type === type);
  }

  getPatternsByFactory(factory: string): Pattern[] {
    return Array.from(this.patterns.values()).filter(p => p.metadata.factory === factory);
  }

  getTopPatterns(limit: number = 10): Pattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.ranking.score - a.ranking.score)
      .slice(0, limit);
  }

  getPatternsByTier(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): Pattern[] {
    return Array.from(this.patterns.values()).filter(p => p.ranking.tier === tier);
  }

  searchPatterns(query: string): Pattern[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.patterns.values()).filter(p => {
      const nameMatch = p.name.toLowerCase().includes(queryLower);
      const tagMatch = p.metadata.tags.some(t => t.toLowerCase().includes(queryLower));
      const descMatch = p.metadata.description.toLowerCase().includes(queryLower);
      return nameMatch || tagMatch || descMatch;
    });
  }

  getStats(): {
    totalPatterns: number;
    byType: Record<PatternType, number>;
    byFactory: Record<string, number>;
    byTier: Record<string, number>;
    averageScore: number;
    averageSuccessRate: number;
  } {
    const patterns = Array.from(this.patterns.values());
    const byType: Record<string, number> = {};
    const byFactory: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    let totalScore = 0;
    let totalSuccessRate = 0;

    for (const pattern of patterns) {
      byType[pattern.type] = (byType[pattern.type] || 0) + 1;
      byFactory[pattern.metadata.factory] = (byFactory[pattern.metadata.factory] || 0) + 1;
      byTier[pattern.ranking.tier] = (byTier[pattern.ranking.tier] || 0) + 1;
      totalScore += pattern.ranking.score;
      totalSuccessRate += pattern.ranking.successRate;
    }

    return {
      totalPatterns: patterns.length,
      byType: byType as Record<PatternType, number>,
      byFactory,
      byTier,
      averageScore: patterns.length > 0 ? totalScore / patterns.length : 0,
      averageSuccessRate: patterns.length > 0 ? totalSuccessRate / patterns.length : 0
    };
  }

  exportPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  importPatterns(patterns: Pattern[]): void {
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);
    }
  }
}

export function createPatternLearningEngine(config?: Partial<PatternExtractionConfig>): PatternLearningEngine {
  return new PatternLearningEngine(config);
}
