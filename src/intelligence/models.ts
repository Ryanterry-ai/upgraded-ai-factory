// Phase 8: Intelligence Data Models

export type PatternType = 'component' | 'page' | 'api_route' | 'config' | 'blueprint' | 'design_system' | 'test' | 'documentation';

export type PatternSource = 'generated' | 'user_edited' | 'imported' | 'template';

export interface Pattern {
  id: string;
  type: PatternType;
  name: string;
  content: unknown;
  metadata: PatternMetadata;
  ranking: PatternRanking;
  usage: PatternUsage;
  createdAt: string;
  updatedAt: string;
}

export interface PatternMetadata {
  factory: string;
  agent: string;
  version: string;
  tags: string[];
  description: string;
  source: PatternSource;
  parentPatternId?: string;
  childPatternIds: string[];
}

export interface PatternRanking {
  score: number;
  successRate: number;
  qualityScore: number;
  userApproval: number;
  usageFrequency: number;
  lastUsed: string;
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface PatternUsage {
  totalUses: number;
  successfulUses: number;
  failedUses: number;
  lastUsed: string;
  averageExecutionTime: number;
  averageTokenUsage: number;
}

export interface Template {
  id: string;
  name: string;
  type: PatternType;
  factory: string;
  patterns: string[];
  ranking: TemplateRanking;
  metadata: TemplateMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRanking {
  score: number;
  successRate: number;
  qualityScore: number;
  userApproval: number;
  usageFrequency: number;
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface TemplateMetadata {
  description: string;
  author: string;
  version: string;
  tags: string[];
  dependencies: string[];
  compatibility: string[];
}

export interface Generation {
  id: string;
  factoryType: string;
  input: Record<string, unknown>;
  output: GenerationOutput;
  metrics: GenerationMetrics;
  feedback?: GenerationFeedback;
  createdAt: string;
  completedAt: string;
}

export interface GenerationOutput {
  artifacts: GeneratedArtifact[];
  patterns: string[];
  templates: string[];
  success: boolean;
  error?: string;
}

export interface GeneratedArtifact {
  id: string;
  type: string;
  name: string;
  content: unknown;
  quality: QualityMetrics;
  approved: boolean;
  edited: boolean;
  editDistance?: number;
}

export interface QualityMetrics {
  buildSuccess: boolean;
  typeErrors: number;
  lintErrors: number;
  accessibilityScore: number;
  performanceScore: number;
  securityScore: number;
  overallScore: number;
}

export interface GenerationMetrics {
  duration: number;
  tokenUsage: number;
  cost: number;
  agentCount: number;
  artifactCount: number;
  patternMatches: number;
}

export interface GenerationFeedback {
  userId: string;
  rating: number;
  comments: string[];
  edits: UserEdit[];
  approved: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface UserEdit {
  artifactId: string;
  before: unknown;
  after: unknown;
  editType: 'minor' | 'moderate' | 'major';
  timestamp: string;
}

export interface FactoryPerformance {
  factoryType: string;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
  averageQuality: number;
  averageDuration: number;
  averageTokenUsage: number;
  averageCost: number;
  topPatterns: string[];
  topTemplates: string[];
  improvementTrend: ImprovementTrend;
}

export interface ImprovementTrend {
  successRateChange: number;
  qualityChange: number;
  durationChange: number;
  tokenUsageChange: number;
  period: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  type: 'factory' | 'pattern' | 'template';
  score: number;
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  metrics: LeaderboardMetrics;
}

export interface LeaderboardMetrics {
  successRate: number;
  qualityScore: number;
  userApproval: number;
  usageFrequency: number;
  improvementRate: number;
}

export interface LearningEvent {
  id: string;
  type: 'generation' | 'feedback' | 'edit' | 'approval' | 'rejection' | 'pattern_discovery' | 'template_creation';
  data: unknown;
  impact: LearningImpact;
  timestamp: string;
}

export interface LearningImpact {
  patternsAffected: number;
  templatesAffected: number;
  factoriesAffected: number;
  scoreChange: number;
}

export interface PredictionInput {
  factoryType: string;
  input: Record<string, unknown>;
  historicalData: Generation[];
}

export interface PredictionOutput {
  successProbability: number;
  estimatedQuality: number;
  estimatedDuration: number;
  estimatedTokens: number;
  recommendedPatterns: string[];
  recommendedTemplates: string[];
  riskFactors: string[];
}

export function createPattern(
  type: PatternType,
  name: string,
  content: unknown,
  factory: string,
  agent: string,
  source: PatternSource = 'generated'
): Pattern {
  const now = new Date().toISOString();
  return {
    id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name,
    content,
    metadata: {
      factory,
      agent,
      version: '1.0.0',
      tags: [],
      description: '',
      source,
      childPatternIds: []
    },
    ranking: {
      score: 0.5,
      successRate: 0,
      qualityScore: 0,
      userApproval: 0,
      usageFrequency: 0,
      lastUsed: now,
      rank: 0,
      tier: 'bronze'
    },
    usage: {
      totalUses: 0,
      successfulUses: 0,
      failedUses: 0,
      lastUsed: now,
      averageExecutionTime: 0,
      averageTokenUsage: 0
    },
    createdAt: now,
    updatedAt: now
  };
}

export function createTemplate(
  name: string,
  type: PatternType,
  factory: string,
  patterns: string[]
): Template {
  const now = new Date().toISOString();
  return {
    id: `template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    factory,
    patterns,
    ranking: {
      score: 0.5,
      successRate: 0,
      qualityScore: 0,
      userApproval: 0,
      usageFrequency: 0,
      rank: 0,
      tier: 'bronze'
    },
    metadata: {
      description: '',
      author: 'system',
      version: '1.0.0',
      tags: [],
      dependencies: [],
      compatibility: []
    },
    createdAt: now,
    updatedAt: now
  };
}

export function createGeneration(
  factoryType: string,
  input: Record<string, unknown>
): Generation {
  const now = new Date().toISOString();
  return {
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    factoryType,
    input,
    output: {
      artifacts: [],
      patterns: [],
      templates: [],
      success: false
    },
    metrics: {
      duration: 0,
      tokenUsage: 0,
      cost: 0,
      agentCount: 0,
      artifactCount: 0,
      patternMatches: 0
    },
    createdAt: now,
    completedAt: now
  };
}

export function calculateTier(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (score >= 0.9) return 'platinum';
  if (score >= 0.75) return 'gold';
  if (score >= 0.5) return 'silver';
  return 'bronze';
}

export function calculateRankingScore(
  successRate: number,
  qualityScore: number,
  userApproval: number,
  usageFrequency: number,
  weights: { success: number; quality: number; approval: number; usage: number } = {
    success: 0.3,
    quality: 0.3,
    approval: 0.2,
    usage: 0.2
  }
): number {
  return (
    successRate * weights.success +
    qualityScore * weights.quality +
    userApproval * weights.approval +
    usageFrequency * weights.usage
  );
}
