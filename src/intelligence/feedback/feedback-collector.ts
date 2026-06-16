// Phase 8: Feedback Collection System

import {
  Generation,
  GenerationFeedback,
  UserEdit,
  LearningEvent,
  LearningImpact
} from '../models.js';

export interface FeedbackConfig {
  enableAutoCollection: boolean;
  enableEditTracking: boolean;
  enableApprovalTracking: boolean;
  minFeedbackForLearning: number;
}

const DEFAULT_FEEDBACK_CONFIG: FeedbackConfig = {
  enableAutoCollection: true,
  enableEditTracking: true,
  enableApprovalTracking: true,
  minFeedbackForLearning: 3
};

export interface FeedbackEntry {
  id: string;
  generationId: string;
  userId: string;
  type: 'rating' | 'edit' | 'approval' | 'rejection' | 'comment';
  data: unknown;
  timestamp: string;
}

export interface FeedbackSummary {
  generationId: string;
  totalFeedback: number;
  averageRating: number;
  approvalRate: number;
  editRate: number;
  commonEdits: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface UserPreference {
  userId: string;
  preferredStyles: string[];
  preferredPatterns: string[];
  qualityThreshold: number;
  feedbackHistory: FeedbackEntry[];
}

export class FeedbackCollector {
  private feedback: Map<string, FeedbackEntry[]> = new Map();
  private generations: Map<string, Generation> = new Map();
  private userPreferences: Map<string, UserPreference> = new Map();
  private learningEvents: LearningEvent[] = [];
  private config: FeedbackConfig;

  constructor(config: Partial<FeedbackConfig> = {}) {
    this.config = { ...DEFAULT_FEEDBACK_CONFIG, ...config };
  }

  async recordGeneration(generation: Generation): Promise<void> {
    this.generations.set(generation.id, generation);
  }

  async submitRating(
    generationId: string,
    userId: string,
    rating: number,
    comments: string[] = []
  ): Promise<FeedbackEntry> {
    if (!this.config.enableAutoCollection) {
      throw new Error('Auto collection is disabled');
    }

    const entry: FeedbackEntry = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      generationId,
      userId,
      type: 'rating',
      data: { rating, comments },
      timestamp: new Date().toISOString()
    };

    const feedbackList = this.feedback.get(generationId) || [];
    feedbackList.push(entry);
    this.feedback.set(generationId, feedbackList);

    await this.recordLearningEvent('feedback', {
      generationId,
      userId,
      rating,
      comments
    });

    return entry;
  }

  async submitEdit(
    generationId: string,
    userId: string,
    edit: UserEdit
  ): Promise<FeedbackEntry> {
    if (!this.config.enableEditTracking) {
      throw new Error('Edit tracking is disabled');
    }

    const entry: FeedbackEntry = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      generationId,
      userId,
      type: 'edit',
      data: edit,
      timestamp: new Date().toISOString()
    };

    const feedbackList = this.feedback.get(generationId) || [];
    feedbackList.push(entry);
    this.feedback.set(generationId, feedbackList);

    await this.recordLearningEvent('edit', {
      generationId,
      userId,
      edit
    });

    return entry;
  }

  async submitApproval(
    generationId: string,
    userId: string,
    approved: boolean,
    reason?: string
  ): Promise<FeedbackEntry> {
    if (!this.config.enableApprovalTracking) {
      throw new Error('Approval tracking is disabled');
    }

    const entry: FeedbackEntry = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      generationId,
      userId,
      type: approved ? 'approval' : 'rejection',
      data: { approved, reason },
      timestamp: new Date().toISOString()
    };

    const feedbackList = this.feedback.get(generationId) || [];
    feedbackList.push(entry);
    this.feedback.set(generationId, feedbackList);

    await this.recordLearningEvent(approved ? 'approval' : 'rejection', {
      generationId,
      userId,
      approved,
      reason
    });

    return entry;
  }

  async submitComment(
    generationId: string,
    userId: string,
    comment: string
  ): Promise<FeedbackEntry> {
    const entry: FeedbackEntry = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      generationId,
      userId,
      type: 'comment',
      data: { comment },
      timestamp: new Date().toISOString()
    };

    const feedbackList = this.feedback.get(generationId) || [];
    feedbackList.push(entry);
    this.feedback.set(generationId, feedbackList);

    return entry;
  }

  private async recordLearningEvent(
    type: LearningEvent['type'],
    data: unknown
  ): Promise<void> {
    const event: LearningEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      data,
      impact: {
        patternsAffected: 0,
        templatesAffected: 0,
        factoriesAffected: 0,
        scoreChange: 0
      },
      timestamp: new Date().toISOString()
    };

    this.learningEvents.push(event);
  }

  getFeedbackForGeneration(generationId: string): FeedbackEntry[] {
    return this.feedback.get(generationId) || [];
  }

  getFeedbackSummary(generationId: string): FeedbackSummary | null {
    const feedbackList = this.feedback.get(generationId);
    if (!feedbackList || feedbackList.length === 0) return null;

    const ratings = feedbackList.filter(f => f.type === 'rating');
    const edits = feedbackList.filter(f => f.type === 'edit');
    const approvals = feedbackList.filter(f => f.type === 'approval');
    const rejections = feedbackList.filter(f => f.type === 'rejection');

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, f) => sum + (f.data as { rating: number }).rating, 0) / ratings.length
      : 0;

    const totalDecisions = approvals.length + rejections.length;
    const approvalRate = totalDecisions > 0 ? approvals.length / totalDecisions : 0;

    const editRate = feedbackList.length > 0 ? edits.length / feedbackList.length : 0;

    const commonEdits = this.findCommonEdits(edits);

    const sentiment = this.calculateSentiment(averageRating, approvalRate, editRate);

    return {
      generationId,
      totalFeedback: feedbackList.length,
      averageRating,
      approvalRate,
      editRate,
      commonEdits,
      sentiment
    };
  }

  private findCommonEdits(edits: FeedbackEntry[]): string[] {
    const editTypes: Record<string, number> = {};

    for (const edit of edits) {
      const editData = edit.data as UserEdit;
      editTypes[editData.editType] = (editTypes[editData.editType] || 0) + 1;
    }

    return Object.entries(editTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);
  }

  private calculateSentiment(
    averageRating: number,
    approvalRate: number,
    editRate: number
  ): 'positive' | 'negative' | 'neutral' {
    const score = (averageRating / 5) * 0.4 + approvalRate * 0.4 + (1 - editRate) * 0.2;

    if (score > 0.7) return 'positive';
    if (score < 0.3) return 'negative';
    return 'neutral';
  }

  getUserPreferences(userId: string): UserPreference | undefined {
    return this.userPreferences.get(userId);
  }

  updateUserPreferences(userId: string, updates: Partial<UserPreference>): void {
    const existing = this.userPreferences.get(userId) || {
      userId,
      preferredStyles: [],
      preferredPatterns: [],
      qualityThreshold: 0.7,
      feedbackHistory: []
    };

    this.userPreferences.set(userId, { ...existing, ...updates });
  }

  getLearningEvents(limit: number = 100): LearningEvent[] {
    return this.learningEvents.slice(-limit);
  }

  getFeedbackStats(): {
    totalFeedback: number;
    byType: Record<string, number>;
    averageRating: number;
    approvalRate: number;
    sentimentBreakdown: Record<string, number>;
  } {
    const allFeedback = Array.from(this.feedback.values()).flat();
    const byType: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;
    let approvals = 0;
    let rejections = 0;
    const sentimentBreakdown: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };

    for (const entry of allFeedback) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;

      if (entry.type === 'rating') {
        totalRating += (entry.data as { rating: number }).rating;
        ratingCount++;
      }

      if (entry.type === 'approval') approvals++;
      if (entry.type === 'rejection') rejections++;
    }

    const summary = allFeedback.length > 0 ? this.getFeedbackSummary(allFeedback[0].generationId) : null;
    if (summary) {
      sentimentBreakdown[summary.sentiment] = (sentimentBreakdown[summary.sentiment] || 0) + 1;
    }

    const totalDecisions = approvals + rejections;

    return {
      totalFeedback: allFeedback.length,
      byType,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      approvalRate: totalDecisions > 0 ? approvals / totalDecisions : 0,
      sentimentBreakdown
    };
  }

  exportFeedback(): {
    feedback: Record<string, FeedbackEntry[]>;
    userPreferences: UserPreference[];
    learningEvents: LearningEvent[];
  } {
    return {
      feedback: Object.fromEntries(this.feedback),
      userPreferences: Array.from(this.userPreferences.values()),
      learningEvents: this.learningEvents
    };
  }

  importFeedback(data: {
    feedback?: Record<string, FeedbackEntry[]>;
    userPreferences?: UserPreference[];
    learningEvents?: LearningEvent[];
  }): void {
    if (data.feedback) {
      for (const [generationId, entries] of Object.entries(data.feedback)) {
        this.feedback.set(generationId, entries);
      }
    }

    if (data.userPreferences) {
      for (const pref of data.userPreferences) {
        this.userPreferences.set(pref.userId, pref);
      }
    }

    if (data.learningEvents) {
      this.learningEvents = [...this.learningEvents, ...data.learningEvents];
    }
  }
}

export function createFeedbackCollector(config?: Partial<FeedbackConfig>): FeedbackCollector {
  return new FeedbackCollector(config);
}
