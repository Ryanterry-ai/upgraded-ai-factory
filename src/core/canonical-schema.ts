export type InputLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | 'pt' | 'ar' | 'hi' | 'unknown';

export type InputType = 'prompt' | 'url' | 'screenshot' | 'pdf' | 'codebase' | 'figma' | 'voice' | 'mixed';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise';

export type FactoryType = 'website' | 'ecommerce' | 'saas' | 'admin' | 'dashboard' | 'agent' | 'tools';

export interface ExtractedFeature {
  name: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  category: 'core' | 'ui' | 'backend' | 'auth' | 'data' | 'integration' | 'analytics' | 'seo' | 'performance';
  estimatedEffort: 'hours' | 'days' | 'weeks';
}

export interface ExtractedEntity {
  name: string;
  type: 'user' | 'product' | 'order' | 'content' | 'transaction' | 'session' | 'config' | 'notification' | 'custom';
  fields: string[];
  relationships: string[];
}

export interface UIRequirement {
  layout: 'single-page' | 'multi-page' | 'dashboard' | 'admin' | 'hybrid';
  navigation: 'top-nav' | 'sidebar' | 'bottom-nav' | 'none';
  theme: 'light' | 'dark' | 'both' | 'auto';
  responsive: boolean;
  accessibility: 'basic' | 'wcag-aa' | 'wcag-aaa';
  components: string[];
}

export interface DataRequirement {
  storage: 'local' | 'database' | 'api' | 'mixed';
  database: 'none' | 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
  auth: 'none' | 'email' | 'oauth' | 'both' | 'api-key';
  realtime: boolean;
  caching: boolean;
}

export interface BusinessGoal {
  goal: string;
  metric: string;
  target: string;
  timeframe: string;
}

export interface CanonicalRequirements {
  // Input metadata
  inputType: InputType;
  inputLanguage: InputLanguage;
  originalInput: string;
  extractedAt: string;

  // Core identity
  projectName: string;
  projectType: FactoryType;
  projectDescription: string;
  industry: string;
  targetAudience: string;

  // Business goals
  businessGoals: BusinessGoal[];

  // Features
  features: ExtractedFeature[];
  complexity: ComplexityLevel;

  // Data model
  entities: ExtractedEntity[];
  dataRequirements: DataRequirement;

  // UI requirements
  uiRequirements: UIRequirement;

  // Technical constraints
  techStack: string[];
  integrations: string[];
  performanceRequirements: {
    loadTimeMs: number;
    lighthouseScore: number;
    bundleSizeKb: number;
  };

  // Quality gates
  qualityGates: {
    buildMustPass: boolean;
    maxTsErrors: number;
    minTestCoverage: number;
    minLighthouseScore: number;
    requiredAccessibility: string[];
  };

  // Confidence
  confidence: number;
  ambiguities: string[];
  suggestions: string[];
}

export interface RequirementsInput {
  type: InputType;
  content: string | Buffer;
  language?: InputLanguage;
  metadata?: Record<string, any>;
}

export interface RequirementsEngineResult {
  requirements: CanonicalRequirements;
  inputType: InputType;
  factory: FactoryType;
  confidence: number;
  processingTimeMs: number;
  warnings: string[];
}
