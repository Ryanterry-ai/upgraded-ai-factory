// Phase 8: Factory Performance Analytics

import {
  FactoryPerformance,
  ImprovementTrend,
  Generation,
  Pattern,
  Template,
  LeaderboardEntry,
  LeaderboardMetrics
} from '../models.js';

export interface AnalyticsConfig {
  trackingPeriod: number;
  trendWindowSize: number;
  minGenerationsForTrend: number;
}

const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  trackingPeriod: 7 * 24 * 60 * 60 * 1000,
  trendWindowSize: 10,
  minGenerationsForTrend: 5
};

export interface FactoryMetrics {
  factoryType: string;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageQuality: number;
  averageDuration: number;
  averageTokenUsage: number;
  averageCost: number;
  qualityTrend: number[];
  durationTrend: number[];
  tokenTrend: number[];
}

export interface FactoryInsight {
  factoryType: string;
  insight: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
  confidence: number;
}

export class FactoryAnalytics {
  private generations: Map<string, Generation[]> = new Map();
  private metrics: Map<string, FactoryMetrics> = new Map();
  private config: AnalyticsConfig;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
  }

  async recordGeneration(generation: Generation): Promise<void> {
    const factoryType = generation.factoryType;
    const factoryGenerations = this.generations.get(factoryType) || [];
    factoryGenerations.push(generation);
    this.generations.set(factoryType, factoryGenerations);

    this.updateMetrics(factoryType);
  }

  private updateMetrics(factoryType: string): void {
    const generations = this.generations.get(factoryType) || [];
    if (generations.length === 0) return;

    const successful = generations.filter(g => g.output.success);
    const failed = generations.filter(g => !g.output.success);

    const avgQuality = successful.length > 0
      ? successful.reduce((sum, g) => {
          const avgArtifactQuality = g.output.artifacts.length > 0
            ? g.output.artifacts.reduce((sum, a) => sum + (a.quality?.overallScore || 0), 0) / g.output.artifacts.length
            : 0;
          return sum + avgArtifactQuality;
        }, 0) / successful.length
      : 0;

    const avgDuration = generations.reduce((sum, g) => sum + g.metrics.duration, 0) / generations.length;
    const avgTokens = generations.reduce((sum, g) => sum + g.metrics.tokenUsage, 0) / generations.length;
    const avgCost = generations.reduce((sum, g) => sum + g.metrics.cost, 0) / generations.length;

    const qualityTrend = this.calculateTrend(
      generations.map(g => {
        const avgArtifactQuality = g.output.artifacts.length > 0
          ? g.output.artifacts.reduce((sum, a) => sum + (a.quality?.overallScore || 0), 0) / g.output.artifacts.length
          : 0;
        return avgArtifactQuality;
      })
    );

    const durationTrend = this.calculateTrend(
      generations.map(g => g.metrics.duration)
    );

    const tokenTrend = this.calculateTrend(
      generations.map(g => g.metrics.tokenUsage)
    );

    const metrics: FactoryMetrics = {
      factoryType,
      totalGenerations: generations.length,
      successfulGenerations: successful.length,
      failedGenerations: failed.length,
      averageQuality: avgQuality,
      averageDuration: avgDuration,
      averageTokenUsage: avgTokens,
      averageCost: avgCost,
      qualityTrend,
      durationTrend,
      tokenTrend
    };

    this.metrics.set(factoryType, metrics);
  }

  private calculateTrend(values: number[]): number[] {
    if (values.length < 2) return [0];

    const trend: number[] = [];
    const windowSize = Math.min(this.config.trendWindowSize, values.length);

    for (let i = windowSize; i < values.length; i++) {
      const window = values.slice(i - windowSize, i);
      const prevWindow = values.slice(i - windowSize - 1, i - 1);

      if (prevWindow.length > 0) {
        const currentAvg = window.reduce((a, b) => a + b, 0) / window.length;
        const prevAvg = prevWindow.reduce((a, b) => a + b, 0) / prevWindow.length;
        const change = prevAvg > 0 ? (currentAvg - prevAvg) / prevAvg : 0;
        trend.push(change);
      }
    }

    return trend;
  }

  getMetrics(factoryType: string): FactoryMetrics | undefined {
    return this.metrics.get(factoryType);
  }

  getAllMetrics(): FactoryMetrics[] {
    return Array.from(this.metrics.values());
  }

  getFactoryPerformance(factoryType: string): FactoryPerformance | null {
    const metrics = this.metrics.get(factoryType);
    if (!metrics) return null;

    const successRate = metrics.totalGenerations > 0
      ? metrics.successfulGenerations / metrics.totalGenerations
      : 0;

    const improvementTrend: ImprovementTrend = {
      successRateChange: metrics.qualityTrend.length > 0 ? metrics.qualityTrend[metrics.qualityTrend.length - 1] : 0,
      qualityChange: metrics.qualityTrend.length > 0 ? metrics.qualityTrend[metrics.qualityTrend.length - 1] : 0,
      durationChange: metrics.durationTrend.length > 0 ? metrics.durationTrend[metrics.durationTrend.length - 1] : 0,
      tokenUsageChange: metrics.tokenTrend.length > 0 ? metrics.tokenTrend[metrics.tokenTrend.length - 1] : 0,
      period: '7d'
    };

    return {
      factoryType,
      totalGenerations: metrics.totalGenerations,
      successfulGenerations: metrics.successfulGenerations,
      failedGenerations: metrics.failedGenerations,
      successRate,
      averageQuality: metrics.averageQuality,
      averageDuration: metrics.averageDuration,
      averageTokenUsage: metrics.averageTokenUsage,
      averageCost: metrics.averageCost,
      topPatterns: [],
      topTemplates: [],
      improvementTrend
    };
  }

  async generateInsights(factoryType: string): Promise<FactoryInsight[]> {
    const metrics = this.metrics.get(factoryType);
    if (!metrics) return [];

    const insights: FactoryInsight[] = [];

    const successRate = metrics.totalGenerations > 0
      ? metrics.successfulGenerations / metrics.totalGenerations
      : 0;

    if (successRate < 0.8) {
      insights.push({
        factoryType,
        insight: `Success rate is ${(successRate * 100).toFixed(1)}%, below 80% threshold`,
        impact: 'negative',
        recommendation: 'Review failed generations and update patterns to improve reliability',
        confidence: 0.9
      });
    }

    if (metrics.averageQuality > 0.8) {
      insights.push({
        factoryType,
        insight: `Average quality score is ${(metrics.averageQuality * 100).toFixed(1)}%, above 80% threshold`,
        impact: 'positive',
        recommendation: 'Continue current approach, patterns are performing well',
        confidence: 0.85
      });
    }

    if (metrics.qualityTrend.length > 0) {
      const recentTrend = metrics.qualityTrend[metrics.qualityTrend.length - 1];
      if (recentTrend > 0.1) {
        insights.push({
          factoryType,
          insight: `Quality improving at ${(recentTrend * 100).toFixed(1)}% rate`,
          impact: 'positive',
          recommendation: 'Quality is improving, maintain current learning approach',
          confidence: 0.8
        });
      } else if (recentTrend < -0.1) {
        insights.push({
          factoryType,
          insight: `Quality declining at ${(Math.abs(recentTrend) * 100).toFixed(1)}% rate`,
          impact: 'negative',
          recommendation: 'Investigate recent changes and adjust patterns',
          confidence: 0.8
        });
      }
    }

    if (metrics.averageDuration > 60000) {
      insights.push({
        factoryType,
        insight: `Average generation time is ${(metrics.averageDuration / 1000).toFixed(1)}s, above 60s threshold`,
        impact: 'negative',
        recommendation: 'Consider optimizing agent execution or reducing complexity',
        confidence: 0.7
      });
    }

    return insights;
  }

  getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.metrics.entries())
      .map(([factoryType, metrics]) => {
        const successRate = metrics.totalGenerations > 0
          ? metrics.successfulGenerations / metrics.totalGenerations
          : 0;

        const score = (
          successRate * 0.3 +
          metrics.averageQuality * 0.3 +
          Math.min(1, metrics.totalGenerations / 100) * 0.2 +
          (1 - Math.min(1, metrics.averageDuration / 120000)) * 0.2
        );

        return {
          id: factoryType,
          name: factoryType.charAt(0).toUpperCase() + factoryType.slice(1),
          type: 'factory' as const,
          score,
          rank: 0,
          tier: 'bronze' as const,
          metrics: {
            successRate,
            qualityScore: metrics.averageQuality,
            userApproval: 0.8,
            usageFrequency: metrics.totalGenerations,
            improvementRate: metrics.qualityTrend.length > 0 ? metrics.qualityTrend[metrics.qualityTrend.length - 1] : 0
          }
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        tier: entry.score >= 0.9 ? 'platinum' as const :
              entry.score >= 0.75 ? 'gold' as const :
              entry.score >= 0.5 ? 'silver' as const :
              'bronze' as const
      }));
  }

  getStats(): {
    totalFactories: number;
    totalGenerations: number;
    overallSuccessRate: number;
    overallQuality: number;
    topFactory: string;
    bottomFactory: string;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const totalGenerations = allMetrics.reduce((sum, m) => sum + m.totalGenerations, 0);
    const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successfulGenerations, 0);

    const sortedByQuality = [...allMetrics].sort((a, b) => b.averageQuality - a.averageQuality);

    return {
      totalFactories: allMetrics.length,
      totalGenerations,
      overallSuccessRate: totalGenerations > 0 ? totalSuccessful / totalGenerations : 0,
      overallQuality: allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.averageQuality, 0) / allMetrics.length
        : 0,
      topFactory: sortedByQuality[0]?.factoryType || 'none',
      bottomFactory: sortedByQuality[sortedByQuality.length - 1]?.factoryType || 'none'
    };
  }

  exportAnalytics(): {
    metrics: FactoryMetrics[];
    generations: Record<string, Generation[]>;
  } {
    return {
      metrics: Array.from(this.metrics.values()),
      generations: Object.fromEntries(this.generations)
    };
  }

  importAnalytics(data: {
    metrics?: FactoryMetrics[];
    generations?: Record<string, Generation[]>;
  }): void {
    if (data.metrics) {
      for (const metric of data.metrics) {
        this.metrics.set(metric.factoryType, metric);
      }
    }

    if (data.generations) {
      for (const [factoryType, generations] of Object.entries(data.generations)) {
        this.generations.set(factoryType, generations);
      }
    }
  }
}

export function createFactoryAnalytics(config?: Partial<AnalyticsConfig>): FactoryAnalytics {
  return new FactoryAnalytics(config);
}
