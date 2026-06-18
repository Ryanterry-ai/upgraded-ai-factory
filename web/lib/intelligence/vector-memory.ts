/**
 * MODULE 1: Vector Memory Layer
 *
 * Stores and retrieves generated apps, components, workflows, blueprints,
 * and agent outputs using vector embeddings for similarity search.
 *
 * Uses in-memory store with embedding-service for vector math.
 * Can be upgraded to pgvector when Supabase vector extension is enabled.
 */

import { generateEmbedding, cosineSimilarity } from "../embedding-service";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type MemoryType =
  | "project"
  | "component"
  | "workflow"
  | "blueprint"
  | "agent-output";

export interface MemoryItem {
  id: string;
  type: MemoryType;
  embedding: number[];
  metadata: Record<string, unknown>;
  timestamp: number;
  tags?: string[];
}

export interface MemoryQueryResult {
  item: MemoryItem;
  similarity: number;
}

// ═══════════════════════════════════════════════════════════
// IN-MEMORY STORE
// ═══════════════════════════════════════════════════════════

const _memoryStore: Map<string, MemoryItem> = new Map();
let _memoryEnabled = true;

export function getMemorySize(): number {
  return _memoryStore.size;
}

export function clearMemory(): void {
  _memoryStore.clear();
}

export function setMemoryEnabled(enabled: boolean): void {
  _memoryEnabled = enabled;
}

export function isMemoryEnabled(): boolean {
  return _memoryEnabled;
}

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════

/**
 * Store a memory item with embedding.
 * Every generated project, component, workflow, blueprint MUST be stored.
 */
export async function storeMemory(item: MemoryItem): Promise<void> {
  if (!_memoryEnabled) return;

  // Generate embedding if not provided
  const embedding =
    item.embedding.length > 0
      ? item.embedding
      : await generateEmbedding(
          `${item.type} ${JSON.stringify(item.metadata)}`
        );

  _memoryStore.set(item.id, {
    ...item,
    embedding,
    timestamp: item.timestamp || Date.now(),
  });
}

/**
 * Store a project in memory from generation result.
 */
export async function storeProjectMemory(params: {
  projectId: string;
  prompt: string;
  domain: string;
  files: Array<{ path: string; type: string }>;
  qualityScore: number;
  buildSuccess: boolean;
  agentCount: number;
}): Promise<void> {
  const text = `project ${params.domain} ${params.prompt} ${params.files.map((f) => f.path).join(" ")}`;
  const embedding = await generateEmbedding(text);

  await storeMemory({
    id: `proj_${params.projectId}`,
    type: "project",
    embedding,
    metadata: {
      projectId: params.projectId,
      prompt: params.prompt,
      domain: params.domain,
      fileCount: params.files.length,
      fileTypes: [...new Set(params.files.map((f) => f.type))],
      qualityScore: params.qualityScore,
      buildSuccess: params.buildSuccess,
      agentCount: params.agentCount,
      components: params.files
        .filter((f) => f.type === "component")
        .map((f) => f.path),
      pages: params.files
        .filter((f) => f.type === "page" || f.type === "html")
        .map((f) => f.path),
    },
    tags: [params.domain, params.buildSuccess ? "success" : "failed"],
    timestamp: Date.now(),
  });
}

/**
 * Store a component in memory.
 */
export async function storeComponentMemory(params: {
  componentId: string;
  name: string;
  domain: string;
  filePath: string;
  content: string;
  qualityScore: number;
}): Promise<void> {
  const embedding = await generateEmbedding(
    `component ${params.name} ${params.domain} ${params.content.slice(0, 500)}`
  );

  await storeMemory({
    id: `comp_${params.componentId}`,
    type: "component",
    embedding,
    metadata: {
      name: params.name,
      domain: params.domain,
      filePath: params.filePath,
      lineCount: params.content.split("\n").length,
      qualityScore: params.qualityScore,
      hasState: params.content.includes("useState"),
      hasEffects: params.content.includes("useEffect"),
      isClient: params.content.includes("'use client'"),
    },
    tags: [params.domain, params.qualityScore > 0.7 ? "high-quality" : "standard"],
    timestamp: Date.now(),
  });
}

/**
 * Store a blueprint pattern in memory.
 */
export async function storeBlueprintMemory(params: {
  blueprintId: string;
  domain: string;
  name: string;
  requiredComponents: string[];
  requiredPages: string[];
  qualityScore: number;
}): Promise<void> {
  const text = `blueprint ${params.domain} ${params.name} ${params.requiredComponents.join(" ")} ${params.requiredPages.join(" ")}`;
  const embedding = await generateEmbedding(text);

  await storeMemory({
    id: `bp_${params.blueprintId}`,
    type: "blueprint",
    embedding,
    metadata: {
      domain: params.domain,
      name: params.name,
      requiredComponents: params.requiredComponents,
      requiredPages: params.requiredPages,
      qualityScore: params.qualityScore,
      componentCount: params.requiredComponents.length,
      pageCount: params.requiredPages.length,
    },
    tags: [params.domain, "blueprint"],
    timestamp: Date.now(),
  });
}

// ═══════════════════════════════════════════════════════════
// QUERY
// ═══════════════════════════════════════════════════════════

/**
 * Query memory by embedding similarity.
 */
export async function queryMemory(
  embedding: number[],
  filter?: { type?: MemoryType; tags?: string[]; minSimilarity?: number },
  limit?: number
): Promise<MemoryQueryResult[]> {
  if (!_memoryEnabled || _memoryStore.size === 0) return [];

  const minSim = filter?.minSimilarity ?? 0.3;
  const maxResults = limit ?? 10;

  const results: MemoryQueryResult[] = [];

  for (const item of _memoryStore.values()) {
    if (filter?.type && item.type !== filter.type) continue;
    if (filter?.tags?.length) {
      const hasTag = filter.tags.some((t) => item.tags?.includes(t));
      if (!hasTag) continue;
    }

    const similarity = cosineSimilarity(embedding, item.embedding);
    if (similarity >= minSim) {
      results.push({ item, similarity });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, maxResults);
}

/**
 * Get similar patterns from a text input.
 * Used to find past successful projects/components for reuse.
 */
export async function getSimilarPatterns(
  input: string,
  options?: { type?: MemoryType; limit?: number }
): Promise<MemoryQueryResult[]> {
  const embedding = await generateEmbedding(input);
  return queryMemory(embedding, {
    type: options?.type,
    minSimilarity: 0.3,
  }, options?.limit ?? 5);
}

/**
 * Get best patterns for a specific domain.
 * Returns top-quality memories of a given type in the domain.
 */
export async function getBestPatterns(
  domain: string,
  type?: MemoryType,
  limit?: number
): Promise<MemoryQueryResult[]> {
  const results: MemoryQueryResult[] = [];

  for (const item of _memoryStore.values()) {
    if (type && item.type !== type) continue;
    const itemDomain = item.metadata.domain as string;
    if (itemDomain && itemDomain !== domain) continue;

    results.push({ item, similarity: (item.metadata.qualityScore as number) || 0.5 });
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit ?? 10);
}

/**
 * Get memory stats for observability.
 */
export function getMemoryStats(): {
  total: number;
  byType: Record<MemoryType, number>;
  oldestTimestamp: number;
  newestTimestamp: number;
} {
  const byType: Record<MemoryType, number> = {
    project: 0,
    component: 0,
    workflow: 0,
    blueprint: 0,
    "agent-output": 0,
  };

  let oldest = Infinity;
  let newest = 0;

  for (const item of _memoryStore.values()) {
    byType[item.type]++;
    if (item.timestamp < oldest) oldest = item.timestamp;
    if (item.timestamp > newest) newest = item.timestamp;
  }

  return {
    total: _memoryStore.size,
    byType,
    oldestTimestamp: oldest === Infinity ? 0 : oldest,
    newestTimestamp: newest,
  };
}
