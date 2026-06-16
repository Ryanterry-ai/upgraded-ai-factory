// Phase 8: Blueprint Optimization Engine

import {
  Pattern,
  Template,
  Generation,
  QualityMetrics
} from '../models.js';

export interface OptimizationConfig {
  enableAutoOptimization: boolean;
  optimizationThreshold: number;
  maxOptimizationIterations: number;
}

const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableAutoOptimization: true,
  optimizationThreshold: 0.8,
  maxOptimizationIterations: 3
};

export interface OptimizationResult {
  originalBlueprint: unknown;
  optimizedBlueprint: unknown;
  improvements: OptimizationImprovement[];
  estimatedQualityImprovement: number;
  iterations: number;
}

export interface OptimizationImprovement {
  type: 'component' | 'structure' | 'pattern' | 'performance' | 'accessibility';
  description: string;
  impact: number;
  applied: boolean;
}

export interface BlueprintAnalysis {
  components: ComponentAnalysis[];
  structure: StructureAnalysis;
  patterns: PatternAnalysis[];
  issues: BlueprintIssue[];
  score: number;
}

export interface ComponentAnalysis {
  name: string;
  type: string;
  complexity: number;
  reusability: number;
  quality: number;
}

export interface StructureAnalysis {
  depth: number;
  breadth: number;
  modularity: number;
  coupling: number;
}

export interface PatternAnalysis {
  patternId: string;
  usageCount: number;
  successRate: number;
  qualityScore: number;
}

export interface BlueprintIssue {
  type: 'missing' | 'redundant' | 'suboptimal' | 'incompatible';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export class BlueprintOptimizer {
  private patterns: Map<string, Pattern> = new Map();
  private templates: Map<string, Template> = new Map();
  private config: OptimizationConfig;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
  }

  async optimizeBlueprint(
    blueprint: unknown,
    factoryType: string,
    qualityMetrics?: QualityMetrics
  ): Promise<OptimizationResult> {
    const analysis = this.analyzeBlueprint(blueprint, factoryType);
    const improvements = this.generateImprovements(analysis, qualityMetrics);

    let optimizedBlueprint = { ...(blueprint as Record<string, unknown>) };
    let totalImprovement = 0;
    let iterations = 0;

    for (const improvement of improvements) {
      if (iterations >= this.config.maxOptimizationIterations) break;

      if (improvement.impact > 0.1) {
        optimizedBlueprint = this.applyImprovement(optimizedBlueprint, improvement);
        improvement.applied = true;
        totalImprovement += improvement.impact;
        iterations++;
      }
    }

    return {
      originalBlueprint: blueprint,
      optimizedBlueprint,
      improvements,
      estimatedQualityImprovement: totalImprovement,
      iterations
    };
  }

  private analyzeBlueprint(blueprint: unknown, factoryType: string): BlueprintAnalysis {
    const bp = blueprint as Record<string, unknown>;
    const components = this.analyzeComponents(bp);
    const structure = this.analyzeStructure(bp);
    const patterns = this.analyzePatterns(bp, factoryType);
    const issues = this.findIssues(bp, components, structure);

    const score = this.calculateAnalysisScore(components, structure, patterns, issues);

    return {
      components,
      structure,
      patterns,
      issues,
      score
    };
  }

  private analyzeComponents(bp: Record<string, unknown>): ComponentAnalysis[] {
    const components = (bp.components as string[]) || [];
    return components.map(name => ({
      name,
      type: this.inferComponentType(name),
      complexity: this.estimateComplexity(name),
      reusability: this.estimateReusability(name),
      quality: 0.7 + Math.random() * 0.3
    }));
  }

  private inferComponentType(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('header') || lower.includes('footer') || lower.includes('nav')) return 'layout';
    if (lower.includes('button') || lower.includes('input') || lower.includes('form')) return 'form';
    if (lower.includes('card') || lower.includes('list') || lower.includes('table')) return 'display';
    if (lower.includes('modal') || lower.includes('dialog') || lower.includes('popup')) return 'overlay';
    return 'generic';
  }

  private estimateComplexity(name: string): number {
    const length = name.length;
    const hasMultipleWords = name.includes(' ');
    const hasAction = /create|update|delete|manage|handle/i.test(name);

    let complexity = 0.3;
    if (length > 10) complexity += 0.2;
    if (hasMultipleWords) complexity += 0.2;
    if (hasAction) complexity += 0.3;

    return Math.min(1, complexity);
  }

  private estimateReusability(name: string): number {
    const isGeneric = /button|input|card|list|table|modal/i.test(name);
    const isSpecific = /admin|dashboard|settings|profile/i.test(name);

    if (isGeneric) return 0.9;
    if (isSpecific) return 0.3;
    return 0.6;
  }

  private analyzeStructure(bp: Record<string, unknown>): StructureAnalysis {
    const components = (bp.components as string[]) || [];
    const pages = (bp.pages as string[]) || [];

    return {
      depth: Math.ceil(components.length / 5),
      breadth: pages.length,
      modularity: components.length > 0 ? 0.7 + Math.random() * 0.3 : 0.5,
      coupling: components.length > 10 ? 0.3 : 0.7
    };
  }

  private analyzePatterns(bp: Record<string, unknown>, factoryType: string): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];

    for (const [id, pattern] of this.patterns) {
      if (pattern.metadata.factory === factoryType) {
        patterns.push({
          patternId: id,
          usageCount: pattern.usage.totalUses,
          successRate: pattern.ranking.successRate,
          qualityScore: pattern.ranking.qualityScore
        });
      }
    }

    return patterns.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 5);
  }

  private findIssues(
    bp: Record<string, unknown>,
    components: ComponentAnalysis[],
    structure: StructureAnalysis
  ): BlueprintIssue[] {
    const issues: BlueprintIssue[] = [];

    const pages = (bp.pages as string[]) || [];
    if (pages.length === 0) {
      issues.push({
        type: 'missing',
        severity: 'high',
        description: 'No pages defined in blueprint',
        recommendation: 'Add at least one page to the blueprint'
      });
    }

    if (components.length === 0) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        description: 'No components defined in blueprint',
        recommendation: 'Add components to improve reusability'
      });
    }

    if (structure.coupling < 0.5) {
      issues.push({
        type: 'suboptimal',
        severity: 'medium',
        description: 'High coupling detected between components',
        recommendation: 'Consider extracting shared logic into separate utilities'
      });
    }

    const lowQualityComponents = components.filter(c => c.quality < 0.6);
    if (lowQualityComponents.length > 0) {
      issues.push({
        type: 'suboptimal',
        severity: 'low',
        description: `${lowQualityComponents.length} components have low quality scores`,
        recommendation: 'Review and optimize low-quality components'
      });
    }

    return issues;
  }

  private calculateAnalysisScore(
    components: ComponentAnalysis[],
    structure: StructureAnalysis,
    patterns: PatternAnalysis[],
    issues: BlueprintIssue[]
  ): number {
    const componentScore = components.length > 0
      ? components.reduce((sum, c) => sum + c.quality, 0) / components.length
      : 0.5;

    const structureScore = (structure.modularity + structure.coupling) / 2;

    const patternScore = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.qualityScore, 0) / patterns.length
      : 0.5;

    const issuePenalty = issues.length * 0.05;

    return Math.max(0, Math.min(1, (componentScore * 0.3 + structureScore * 0.3 + patternScore * 0.4) - issuePenalty));
  }

  private generateImprovements(
    analysis: BlueprintAnalysis,
    qualityMetrics?: QualityMetrics
  ): OptimizationImprovement[] {
    const improvements: OptimizationImprovement[] = [];

    for (const issue of analysis.issues) {
      improvements.push({
        type: issue.type === 'missing' ? 'component' : 'structure',
        description: issue.recommendation,
        impact: issue.severity === 'high' ? 0.3 : issue.severity === 'medium' ? 0.2 : 0.1,
        applied: false
      });
    }

    if (analysis.structure.coupling < 0.6) {
      improvements.push({
        type: 'structure',
        description: 'Reduce component coupling by extracting shared logic',
        impact: 0.15,
        applied: false
      });
    }

    if (qualityMetrics) {
      if (qualityMetrics.accessibilityScore < 0.8) {
        improvements.push({
          type: 'accessibility',
          description: 'Add ARIA labels and keyboard navigation',
          impact: 0.1,
          applied: false
        });
      }

      if (qualityMetrics.performanceScore < 0.8) {
        improvements.push({
          type: 'performance',
          description: 'Add memoization and lazy loading',
          impact: 0.1,
          applied: false
        });
      }
    }

    return improvements.sort((a, b) => b.impact - a.impact);
  }

  private applyImprovement(blueprint: Record<string, unknown>, improvement: OptimizationImprovement): Record<string, unknown> {
    const optimized = { ...blueprint };

    switch (improvement.type) {
      case 'component':
        const components = (optimized.components as string[]) || [];
        if (!components.includes('OptimizedComponent')) {
          components.push('OptimizedComponent');
          optimized.components = components;
        }
        break;

      case 'structure':
        optimized.structure = {
          ...(optimized.structure as Record<string, unknown>),
          modular: true,
          coupled: false
        };
        break;

      case 'performance':
        optimized.performance = {
          ...(optimized.performance as Record<string, unknown>),
          memoization: true,
          lazyLoading: true
        };
        break;

      case 'accessibility':
        optimized.accessibility = {
          ...(optimized.accessibility as Record<string, unknown>),
          ariaLabels: true,
          keyboardNavigation: true
        };
        break;
    }

    return optimized;
  }

  addPattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  addTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  getStats(): {
    totalPatterns: number;
    totalTemplates: number;
    averagePatternQuality: number;
  } {
    const patterns = Array.from(this.patterns.values());
    return {
      totalPatterns: patterns.length,
      totalTemplates: this.templates.size,
      averagePatternQuality: patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.ranking.qualityScore, 0) / patterns.length
        : 0
    };
  }
}

export function createBlueprintOptimizer(config?: Partial<OptimizationConfig>): BlueprintOptimizer {
  return new BlueprintOptimizer(config);
}
