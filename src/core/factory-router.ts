import { CanonicalRequirements, RequirementsEngineResult, FactoryType } from './canonical-schema.js';
import { RequirementUnderstandingEngine } from './requirement-engine.js';

export interface RoutingDecision {
  factory: FactoryType;
  confidence: number;
  reason: string;
  alternatives: FactoryType[];
  requirements: CanonicalRequirements;
  processingTimeMs: number;
}

export interface RouterConfig {
  minConfidenceThreshold: number;
  enableFallback: boolean;
  fallbackFactory: FactoryType;
  maxAlternatives: number;
}

const DEFAULT_CONFIG: RouterConfig = {
  minConfidenceThreshold: 0.5,
  enableFallback: true,
  fallbackFactory: 'website',
  maxAlternatives: 3,
};

export class FactoryRouter {
  private engine: RequirementUnderstandingEngine;
  private config: RouterConfig;

  constructor(config: Partial<RouterConfig> = {}) {
    this.engine = new RequirementUnderstandingEngine();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async route(input: {
    type: 'prompt' | 'url' | 'screenshot' | 'pdf' | 'codebase' | 'figma';
    content: string | Buffer;
    language?: string;
    metadata?: Record<string, any>;
  }): Promise<RoutingDecision> {
    const startTime = Date.now();

    // Step 1: Process through Requirement Understanding Engine
    const engineResult = await this.engine.process({
      type: input.type,
      content: input.content,
      language: input.language as any,
      metadata: input.metadata,
    });

    // Step 2: Determine primary factory
    const primaryFactory = this.selectPrimaryFactory(engineResult);

    // Step 3: Determine alternatives
    const alternatives = this.selectAlternatives(engineResult, primaryFactory);

    // Step 4: Calculate confidence
    const confidence = this.calculateRoutingConfidence(engineResult, primaryFactory);

    // Step 5: Generate reason
    const reason = this.generateRoutingReason(engineResult, primaryFactory);

    return {
      factory: primaryFactory,
      confidence,
      reason,
      alternatives,
      requirements: engineResult.requirements,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private selectPrimaryFactory(result: RequirementsEngineResult): FactoryType {
    // Use engine's determination if confidence is high enough
    if (result.confidence >= this.config.minConfidenceThreshold) {
      return result.factory;
    }

    // Fallback to config default
    return this.config.fallbackFactory;
  }

  private selectAlternatives(result: RequirementsEngineResult, primary: FactoryType): FactoryType[] {
    const allFactories: FactoryType[] = ['website', 'ecommerce', 'saas', 'admin', 'dashboard', 'agent', 'tools'];
    return allFactories
      .filter(f => f !== primary)
      .slice(0, this.config.maxAlternatives);
  }

  private calculateRoutingConfidence(result: RequirementsEngineResult, factory: FactoryType): number {
    let confidence = result.confidence;

    // Boost confidence if features align with factory
    const features = result.requirements.features;
    if (factory === 'ecommerce' && features.some(f => f.name === 'Shopping Cart' || f.name === 'Product Management')) {
      confidence += 0.15;
    }
    if (factory === 'admin' && features.some(f => f.name === 'Admin Panel')) {
      confidence += 0.15;
    }
    if (factory === 'dashboard' && features.some(f => f.name === 'Analytics Dashboard')) {
      confidence += 0.15;
    }
    if (factory === 'agent' && features.some(f => f.name === 'Chat/Messaging')) {
      confidence += 0.15;
    }
    if (factory === 'tools' && features.some(f => f.name === 'Data Export' || f.name === 'Data Import')) {
      confidence += 0.15;
    }

    // Penalize if ambiguities are high
    confidence -= result.requirements.ambiguities.length * 0.05;

    return Math.max(0, Math.min(1, confidence));
  }

  private generateRoutingReason(result: RequirementsEngineResult, factory: FactoryType): string {
    const req = result.requirements;
    const reasons: string[] = [];

    // Input type
    reasons.push(`Input type: ${req.inputType}`);

    // Language
    if (req.inputLanguage !== 'unknown') {
      reasons.push(`Language detected: ${req.inputLanguage}`);
    }

    // Features
    if (req.features.length > 0) {
      const featureNames = req.features.slice(0, 5).map(f => f.name).join(', ');
      reasons.push(`Features identified: ${featureNames}`);
    }

    // Entities
    if (req.entities.length > 0) {
      const entityNames = req.entities.map(e => e.type).join(', ');
      reasons.push(`Data entities: ${entityNames}`);
    }

    // Complexity
    reasons.push(`Complexity: ${req.complexity}`);

    // Industry
    if (req.industry !== 'technology') {
      reasons.push(`Industry: ${req.industry}`);
    }

    return reasons.join(' | ');
  }

  async routeFromText(text: string): Promise<RoutingDecision> {
    return this.route({ type: 'prompt', content: text });
  }

  async routeFromUrl(url: string): Promise<RoutingDecision> {
    return this.route({ type: 'url', content: url });
  }

  async routeFromScreenshot(imageBuffer: Buffer): Promise<RoutingDecision> {
    return this.route({ type: 'screenshot', content: imageBuffer });
  }

  async routeFromPdf(pdfBuffer: Buffer): Promise<RoutingDecision> {
    return this.route({ type: 'pdf', content: pdfBuffer });
  }

  async routeFromCodebase(codebasePath: string): Promise<RoutingDecision> {
    return this.route({ type: 'codebase', content: codebasePath });
  }

  getRouterInfo(): RouterConfig {
    return { ...this.config };
  }
}

export function createRouter(config?: Partial<RouterConfig>): FactoryRouter {
  return new FactoryRouter(config);
}
