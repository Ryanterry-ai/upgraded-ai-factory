import type {
  FactoryConfig,
  FactoryType,
  FactoryResult,
  StudioInput,
  InputType,
  Blueprint,
  GeneratedFile,
  EngineConfig,
  EngineResult,
  EventHandler,
  StudioEvent,
} from './types.js';
import { blueprintToJson, blueprintToYaml } from '../generators/blueprint-gen.js';

// ═══════════════════════════════════════════════════════════
// Factory Registry — Manages all registered factories
// ═══════════════════════════════════════════════════════════
export class FactoryRegistry {
  private factories = new Map<FactoryType, Factory>();

  register(factory: Factory): void {
    this.factories.set(factory.config.type, factory);
  }

  get(type: FactoryType): Factory | undefined {
    return this.factories.get(type);
  }

  getAll(): Factory[] {
    return Array.from(this.factories.values());
  }

  getSupportedInputTypes(type: FactoryType): InputType[] {
    return this.factories.get(type)?.config.supportedInputs || [];
  }

  detectFactory(input: StudioInput): FactoryType | null {
    const priority: FactoryType[] = ['ecommerce', 'agent', 'admin', 'dashboard', 'tools', 'saas', 'website'];
    for (const type of priority) {
      const factory = this.factories.get(type);
      if (factory && factory.canHandle(input)) {
        return type;
      }
    }
    for (const factory of this.factories.values()) {
      if (factory.canHandle(input)) {
        return factory.config.type;
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// Factory Interface — Base class for all factories
// ═══════════════════════════════════════════════════════════
export abstract class Factory {
  abstract readonly config: FactoryConfig;

  abstract canHandle(input: StudioInput): boolean;
  abstract execute(input: StudioInput, config: EngineConfig): Promise<FactoryResult>;

  protected createBlueprint(overrides: Partial<Blueprint>): Blueprint {
    return {
      $schema: 'https://github.com/upgraded-ai-factory/schemas/blueprint/v1.json',
      version: '1.0.0',
      project: {
        name: 'project',
        description: '',
        framework: 'nextjs',
        styling: 'tailwind',
        language: 'typescript',
        generatedAt: new Date().toISOString(),
        version: '0.1.0',
        ...overrides.project,
      },
      pages: [],
      components: [],
      navigation: { type: 'header', items: [], isSticky: true, isResponsive: true },
      typography: {
        fontFamilies: ['Inter', 'system-ui'],
        fontSizes: [
          { name: 'xs', value: '0.75rem', usage: 'caption' },
          { name: 'sm', value: '0.875rem', usage: 'small' },
          { name: 'base', value: '1rem', usage: 'body' },
          { name: 'lg', value: '1.125rem', usage: 'body-large' },
          { name: 'xl', value: '1.25rem', usage: 'subtitle' },
          { name: '2xl', value: '1.5rem', usage: 'heading-3' },
          { name: '3xl', value: '2rem', usage: 'heading-2' },
          { name: '4xl', value: '2.5rem', usage: 'heading-1' },
        ],
        fontWeights: [400, 500, 600, 700],
        lineHeights: [1.5, 1.6, 1.8],
        headingStyles: [
          { tag: 'h1', fontSize: '2.5rem', fontWeight: 700, lineHeight: '1.2', color: 'var(--foreground)' },
          { tag: 'h2', fontSize: '2rem', fontWeight: 700, lineHeight: '1.3', color: 'var(--foreground)' },
          { tag: 'h3', fontSize: '1.5rem', fontWeight: 600, lineHeight: '1.4', color: 'var(--foreground)' },
        ],
      },
      colors: {
        primary: { light: '#dbeafe', main: '#2563eb', dark: '#1d4ed8', contrast: '#ffffff' },
        secondary: { light: '#e0e7ff', main: '#4f46e5', dark: '#3730a3', contrast: '#ffffff' },
        accent: { light: '#fef3c7', main: '#f59e0b', dark: '#d97706', contrast: '#000000' },
        neutral: { light: '#f3f4f6', main: '#9ca3af', dark: '#374151', contrast: '#111827' },
        semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' },
        background: '#ffffff',
        foreground: '#111827',
        ...overrides.colors,
      },
      spacing: {
        gridSystem: '8px',
        marginScale: ['0', '0.25rem', '0.5rem', '1rem', '1.5rem', '2rem', '3rem', '4rem'],
        paddingScale: ['0', '0.25rem', '0.5rem', '1rem', '1.5rem', '2rem', '3rem', '4rem'],
        gapScale: ['0.5rem', '1rem', '1.5rem', '2rem'],
        sectionSpacing: '4rem',
        containerMaxWidth: '1280px',
        containerPadding: '1rem',
        ...overrides.spacing,
      },
      animations: {
        transitions: [
          { property: 'all', duration: '0.2s', easing: 'ease-in-out' },
        ],
        hoverEffects: [],
        scrollEffects: [],
      },
      interactions: { buttons: [], forms: [], modals: [] },
      responsive: {
        breakpoints: { mobile: '375px', tablet: '768px', desktop: '1024px', wide: '1440px' },
        mobile: { layout: 'stacked', columns: 1, gutter: '1rem', fontSize: '14px' },
        tablet: { layout: 'stacked', columns: 2, gutter: '1.5rem', fontSize: '15px' },
        desktop: { layout: 'grid', columns: 12, gutter: '2rem', fontSize: '16px' },
      },
      seo: {
        title: '',
        description: '',
        keywords: [],
        openGraph: { title: '', description: '', image: '', type: 'website' },
        structuredData: [],
        sitemap: true,
        robots: 'index, follow',
      },
      accessibility: {
        wcagLevel: 'AA',
        skipLinks: true,
        ariaLabels: true,
        keyboardNavigation: true,
        colorContrast: true,
        focusStates: true,
      },
      performance: {
        coreWebVitals: { lcp: 2.5, fid: 100, cls: 0.1 },
        bundleBudget: '250kb',
        imageOptimization: true,
        codeSplitting: true,
        lazyLoading: true,
      },
      dataModels: [],
      apiContracts: [],
      deployment: { platform: 'vercel', environment: 'production', domain: '', ssl: true, cdn: true },
      ...overrides,
    };
  }

  protected async writeBlueprint(
    blueprint: Blueprint,
    outputDir: string,
    projectName: string
  ): Promise<{ jsonPath: string; yamlPath: string }> {
    const fs = await import('fs');
    const path = await import('path');

    const outDir = path.join(outputDir, projectName);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const jsonPath = path.join(outDir, `${projectName}-blueprint.json`);
    const yamlPath = path.join(outDir, `${projectName}-blueprint.yaml`);

    fs.writeFileSync(jsonPath, blueprintToJson(blueprint));
    fs.writeFileSync(yamlPath, blueprintToYaml(blueprint));

    return { jsonPath, yamlPath };
  }

  protected createResult(
    success: boolean,
    factory: FactoryType,
    outputDir: string,
    files: GeneratedFile[],
    blueprint: Blueprint,
    startTime: number,
    inputType: InputType,
    errors?: string[]
  ): FactoryResult {
    const endTime = Date.now();
    return {
      success,
      factory,
      outputDir,
      files,
      blueprint,
      metadata: {
        startTime,
        endTime,
        duration: endTime - startTime,
        inputType,
        outputFormat: 'nextjs',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + Buffer.byteLength(f.content), 0),
      },
      errors,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Engine — Orchestrates factory execution
// ═══════════════════════════════════════════════════════════
export class StudioEngine {
  private registry: FactoryRegistry;
  private config: EngineConfig;
  private eventHandler?: EventHandler;

  constructor(config: Partial<EngineConfig> = {}) {
    this.registry = new FactoryRegistry();
    this.config = {
      outputDir: config.outputDir || './output',
      verbose: config.verbose || false,
      dryRun: config.dryRun || false,
    };
  }

  registerFactory(factory: Factory): void {
    this.registry.register(factory);
  }

  onEvent(handler: EventHandler): void {
    this.eventHandler = handler;
  }

  private emit(event: StudioEvent): void {
    this.eventHandler?.(event);
  }

  async execute(input: StudioInput, factoryType?: FactoryType): Promise<EngineResult> {
    const startTime = Date.now();
    this.emit({ type: 'input:received', input });

    const targetType = factoryType || this.registry.detectFactory(input);
    if (!targetType) {
      return {
        success: false,
        results: [],
        totalDuration: Date.now() - startTime,
        totalFiles: 0,
        totalSize: 0,
      };
    }

    const factory = this.registry.get(targetType);
    if (!factory) {
      return {
        success: false,
        results: [],
        totalDuration: Date.now() - startTime,
        totalFiles: 0,
        totalSize: 0,
      };
    }

    this.emit({ type: 'factory:selected', factory: targetType });
    this.emit({ type: 'factory:started', factory: targetType });

    const result = await factory.execute(input, this.config);
    this.emit({ type: 'factory:completed', factory: targetType, result });

    const totalDuration = Date.now() - startTime;
    return {
      success: result.success,
      results: [result],
      totalDuration,
      totalFiles: result.files.length,
      totalSize: result.metadata.totalSize,
    };
  }

  getRegistry(): FactoryRegistry {
    return this.registry;
  }
}
