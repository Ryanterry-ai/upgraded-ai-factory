// Phase 8: Automatic Pattern Promotion

import {
  Pattern,
  PatternRanking,
  calculateRankingScore,
  calculateTier
} from '../models.js';

export interface PromotionConfig {
  promotionThreshold: number;
  demotionThreshold: number;
  minUsagesForPromotion: number;
  promotionCooldown: number;
}

const DEFAULT_PROMOTION_CONFIG: PromotionConfig = {
  promotionThreshold: 0.8,
  demotionThreshold: 0.3,
  minUsagesForPromotion: 5,
  promotionCooldown: 24 * 60 * 60 * 1000
};

export interface PromotionEvent {
  patternId: string;
  fromTier: string;
  toTier: string;
  reason: string;
  timestamp: string;
}

export interface PromotionStats {
  totalPromotions: number;
  totalDemotions: number;
  promotionsByTier: Record<string, number>;
  demotionsByTier: Record<string, number>;
}

export class PatternPromoter {
  private patterns: Map<string, Pattern> = new Map();
  private promotionHistory: PromotionEvent[] = [];
  private config: PromotionConfig;

  constructor(config: Partial<PromotionConfig> = {}) {
    this.config = { ...DEFAULT_PROMOTION_CONFIG, ...config };
  }

  async evaluatePattern(patternId: string): Promise<PromotionEvent | null> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return null;

    const shouldPromote = this.shouldPromote(pattern);
    const shouldDemote = this.shouldDemote(pattern);

    if (shouldPromote) {
      return this.promotePattern(pattern);
    }

    if (shouldDemote) {
      return this.demotePattern(pattern);
    }

    return null;
  }

  private shouldPromote(pattern: Pattern): boolean {
    if (pattern.ranking.tier === 'platinum') return false;

    if (pattern.usage.totalUses < this.config.minUsagesForPromotion) return false;

    const lastPromotion = this.getLastPromotionEvent(pattern.id);
    if (lastPromotion) {
      const timeSinceLastPromotion = Date.now() - new Date(lastPromotion.timestamp).getTime();
      if (timeSinceLastPromotion < this.config.promotionCooldown) return false;
    }

    return pattern.ranking.score >= this.config.promotionThreshold;
  }

  private shouldDemote(pattern: Pattern): boolean {
    if (pattern.ranking.tier === 'bronze') return false;

    return pattern.ranking.score <= this.config.demotionThreshold;
  }

  private promotePattern(pattern: Pattern): PromotionEvent {
    const fromTier = pattern.ranking.tier;
    const newScore = Math.min(1, pattern.ranking.score + 0.1);
    const newTier = calculateTier(newScore);

    pattern.ranking.score = newScore;
    pattern.ranking.tier = newTier;
    pattern.updatedAt = new Date().toISOString();

    const event: PromotionEvent = {
      patternId: pattern.id,
      fromTier,
      toTier: newTier,
      reason: `Score ${newScore.toFixed(2)} exceeded threshold ${this.config.promotionThreshold}`,
      timestamp: new Date().toISOString()
    };

    this.promotionHistory.push(event);
    return event;
  }

  private demotePattern(pattern: Pattern): PromotionEvent {
    const fromTier = pattern.ranking.tier;
    const newScore = Math.max(0, pattern.ranking.score - 0.1);
    const newTier = calculateTier(newScore);

    pattern.ranking.score = newScore;
    pattern.ranking.tier = newTier;
    pattern.updatedAt = new Date().toISOString();

    const event: PromotionEvent = {
      patternId: pattern.id,
      fromTier,
      toTier: newTier,
      reason: `Score ${newScore.toFixed(2)} below threshold ${this.config.demotionThreshold}`,
      timestamp: new Date().toISOString()
    };

    this.promotionHistory.push(event);
    return event;
  }

  private getLastPromotionEvent(patternId: string): PromotionEvent | undefined {
    return this.promotionHistory
      .filter(e => e.patternId === patternId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  async batchEvaluate(patternIds: string[]): Promise<PromotionEvent[]> {
    const events: PromotionEvent[] = [];

    for (const patternId of patternIds) {
      const event = await this.evaluatePattern(patternId);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  addPattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  removePattern(patternId: string): void {
    this.patterns.delete(patternId);
  }

  getPattern(patternId: string): Pattern | undefined {
    return this.patterns.get(patternId);
  }

  getPromotionHistory(limit: number = 50): PromotionEvent[] {
    return this.promotionHistory.slice(-limit);
  }

  getStats(): PromotionStats {
    const promotions = this.promotionHistory.filter(e => {
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
      return tierOrder.indexOf(e.toTier) > tierOrder.indexOf(e.fromTier);
    });

    const demotions = this.promotionHistory.filter(e => {
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
      return tierOrder.indexOf(e.toTier) < tierOrder.indexOf(e.fromTier);
    });

    const promotionsByTier: Record<string, number> = {};
    const demotionsByTier: Record<string, number> = {};

    for (const event of promotions) {
      promotionsByTier[event.toTier] = (promotionsByTier[event.toTier] || 0) + 1;
    }

    for (const event of demotions) {
      demotionsByTier[event.toTier] = (demotionsByTier[event.toTier] || 0) + 1;
    }

    return {
      totalPromotions: promotions.length,
      totalDemotions: demotions.length,
      promotionsByTier,
      demotionsByTier
    };
  }

  getPatternsByTier(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): Pattern[] {
    return Array.from(this.patterns.values()).filter(p => p.ranking.tier === tier);
  }

  getTopPatterns(limit: number = 10): Pattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.ranking.score - a.ranking.score)
      .slice(0, limit);
  }

  exportHistory(): PromotionEvent[] {
    return [...this.promotionHistory];
  }

  importHistory(events: PromotionEvent[]): void {
    this.promotionHistory = [...this.promotionHistory, ...events];
  }
}

export function createPatternPromoter(config?: Partial<PromotionConfig>): PatternPromoter {
  return new PatternPromoter(config);
}
