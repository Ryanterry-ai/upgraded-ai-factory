// Phase 8: Component Ranking System

import {
  Pattern,
  GeneratedArtifact,
  QualityMetrics,
  calculateRankingScore,
  calculateTier
} from '../models.js';

export interface ComponentRankingConfig {
  updateInterval: number;
  minUsagesForRanking: number;
  decayFactor: number;
}

const DEFAULT_COMPONENT_RANKING_CONFIG: ComponentRankingConfig = {
  updateInterval: 60000,
  minUsagesForRanking: 3,
  decayFactor: 0.95
};

export interface ComponentScore {
  componentId: string;
  name: string;
  type: string;
  factory: string;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  metrics: ComponentMetrics;
}

export interface ComponentMetrics {
  usageCount: number;
  successRate: number;
  averageQuality: number;
  reusability: number;
  maintainability: number;
  lastUsed: string;
}

export interface ComponentRecommendation {
  componentId: string;
  name: string;
  score: number;
  reason: string;
  confidence: number;
}

export class ComponentRankingSystem {
  private components: Map<string, ComponentScore> = new Map();
  private artifacts: Map<string, GeneratedArtifact> = new Map();
  private config: ComponentRankingConfig;

  constructor(config: Partial<ComponentRankingConfig> = {}) {
    this.config = { ...DEFAULT_COMPONENT_RANKING_CONFIG, ...config };
  }

  async recordComponentUsage(
    artifact: GeneratedArtifact,
    success: boolean,
    qualityMetrics: QualityMetrics
  ): Promise<void> {
    const componentId = artifact.id;
    const existing = this.components.get(componentId);

    if (existing) {
      this.updateComponentScore(existing, success, qualityMetrics);
    } else {
      const newComponent = this.createComponentScore(artifact, success, qualityMetrics);
      this.components.set(componentId, newComponent);
    }

    this.artifacts.set(componentId, artifact);
  }

  private createComponentScore(
    artifact: GeneratedArtifact,
    success: boolean,
    qualityMetrics: QualityMetrics
  ): ComponentScore {
    const metrics: ComponentMetrics = {
      usageCount: 1,
      successRate: success ? 1 : 0,
      averageQuality: qualityMetrics.overallScore,
      reusability: this.estimateReusability(artifact),
      maintainability: this.estimateMaintainability(artifact),
      lastUsed: new Date().toISOString()
    };

    const score = calculateRankingScore(
      metrics.successRate,
      metrics.averageQuality,
      0,
      Math.min(1, metrics.usageCount / 10)
    );

    return {
      componentId: artifact.id,
      name: artifact.name,
      type: artifact.type,
      factory: '',
      score,
      tier: calculateTier(score),
      metrics
    };
  }

  private updateComponentScore(
    component: ComponentScore,
    success: boolean,
    qualityMetrics: QualityMetrics
  ): void {
    component.metrics.usageCount++;

    component.metrics.successRate = (
      component.metrics.successRate * (component.metrics.usageCount - 1) + (success ? 1 : 0)
    ) / component.metrics.usageCount;

    component.metrics.averageQuality = (
      component.metrics.averageQuality + qualityMetrics.overallScore
    ) / 2;

    component.metrics.lastUsed = new Date().toISOString();

    component.score = calculateRankingScore(
      component.metrics.successRate,
      component.metrics.averageQuality,
      0,
      Math.min(1, component.metrics.usageCount / 10)
    );
    component.tier = calculateTier(component.score);
  }

  private estimateReusability(artifact: GeneratedArtifact): number {
    const name = artifact.name.toLowerCase();
    if (/button|input|card|list|table|modal|header|footer/i.test(name)) return 0.9;
    if (/page|view|screen/i.test(name)) return 0.5;
    return 0.7;
  }

  private estimateMaintainability(artifact: GeneratedArtifact): number {
    const content = artifact.content as string;
    if (!content) return 0.5;

    const lines = content.split('\n').length;
    if (lines < 50) return 0.9;
    if (lines < 100) return 0.7;
    if (lines < 200) return 0.5;
    return 0.3;
  }

  getComponent(componentId: string): ComponentScore | undefined {
    return this.components.get(componentId);
  }

  getComponentsByType(type: string): ComponentScore[] {
    return Array.from(this.components.values()).filter(c => c.type === type);
  }

  getComponentsByFactory(factory: string): ComponentScore[] {
    return Array.from(this.components.values()).filter(c => c.factory === factory);
  }

  getTopComponents(limit: number = 10): ComponentScore[] {
    return Array.from(this.components.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getComponentsByTier(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): ComponentScore[] {
    return Array.from(this.components.values()).filter(c => c.tier === tier);
  }

  async getRecommendations(
    factoryType: string,
    componentType: string,
    limit: number = 5
  ): Promise<ComponentRecommendation[]> {
    const candidates = Array.from(this.components.values())
      .filter(c => c.type === componentType || c.factory === factoryType)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2);

    const recommendations: ComponentRecommendation[] = [];

    for (const candidate of candidates) {
      if (recommendations.length >= limit) break;

      const reason = this.generateRecommendationReason(candidate);
      const confidence = this.calculateRecommendationConfidence(candidate);

      if (confidence > 0.5) {
        recommendations.push({
          componentId: candidate.componentId,
          name: candidate.name,
          score: candidate.score,
          reason,
          confidence
        });
      }
    }

    return recommendations;
  }

  private generateRecommendationReason(component: ComponentScore): string {
    if (component.metrics.successRate > 0.9) {
      return 'High success rate';
    }
    if (component.metrics.averageQuality > 0.8) {
      return 'High quality score';
    }
    if (component.metrics.reusability > 0.8) {
      return 'Highly reusable';
    }
    if (component.metrics.usageCount > 10) {
      return 'Frequently used';
    }
    return 'Good overall score';
  }

  private calculateRecommendationConfidence(component: ComponentScore): number {
    let confidence = 0;

    if (component.metrics.usageCount >= this.config.minUsagesForRanking) {
      confidence += 0.3;
    }

    confidence += component.metrics.successRate * 0.3;
    confidence += component.metrics.averageQuality * 0.2;
    confidence += component.metrics.reusability * 0.2;

    return Math.min(1, confidence);
  }

  getLeaderboard(limit: number = 20): Array<{
    rank: number;
    component: ComponentScore;
  }> {
    const sorted = Array.from(this.components.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sorted.map((component, index) => ({
      rank: index + 1,
      component
    }));
  }

  getStats(): {
    totalComponents: number;
    byType: Record<string, number>;
    byTier: Record<string, number>;
    averageScore: number;
    averageSuccessRate: number;
    averageQuality: number;
  } {
    const components = Array.from(this.components.values());
    const byType: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    let totalScore = 0;
    let totalSuccessRate = 0;
    let totalQuality = 0;

    for (const component of components) {
      byType[component.type] = (byType[component.type] || 0) + 1;
      byTier[component.tier] = (byTier[component.tier] || 0) + 1;
      totalScore += component.score;
      totalSuccessRate += component.metrics.successRate;
      totalQuality += component.metrics.averageQuality;
    }

    return {
      totalComponents: components.length,
      byType,
      byTier,
      averageScore: components.length > 0 ? totalScore / components.length : 0,
      averageSuccessRate: components.length > 0 ? totalSuccessRate / components.length : 0,
      averageQuality: components.length > 0 ? totalQuality / components.length : 0
    };
  }

  exportRankings(): ComponentScore[] {
    return Array.from(this.components.values());
  }

  importRankings(components: ComponentScore[]): void {
    for (const component of components) {
      this.components.set(component.componentId, component);
    }
  }
}

export function createComponentRankingSystem(config?: Partial<ComponentRankingConfig>): ComponentRankingSystem {
  return new ComponentRankingSystem(config);
}
