// Phase 8: Template Ranking System

import {
  Template,
  TemplateRanking,
  Pattern,
  Generation,
  calculateRankingScore,
  calculateTier,
  createTemplate
} from '../models.js';

export interface TemplateRankingConfig {
  updateInterval: number;
  minGenerationsForRanking: number;
  decayFactor: number;
  boostFactor: number;
}

const DEFAULT_RANKING_CONFIG: TemplateRankingConfig = {
  updateInterval: 60000,
  minGenerationsForRanking: 5,
  decayFactor: 0.95,
  boostFactor: 1.1
};

export interface TemplateScore {
  templateId: string;
  score: number;
  components: {
    successRate: number;
    qualityScore: number;
    userApproval: number;
    usageFrequency: number;
    recencyScore: number;
  };
}

export class TemplateRankingSystem {
  private templates: Map<string, Template> = new Map();
  private scores: Map<string, TemplateScore> = new Map();
  private config: TemplateRankingConfig;

  constructor(config: Partial<TemplateRankingConfig> = {}) {
    this.config = { ...DEFAULT_RANKING_CONFIG, ...config };
  }

  async createTemplateFromPatterns(
    name: string,
    factory: string,
    patterns: Pattern[]
  ): Promise<Template> {
    const template = createTemplate(
      name,
      patterns[0]?.type || 'component',
      factory,
      patterns.map(p => p.id)
    );

    template.metadata.description = `Template created from ${patterns.length} patterns`;
    template.metadata.tags = this.extractTags(patterns);

    this.templates.set(template.id, template);
    this.calculateTemplateScore(template);

    return template;
  }

  private extractTags(patterns: Pattern[]): string[] {
    const tags = new Set<string>();
    for (const pattern of patterns) {
      for (const tag of pattern.metadata.tags) {
        tags.add(tag);
      }
      tags.add(pattern.type);
      tags.add(pattern.metadata.factory);
    }
    return Array.from(tags);
  }

  async recordTemplateUsage(
    templateId: string,
    generation: Generation,
    success: boolean,
    qualityScore: number
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) return;

    template.ranking.usageFrequency++;

    if (success) {
      template.ranking.successRate = (
        template.ranking.successRate * (template.ranking.usageFrequency - 1) + 1
      ) / template.ranking.usageFrequency;
    } else {
      template.ranking.successRate = (
        template.ranking.successRate * (template.ranking.usageFrequency - 1)
      ) / template.ranking.usageFrequency;
    }

    template.ranking.qualityScore = (
      template.ranking.qualityScore + qualityScore
    ) / 2;

    template.ranking.score = calculateRankingScore(
      template.ranking.successRate,
      template.ranking.qualityScore,
      template.ranking.userApproval,
      template.ranking.usageFrequency
    );
    template.ranking.tier = calculateTier(template.ranking.score);

    template.updatedAt = new Date().toISOString();
    this.calculateTemplateScore(template);
  }

  async recordUserApproval(templateId: string, approved: boolean): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) return;

    if (approved) {
      template.ranking.userApproval = Math.min(1, template.ranking.userApproval + 0.1);
    } else {
      template.ranking.userApproval = Math.max(0, template.ranking.userApproval - 0.1);
    }

    template.ranking.score = calculateRankingScore(
      template.ranking.successRate,
      template.ranking.qualityScore,
      template.ranking.userApproval,
      template.ranking.usageFrequency
    );
    template.ranking.tier = calculateTier(template.ranking.score);

    template.updatedAt = new Date().toISOString();
    this.calculateTemplateScore(template);
  }

  private calculateTemplateScore(template: Template): void {
    const recencyScore = this.calculateRecencyScore(template.updatedAt);

    const score: TemplateScore = {
      templateId: template.id,
      score: template.ranking.score,
      components: {
        successRate: template.ranking.successRate,
        qualityScore: template.ranking.qualityScore,
        userApproval: template.ranking.userApproval,
        usageFrequency: Math.min(1, template.ranking.usageFrequency / 100),
        recencyScore
      }
    };

    this.scores.set(template.id, score);
  }

  private calculateRecencyScore(lastUpdated: string): number {
    const now = Date.now();
    const lastUpdate = new Date(lastUpdated).getTime();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);

    return Math.pow(this.config.decayFactor, daysSinceUpdate);
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  getTemplatesByFactory(factory: string): Template[] {
    return Array.from(this.templates.values()).filter(t => t.factory === factory);
  }

  getTopTemplates(limit: number = 10): Template[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.ranking.score - a.ranking.score)
      .slice(0, limit);
  }

  getTemplatesByTier(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): Template[] {
    return Array.from(this.templates.values()).filter(t => t.ranking.tier === tier);
  }

  getTemplateScore(templateId: string): TemplateScore | undefined {
    return this.scores.get(templateId);
  }

  async promoteTemplate(templateId: string): Promise<Template | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    if (template.ranking.tier === 'platinum') {
      return template;
    }

    const promotedTemplate = { ...template };
    promotedTemplate.ranking.tier = calculateTier(template.ranking.score + 0.2);
    promotedTemplate.ranking.score = Math.min(1, template.ranking.score + 0.1);
    promotedTemplate.updatedAt = new Date().toISOString();

    this.templates.set(templateId, promotedTemplate);
    this.calculateTemplateScore(promotedTemplate);

    return promotedTemplate;
  }

  async demoteTemplate(templateId: string): Promise<Template | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    if (template.ranking.tier === 'bronze') {
      return template;
    }

    const demotedTemplate = { ...template };
    demotedTemplate.ranking.tier = calculateTier(template.ranking.score - 0.2);
    demotedTemplate.ranking.score = Math.max(0, template.ranking.score - 0.1);
    demotedTemplate.updatedAt = new Date().toISOString();

    this.templates.set(templateId, demotedTemplate);
    this.calculateTemplateScore(demotedTemplate);

    return demotedTemplate;
  }

  getLeaderboard(limit: number = 20): Array<{
    rank: number;
    template: Template;
    score: TemplateScore;
  }> {
    const sorted = Array.from(this.templates.values())
      .sort((a, b) => b.ranking.score - a.ranking.score)
      .slice(0, limit);

    return sorted.map((template, index) => ({
      rank: index + 1,
      template,
      score: this.scores.get(template.id) || {
        templateId: template.id,
        score: template.ranking.score,
        components: {
          successRate: template.ranking.successRate,
          qualityScore: template.ranking.qualityScore,
          userApproval: template.ranking.userApproval,
          usageFrequency: template.ranking.usageFrequency,
          recencyScore: 0
        }
      }
    }));
  }

  getStats(): {
    totalTemplates: number;
    byFactory: Record<string, number>;
    byTier: Record<string, number>;
    averageScore: number;
    averageSuccessRate: number;
    averageQuality: number;
  } {
    const templates = Array.from(this.templates.values());
    const byFactory: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    let totalScore = 0;
    let totalSuccessRate = 0;
    let totalQuality = 0;

    for (const template of templates) {
      byFactory[template.factory] = (byFactory[template.factory] || 0) + 1;
      byTier[template.ranking.tier] = (byTier[template.ranking.tier] || 0) + 1;
      totalScore += template.ranking.score;
      totalSuccessRate += template.ranking.successRate;
      totalQuality += template.ranking.qualityScore;
    }

    return {
      totalTemplates: templates.length,
      byFactory,
      byTier,
      averageScore: templates.length > 0 ? totalScore / templates.length : 0,
      averageSuccessRate: templates.length > 0 ? totalSuccessRate / templates.length : 0,
      averageQuality: templates.length > 0 ? totalQuality / templates.length : 0
    };
  }

  exportTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  importTemplates(templates: Template[]): void {
    for (const template of templates) {
      this.templates.set(template.id, template);
      this.calculateTemplateScore(template);
    }
  }
}

export function createTemplateRankingSystem(config?: Partial<TemplateRankingConfig>): TemplateRankingSystem {
  return new TemplateRankingSystem(config);
}
