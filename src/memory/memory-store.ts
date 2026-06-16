import { createSupabaseClient, type SupabaseClient } from './supabase-client.js';
import { createEmbeddingService, type EmbeddingService } from './embedding-service.js';
import type { Blueprint, FactoryType } from '../core/types.js';

// ============================================================
// TYPES
// ============================================================

export interface Project {
  id?: string;
  name: string;
  factory: FactoryType;
  prompt: string;
  blueprint_id?: string;
  quality_score: number;
  build_success: boolean;
  file_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlueprintRecord {
  id?: string;
  project_id: string;
  yaml?: string;
  json?: Blueprint;
  embedding?: number[];
  created_at?: string;
}

export interface Pattern {
  id?: string;
  category: string;
  description: string;
  success_rate: number;
  usage_count: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Evaluation {
  id?: string;
  project_id: string;
  seo_score: number;
  ux_score: number;
  perf_score: number;
  security_score: number;
  accessibility_score: number;
  code_quality_score: number;
  overall_score: number;
  findings?: Record<string, unknown>;
  created_at?: string;
}

export interface Generation {
  id?: string;
  factory: FactoryType;
  prompt: string;
  result?: Record<string, unknown>;
  build_success: boolean;
  build_time_ms: number;
  file_count: number;
  ts_errors: number;
  lint_warnings: number;
  embedding?: number[];
  created_at?: string;
}

export interface Component {
  id?: string;
  name: string;
  factory: FactoryType;
  category?: string;
  code: string;
  props?: Record<string, unknown>;
  usage_count: number;
  success_rate: number;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface DesignSystem {
  id?: string;
  name: string;
  factory: FactoryType;
  colors?: Record<string, unknown>;
  typography?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  components?: Record<string, unknown>;
  embedding?: number[];
  success_rate: number;
  usage_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface SimilarityResult<T> {
  item: T;
  score: number;
}

// ============================================================
// MEMORY STORE
// ============================================================

export class MemoryStore {
  private supabase: SupabaseClient;
  private embedding: EmbeddingService;
  private useLocalFallback: boolean;
  private localStore: Map<string, unknown[]>;

  constructor(config?: { supabaseUrl?: string; supabaseKey?: string; openaiKey?: string }) {
    this.supabase = createSupabaseClient({
      url: config?.supabaseUrl,
      anonKey: config?.supabaseKey,
    });
    this.embedding = createEmbeddingService({ apiKey: config?.openaiKey });
    this.useLocalFallback = !config?.supabaseUrl;
    this.localStore = new Map();
  }

  // ============================================================
  // PROJECTS
  // ============================================================

  async saveProject(project: Project): Promise<Project> {
    if (this.useLocalFallback) {
      const id = project.id || crypto.randomUUID();
      const record = { ...project, id, created_at: new Date().toISOString() };
      const projects = (this.localStore.get('projects') || []) as Project[];
      projects.push(record);
      this.localStore.set('projects', projects);
      return record;
    }
    const { data, error } = await this.supabase.insert<Project>('projects', project);
    if (error) throw error;
    return data![0];
  }

  async getProject(id: string): Promise<Project | null> {
    if (this.useLocalFallback) {
      const projects = (this.localStore.get('projects') || []) as Project[];
      return projects.find(p => p.id === id) || null;
    }
    const { data, error } = await this.supabase.select<Project>('projects', {
      filters: { id },
      limit: 1,
    });
    if (error) throw error;
    return data?.[0] || null;
  }

  async listProjects(options?: { factory?: FactoryType; limit?: number; offset?: number }): Promise<Project[]> {
    if (this.useLocalFallback) {
      let projects = (this.localStore.get('projects') || []) as Project[];
      if (options?.factory) projects = projects.filter(p => p.factory === options.factory);
      return projects.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 100));
    }
    const { data, error } = await this.supabase.select<Project>('projects', {
      filters: options?.factory ? { factory: options.factory } : undefined,
      order: { column: 'created_at', ascending: false },
      limit: options?.limit || 100,
      offset: options?.offset,
    });
    if (error) throw error;
    return data || [];
  }

  async findSimilarProjects(embedding: number[], limit = 5): Promise<SimilarityResult<Project>[]> {
    if (this.useLocalFallback) {
      const projects = (this.localStore.get('projects') || []) as Project[];
      return projects
        .map(p => ({ item: p, score: 0.5 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const { data, error } = await this.supabase.rpc<Project & { score: number }>('match_embeddings', {
      query_embedding: embedding,
      table_name: 'projects',
      match_count: limit,
      match_threshold: 0.3,
    });
    if (error) throw error;
    return (data || []).map(d => ({ item: d, score: d.score }));
  }

  // ============================================================
  // BLUEPRINTS
  // ============================================================

  async saveBlueprint(blueprint: BlueprintRecord): Promise<BlueprintRecord> {
    if (this.useLocalFallback) {
      const id = blueprint.id || crypto.randomUUID();
      const record = { ...blueprint, id, created_at: new Date().toISOString() };
      const blueprints = (this.localStore.get('blueprints') || []) as BlueprintRecord[];
      blueprints.push(record);
      this.localStore.set('blueprints', blueprints);
      return record;
    }
    const { data, error } = await this.supabase.insert<BlueprintRecord>('blueprints', blueprint);
    if (error) throw error;
    return data![0];
  }

  async findSimilarBlueprints(embedding: number[], limit = 5): Promise<SimilarityResult<BlueprintRecord>[]> {
    if (this.useLocalFallback) {
      const blueprints = (this.localStore.get('blueprints') || []) as BlueprintRecord[];
      return blueprints
        .map(b => ({ item: b, score: b.embedding ? this.embedding.cosineSimilarity(embedding, b.embedding) : 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const { data, error } = await this.supabase.rpc<BlueprintRecord & { score: number }>('match_embeddings', {
      query_embedding: embedding,
      table_name: 'blueprints',
      match_count: limit,
      match_threshold: 0.3,
    });
    if (error) throw error;
    return (data || []).map(d => ({ item: d, score: d.score }));
  }

  // ============================================================
  // PATTERNS
  // ============================================================

  async savePattern(pattern: Pattern): Promise<Pattern> {
    if (this.useLocalFallback) {
      const id = pattern.id || crypto.randomUUID();
      const record = { ...pattern, id, created_at: new Date().toISOString() };
      const patterns = (this.localStore.get('patterns') || []) as Pattern[];
      patterns.push(record);
      this.localStore.set('patterns', patterns);
      return record;
    }
    const { data, error } = await this.supabase.insert<Pattern>('patterns', pattern);
    if (error) throw error;
    return data![0];
  }

  async findSimilarPatterns(embedding: number[], limit = 5): Promise<SimilarityResult<Pattern>[]> {
    if (this.useLocalFallback) {
      const patterns = (this.localStore.get('patterns') || []) as Pattern[];
      return patterns
        .map(p => ({ item: p, score: p.embedding ? this.embedding.cosineSimilarity(embedding, p.embedding) : 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const { data, error } = await this.supabase.rpc<Pattern & { score: number }>('match_embeddings', {
      query_embedding: embedding,
      table_name: 'patterns',
      match_count: limit,
      match_threshold: 0.3,
    });
    if (error) throw error;
    return (data || []).map(d => ({ item: d, score: d.score }));
  }

  async getTopPatterns(category?: string, limit = 10): Promise<Pattern[]> {
    if (this.useLocalFallback) {
      let patterns = (this.localStore.get('patterns') || []) as Pattern[];
      if (category) patterns = patterns.filter(p => p.category === category);
      return patterns.sort((a, b) => b.success_rate - a.success_rate).slice(0, limit);
    }
    const { data, error } = await this.supabase.select<Pattern>('patterns', {
      filters: category ? { category } : undefined,
      order: { column: 'success_rate', ascending: false },
      limit,
    });
    if (error) throw error;
    return data || [];
  }

  // ============================================================
  // EVALUATIONS
  // ============================================================

  async saveEvaluation(evaluation: Evaluation): Promise<Evaluation> {
    if (this.useLocalFallback) {
      const id = evaluation.id || crypto.randomUUID();
      const record = { ...evaluation, id, created_at: new Date().toISOString() };
      const evaluations = (this.localStore.get('evaluations') || []) as Evaluation[];
      evaluations.push(record);
      this.localStore.set('evaluations', evaluations);
      return record;
    }
    const { data, error } = await this.supabase.insert<Evaluation>('evaluations', evaluation);
    if (error) throw error;
    return data![0];
  }

  async getProjectEvaluation(projectId: string): Promise<Evaluation | null> {
    if (this.useLocalFallback) {
      const evaluations = (this.localStore.get('evaluations') || []) as Evaluation[];
      return evaluations.find(e => e.project_id === projectId) || null;
    }
    const { data, error } = await this.supabase.select<Evaluation>('evaluations', {
      filters: { project_id: projectId },
      limit: 1,
    });
    if (error) throw error;
    return data?.[0] || null;
  }

  // ============================================================
  // GENERATIONS
  // ============================================================

  async saveGeneration(generation: Generation): Promise<Generation> {
    if (this.useLocalFallback) {
      const id = generation.id || crypto.randomUUID();
      const record = { ...generation, id, created_at: new Date().toISOString() };
      const generations = (this.localStore.get('generations') || []) as Generation[];
      generations.push(record);
      this.localStore.set('generations', generations);
      return record;
    }
    const { data, error } = await this.supabase.insert<Generation>('generations', generation);
    if (error) throw error;
    return data![0];
  }

  async findSimilarGenerations(embedding: number[], limit = 5): Promise<SimilarityResult<Generation>[]> {
    if (this.useLocalFallback) {
      const generations = (this.localStore.get('generations') || []) as Generation[];
      return generations
        .map(g => ({ item: g, score: g.embedding ? this.embedding.cosineSimilarity(embedding, g.embedding) : 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const { data, error } = await this.supabase.rpc<Generation & { score: number }>('match_embeddings', {
      query_embedding: embedding,
      table_name: 'generations',
      match_count: limit,
      match_threshold: 0.3,
    });
    if (error) throw error;
    return (data || []).map(d => ({ item: d, score: d.score }));
  }

  async getSuccessfulGenerations(factory?: FactoryType, limit = 10): Promise<Generation[]> {
    if (this.useLocalFallback) {
      let generations = (this.localStore.get('generations') || []) as Generation[];
      generations = generations.filter(g => g.build_success);
      if (factory) generations = generations.filter(g => g.factory === factory);
      return generations.slice(0, limit);
    }
    const filters: Record<string, unknown> = { build_success: true };
    if (factory) filters.factory = factory;
    const { data, error } = await this.supabase.select<Generation>('generations', {
      filters,
      order: { column: 'created_at', ascending: false },
      limit,
    });
    if (error) throw error;
    return data || [];
  }

  // ============================================================
  // COMPONENTS
  // ============================================================

  async saveComponent(component: Component): Promise<Component> {
    if (this.useLocalFallback) {
      const id = component.id || crypto.randomUUID();
      const record = { ...component, id, created_at: new Date().toISOString() };
      const components = (this.localStore.get('components') || []) as Component[];
      components.push(record);
      this.localStore.set('components', components);
      return record;
    }
    const { data, error } = await this.supabase.insert<Component>('components', component);
    if (error) throw error;
    return data![0];
  }

  async findSimilarComponents(embedding: number[], limit = 5): Promise<SimilarityResult<Component>[]> {
    if (this.useLocalFallback) {
      const components = (this.localStore.get('components') || []) as Component[];
      return components
        .map(c => ({ item: c, score: c.embedding ? this.embedding.cosineSimilarity(embedding, c.embedding) : 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const { data, error } = await this.supabase.rpc<Component & { score: number }>('match_embeddings', {
      query_embedding: embedding,
      table_name: 'components',
      match_count: limit,
      match_threshold: 0.3,
    });
    if (error) throw error;
    return (data || []).map(d => ({ item: d, score: d.score }));
  }

  // ============================================================
  // DESIGN SYSTEMS
  // ============================================================

  async saveDesignSystem(ds: DesignSystem): Promise<DesignSystem> {
    if (this.useLocalFallback) {
      const id = ds.id || crypto.randomUUID();
      const record = { ...ds, id, created_at: new Date().toISOString() };
      const systems = (this.localStore.get('design_systems') || []) as DesignSystem[];
      systems.push(record);
      this.localStore.set('design_systems', systems);
      return record;
    }
    const { data, error } = await this.supabase.insert<DesignSystem>('design_systems', ds);
    if (error) throw error;
    return data![0];
  }

  async findSimilarDesignSystems(embedding: number[], limit = 5): Promise<SimilarityResult<DesignSystem>[]> {
    if (this.useLocalFallback) {
      const systems = (this.localStore.get('design_systems') || []) as DesignSystem[];
      return systems
        .map(s => ({ item: s, score: s.embedding ? this.embedding.cosineSimilarity(embedding, s.embedding) : 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const { data, error } = await this.supabase.rpc<DesignSystem & { score: number }>('match_embeddings', {
      query_embedding: embedding,
      table_name: 'design_systems',
      match_count: limit,
      match_threshold: 0.3,
    });
    if (error) throw error;
    return (data || []).map(d => ({ item: d, score: d.score }));
  }

  // ============================================================
  // EMBEDDING HELPERS
  // ============================================================

  async embedText(text: string): Promise<number[]> {
    return this.embedding.embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embedding.embedBatch(texts);
  }

  // ============================================================
  // STATS
  // ============================================================

  async getStats(): Promise<Record<string, number>> {
    if (this.useLocalFallback) {
      return {
        projects: (this.localStore.get('projects') || []).length,
        blueprints: (this.localStore.get('blueprints') || []).length,
        patterns: (this.localStore.get('patterns') || []).length,
        evaluations: (this.localStore.get('evaluations') || []).length,
        generations: (this.localStore.get('generations') || []).length,
        components: (this.localStore.get('components') || []).length,
        design_systems: (this.localStore.get('design_systems') || []).length,
      };
    }
    const stats: Record<string, number> = {};
    for (const table of ['projects', 'blueprints', 'patterns', 'evaluations', 'generations', 'components', 'design_systems']) {
      const { data, error } = await this.supabase.select(table, { columns: 'id', limit: 10000 });
      stats[table] = error ? 0 : (data?.length || 0);
    }
    return stats;
  }
}

export function createMemoryStore(config?: { supabaseUrl?: string; supabaseKey?: string; openaiKey?: string }): MemoryStore {
  return new MemoryStore(config);
}
