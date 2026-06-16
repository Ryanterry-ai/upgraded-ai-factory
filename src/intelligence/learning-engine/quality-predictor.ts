// Phase 8: Generation Quality Prediction

import {
  Generation,
  Pattern,
  FactoryPerformance,
  PredictionInput,
  PredictionOutput
} from '../models.js';

export interface PredictionConfig {
  modelVersion: string;
  confidenceThreshold: number;
  maxRiskFactors: number;
}

const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  modelVersion: '1.0.0',
  confidenceThreshold: 0.7,
  maxRiskFactors: 5
};

export interface PredictionModel {
  factoryType: string;
  weights: PredictionWeights;
  bias: number;
  accuracy: number;
  lastTrained: string;
}

export interface PredictionWeights {
  inputComplexity: number;
  historicalSuccess: number;
  patternMatch: number;
  factoryPerformance: number;
  timeOfDay: number;
}

export interface PredictionResult {
  prediction: PredictionOutput;
  confidence: number;
  modelAccuracy: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  value: number;
  impact: number;
  description: string;
}

export class QualityPredictor {
  private models: Map<string, PredictionModel> = new Map();
  private historicalData: Map<string, Generation[]> = new Map();
  private config: PredictionConfig;

  constructor(config: Partial<PredictionConfig> = {}) {
    this.config = { ...DEFAULT_PREDICTION_CONFIG, ...config };
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    const factoryTypes = ['website', 'ecommerce', 'saas', 'admin', 'dashboard', 'agent', 'tools'];

    for (const factoryType of factoryTypes) {
      this.models.set(factoryType, {
        factoryType,
        weights: {
          inputComplexity: 0.2,
          historicalSuccess: 0.3,
          patternMatch: 0.25,
          factoryPerformance: 0.15,
          timeOfDay: 0.1
        },
        bias: 0.5,
        accuracy: 0.7,
        lastTrained: new Date().toISOString()
      });
    }
  }

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const model = this.models.get(input.factoryType);
    if (!model) {
      return this.getDefaultPrediction(input);
    }

    const factors = this.extractFactors(input);
    const prediction = this.calculatePrediction(model, factors, input);
    const confidence = this.calculateConfidence(model, factors);

    return {
      prediction,
      confidence,
      modelAccuracy: model.accuracy,
      factors
    };
  }

  private extractFactors(input: PredictionInput): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    const inputComplexity = this.calculateInputComplexity(input.input);
    factors.push({
      name: 'inputComplexity',
      value: inputComplexity,
      impact: inputComplexity > 0.7 ? -0.1 : 0.1,
      description: inputComplexity > 0.7 ? 'Complex input may reduce quality' : 'Simple input improves quality'
    });

    const historicalSuccess = this.calculateHistoricalSuccess(input);
    factors.push({
      name: 'historicalSuccess',
      value: historicalSuccess,
      impact: historicalSuccess * 0.3,
      description: `Historical success rate: ${(historicalSuccess * 100).toFixed(1)}%`
    });

    const patternMatch = this.calculatePatternMatch(input);
    factors.push({
      name: 'patternMatch',
      value: patternMatch,
      impact: patternMatch * 0.25,
      description: `Pattern match score: ${(patternMatch * 100).toFixed(1)}%`
    });

    const factoryPerformance = this.calculateFactoryPerformance(input.factoryType);
    factors.push({
      name: 'factoryPerformance',
      value: factoryPerformance,
      impact: factoryPerformance * 0.15,
      description: `Factory performance: ${(factoryPerformance * 100).toFixed(1)}%`
    });

    const timeOfDay = this.calculateTimeFactor();
    factors.push({
      name: 'timeOfDay',
      value: timeOfDay,
      impact: timeOfDay * 0.1,
      description: 'Time-based factor'
    });

    return factors;
  }

  private calculateInputComplexity(input: Record<string, unknown>): number {
    const str = JSON.stringify(input);
    const length = str.length;
    const keys = Object.keys(input).length;

    let complexity = 0;
    if (length > 1000) complexity += 0.3;
    if (length > 5000) complexity += 0.3;
    if (keys > 10) complexity += 0.2;
    if (keys > 20) complexity += 0.2;

    return Math.min(1, complexity);
  }

  private calculateHistoricalSuccess(input: PredictionInput): number {
    const generations = input.historicalData;
    if (generations.length === 0) return 0.5;

    const successful = generations.filter(g => g.output.success);
    return successful.length / generations.length;
  }

  private calculatePatternMatch(input: PredictionInput): number {
    const generations = input.historicalData;
    if (generations.length === 0) return 0.5;

    const totalPatterns = generations.reduce((sum, g) => sum + g.output.patterns.length, 0);
    const avgPatterns = totalPatterns / generations.length;

    return Math.min(1, avgPatterns / 5);
  }

  private calculateFactoryPerformance(factoryType: string): number {
    const generations = this.historicalData.get(factoryType) || [];
    if (generations.length === 0) return 0.5;

    const successful = generations.filter(g => g.output.success);
    return successful.length / generations.length;
  }

  private calculateTimeFactor(): number {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) return 0.8;
    if (hour >= 7 && hour <= 20) return 0.6;
    return 0.4;
  }

  private calculatePrediction(
    model: PredictionModel,
    factors: PredictionFactor[],
    input: PredictionInput
  ): PredictionOutput {
    let score = model.bias;

    for (const factor of factors) {
      score += factor.value * factor.impact;
    }

    const successProbability = Math.max(0, Math.min(1, score));
    const estimatedQuality = successProbability * 0.8 + Math.random() * 0.2;
    const estimatedDuration = this.estimateDuration(input);
    const estimatedTokens = this.estimateTokens(input);
    const recommendedPatterns = this.getRecommendedPatterns(input);
    const recommendedTemplates = this.getRecommendedTemplates(input);
    const riskFactors = this.identifyRiskFactors(factors);

    return {
      successProbability,
      estimatedQuality,
      estimatedDuration,
      estimatedTokens,
      recommendedPatterns,
      recommendedTemplates,
      riskFactors
    };
  }

  private estimateDuration(input: PredictionInput): number {
    const baseDuration = 30000;
    const complexity = this.calculateInputComplexity(input.input);
    return baseDuration * (1 + complexity);
  }

  private estimateTokens(input: PredictionInput): number {
    const baseTokens = 10000;
    const complexity = this.calculateInputComplexity(input.input);
    return baseTokens * (1 + complexity);
  }

  private getRecommendedPatterns(input: PredictionInput): string[] {
    const generations = input.historicalData;
    const patternCounts: Record<string, number> = {};

    for (const gen of generations) {
      for (const pattern of gen.output.patterns) {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      }
    }

    return Object.entries(patternCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }

  private getRecommendedTemplates(input: PredictionInput): string[] {
    const generations = input.historicalData;
    const templateCounts: Record<string, number> = {};

    for (const gen of generations) {
      for (const template of gen.output.templates) {
        templateCounts[template] = (templateCounts[template] || 0) + 1;
      }
    }

    return Object.entries(templateCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([template]) => template);
  }

  private identifyRiskFactors(factors: PredictionFactor[]): string[] {
    const risks: string[] = [];

    for (const factor of factors) {
      if (factor.impact < -0.1) {
        risks.push(factor.description);
      }
    }

    return risks.slice(0, this.config.maxRiskFactors);
  }

  private calculateConfidence(model: PredictionModel, factors: PredictionFactor[]): number {
    let confidence = model.accuracy;

    for (const factor of factors) {
      if (factor.value > 0.8 || factor.value < 0.2) {
        confidence += 0.05;
      }
    }

    return Math.min(1, confidence);
  }

  private getDefaultPrediction(input: PredictionInput): PredictionResult {
    return {
      prediction: {
        successProbability: 0.5,
        estimatedQuality: 0.5,
        estimatedDuration: 30000,
        estimatedTokens: 10000,
        recommendedPatterns: [],
        recommendedTemplates: [],
        riskFactors: ['No historical data available']
      },
      confidence: 0.3,
      modelAccuracy: 0.5,
      factors: []
    };
  }

  async recordGenerationResult(generation: Generation, success: boolean): Promise<void> {
    const factoryGenerations = this.historicalData.get(generation.factoryType) || [];
    factoryGenerations.push(generation);
    this.historicalData.set(generation.factoryType, factoryGenerations);

    const model = this.models.get(generation.factoryType);
    if (model) {
      this.updateModel(model, generation, success);
    }
  }

  private updateModel(model: PredictionModel, generation: Generation, success: boolean): void {
    const learningRate = 0.1;
    const error = success ? 1 : 0;

    model.bias += learningRate * (error - model.bias);
    model.accuracy = model.accuracy * 0.95 + (success ? 0.05 : 0);
    model.lastTrained = new Date().toISOString();
  }

  getModel(factoryType: string): PredictionModel | undefined {
    return this.models.get(factoryType);
  }

  getStats(): {
    totalModels: number;
    averageAccuracy: number;
    totalHistoricalGenerations: number;
  } {
    const models = Array.from(this.models.values());
    const totalHistoricalGenerations = Array.from(this.historicalData.values())
      .reduce((sum, gens) => sum + gens.length, 0);

    return {
      totalModels: models.length,
      averageAccuracy: models.length > 0
        ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length
        : 0,
      totalHistoricalGenerations
    };
  }
}

export function createQualityPredictor(config?: Partial<PredictionConfig>): QualityPredictor {
  return new QualityPredictor(config);
}
