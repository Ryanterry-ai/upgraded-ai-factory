/**
 * MODULE 4: Intelligence Orchestrator
 *
 * The brain controller of the AI Factory.
 * Connects: SSE v1 + Memory Layer + Graph Execution + Knowledge Graph
 *
 * Flow:
 * 1. Query vector memory for similar projects
 * 2. Load best workflow patterns from knowledge graph
 * 3. Inject into blueprint engine
 * 4. Enhance agent prompts via knowledge graph
 * 5. Execute graph workflow
 * 6. Feed results into SSE state
 * 7. Store output back into memory
 */

import {
  storeMemory,
  storeProjectMemory,
  storeComponentMemory,
  storeBlueprintMemory,
  getSimilarPatterns,
  getBestPatterns as getMemoryBestPatterns,
  getMemoryStats,
  type MemoryItem,
  type MemoryType,
} from "./vector-memory";
import {
  buildGraph,
  runGraph,
  buildGraphFromFlows,
  branch,
  rollback,
  getGraphSummary,
  type GraphNode,
  type GraphContext,
  type GraphResult,
  clearGraphs,
} from "./graph-executor";
import {
  addNode,
  addRelation,
  queryRelations,
  getBestPatterns,
  recordSuccess,
  recordFailure,
  learnFromGeneration,
  getComponentProbability,
  getKnowledgeStats,
  clearKnowledge,
  type KnowledgeNode,
  type RelationType,
} from "./knowledge-graph";
import {
  getState,
  emit,
  initializeSystemState,
  hydrateStateWithRPSE,
  startWorkflow,
  advanceWorkflow,
  completeWorkflow,
  getActiveWorkflows,
} from "../system-state-engine";
import { getRPSEData } from "../rpse";
import { detectBlueprint, type DomainBlueprint } from "../domain-blueprints";
import { detectRPSEContext } from "../rpse";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface IntelligenceContext {
  projectId: string;
  prompt: string;
  domain: string;
  blueprint: DomainBlueprint | null;
  similarProjects: Array<{
    id: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>;
  bestPatterns: Array<{
    patternId: string;
    score: number;
    reasons: string[];
  }>;
  enhancedBlueprint: DomainBlueprint | null;
  graphId: string | null;
}

export interface IntelligenceResult {
  context: IntelligenceContext;
  graphResult?: GraphContext;
  storedMemories: number;
  knowledgeEdges: number;
  duration: number;
}

// ═══════════════════════════════════════════════════════════
// CORE FUNCTION: enhanceGeneration
// ═══════════════════════════════════════════════════════════

/**
 * Main intelligence function. Called before generation.
 * Queries memory, loads patterns, enhances blueprint, prepares graph.
 */
export async function enhanceGeneration(params: {
  projectId: string;
  prompt: string;
}): Promise<IntelligenceContext> {
  const startTime = Date.now();
  const { prompt } = params;

  // 1. Detect domain and blueprint
  const rpseContext = detectRPSEContext(prompt);
  const domain = rpseContext.domain;
  const blueprint = detectBlueprint(prompt);

  // 2. Query vector memory for similar projects
  const similarPatterns = await getSimilarPatterns(prompt, { limit: 5 });
  const similarProjects = similarPatterns
    .filter((p) => p.item.type === "project")
    .map((p) => ({
      id: p.item.id,
      similarity: p.similarity,
      metadata: p.item.metadata,
    }));

  // 3. Load best patterns from knowledge graph
  const domainPatterns = getBestPatterns(domain);

  // 4. Enhance blueprint with knowledge insights
  const enhancedBlueprint = enhanceBlueprint(blueprint, domainPatterns, similarProjects);

  // 5. Initialize SSE with enhanced context
  const detectedBlueprint = enhancedBlueprint || blueprint;
  initializeSystemState({
    domain,
    projectName: `project_${params.projectId}`,
    blueprint: detectedBlueprint,
  });

  // 6. Emit intelligence context to SSE
  emit({
    type: "DATA_UPDATE",
    payload: {
      key: "intelligenceContext",
      value: {
        similarProjectsCount: similarProjects.length,
        bestPatternsCount: domainPatterns.length,
        blueprintEnhanced: enhancedBlueprint !== blueprint,
      },
    },
    source: "system",
  });

  console.log(
    `[AIL] Intelligence enhanced in ${Date.now() - startTime}ms — ` +
    `${similarProjects.length} similar projects, ${domainPatterns.length} patterns`
  );

  return {
    projectId: params.projectId,
    prompt,
    domain,
    blueprint,
    similarProjects,
    bestPatterns: domainPatterns,
    enhancedBlueprint,
    graphId: null,
  };
}

// ═══════════════════════════════════════════════════════════
// BLUEPRINT ENHANCEMENT
// ═══════════════════════════════════════════════════════════

function enhanceBlueprint(
  blueprint: DomainBlueprint | null,
  patterns: Array<{ patternId: string; score: number; reasons: string[] }>,
  similarProjects: Array<{ id: string; similarity: number; metadata: Record<string, unknown> }>
): DomainBlueprint | null {
  if (!blueprint) return null;

  // Create enhanced copy
  const enhanced = { ...blueprint };

  // Add recommended components from high-scoring patterns
  const highScorePatterns = patterns.filter((p) => p.score > 0.6);
  if (highScorePatterns.length > 0) {
    // Get component IDs from patterns that improve this domain
    const recommendedComponents: string[] = [];
    for (const pattern of highScorePatterns) {
      const edges = queryRelations(pattern.patternId);
      for (const edge of edges) {
        if (edge.relation === "improves" || edge.relation === "enhances") {
          recommendedComponents.push(edge.to);
        }
      }
    }

    // Add unique recommended components that aren't already in blueprint
    const existingNames = enhanced.requiredComponents.map((c) => c.name);
    for (const compId of recommendedComponents.slice(0, 3)) {
      const compName = compId.replace("comp_", "");
      if (!existingNames.includes(compName)) {
        enhanced.requiredComponents.push({
          name: compName,
          minLines: 25,
          requiredElements: ["className"],
          requiredLogic: ["useState"],
          description: `Recommended component from knowledge graph`,
        });
      }
    }
  }

  // Learn from similar successful projects
  const successfulSimilar = similarProjects.filter(
    (p) => (p.metadata.buildSuccess as boolean) && (p.metadata.qualityScore as number) > 0.7
  );

  if (successfulSimilar.length > 0) {
    // Add pages from successful similar projects
    const existingPages = enhanced.requiredPages.map((p) => p.name);
    for (const project of successfulSimilar.slice(0, 2)) {
      const pages = (project.metadata.pages as string[]) || [];
      for (const page of pages) {
        const pageName = page.replace(/\.(tsx?|jsx?)$/, "").split("/").pop() || page;
        if (!existingPages.includes(pageName) && pageName !== "page") {
          enhanced.requiredPages.push({
            name: pageName,
            route: `/${pageName.toLowerCase()}`,
            components: [],
          });
        }
      }
    }
  }

  return enhanced;
}

// ═══════════════════════════════════════════════════════════
// GRAPH WORKFLOW EXECUTION
// ═══════════════════════════════════════════════════════════

/**
 * Create and execute a graph workflow from blueprint flows.
 */
export async function executeIntelligentWorkflow(
  context: IntelligenceContext,
  nodeExecutor: (stepName: string, ctx: GraphContext) => Promise<GraphResult>
): Promise<GraphContext | null> {
  if (!context.enhancedBlueprint && !context.blueprint) return null;

  const blueprint = context.enhancedBlueprint || context.blueprint;
  if (!blueprint) return null;

  const flows = blueprint.requiredFlows || [];
  if (flows.length === 0) return null;

  // Build graph from flows
  const graphId = `graph_${context.projectId}`;
  const graph = buildGraphFromFlows(
    graphId,
    flows,
    nodeExecutor,
    {
      projectId: context.projectId,
      domain: context.domain,
      blueprint: context.blueprint,
      memory: context.similarProjects,
      knowledge: context.bestPatterns,
    }
  );

  // Store graphId in context
  context.graphId = graphId;

  // Execute the graph
  const result = await runGraph(graphId);

  // Log graph execution summary
  const summary = getGraphSummary(graphId);
  if (summary) {
    console.log(
      `[AIL] Graph executed: ${summary.completed}/${summary.totalNodes} nodes, ` +
      `${summary.duration}ms`
    );
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// POST-GENERATION: STORE & LEARN
// ═══════════════════════════════════════════════════════════

/**
 * Store generation results in memory and update knowledge graph.
 * Called after every generation completes.
 */
export async function storeGenerationResults(params: {
  projectId: string;
  prompt: string;
  domain: string;
  files: Array<{ path: string; content: string; type: string }>;
  qualityScore: number;
  buildSuccess: boolean;
  agentCount: number;
  blueprintId?: string;
  graphId?: string;
}): Promise<{ memoriesStored: number; knowledgeEdges: number }> {
  let memoriesStored = 0;
  let knowledgeEdges = 0;

  // 1. Store project in memory
  await storeProjectMemory({
    projectId: params.projectId,
    prompt: params.prompt,
    domain: params.domain,
    files: params.files.map((f) => ({ path: f.path, type: f.type })),
    qualityScore: params.qualityScore,
    buildSuccess: params.buildSuccess,
    agentCount: params.agentCount,
  });
  memoriesStored++;

  // 2. Store top components in memory
  const components = params.files.filter((f) => f.type === "component");
  for (const comp of components.slice(0, 10)) {
    await storeComponentMemory({
      componentId: `${params.projectId}_${comp.path}`,
      name: comp.path.split("/").pop()?.replace(/\.tsx?$/, "") || "unknown",
      domain: params.domain,
      filePath: comp.path,
      content: comp.content,
      qualityScore: params.qualityScore,
    });
    memoriesStored++;
  }

  // 3. Store blueprint in memory
  if (params.blueprintId) {
    const blueprint = detectBlueprint(params.prompt);
    if (blueprint) {
      await storeBlueprintMemory({
        blueprintId: params.blueprintId,
        domain: params.domain,
        name: blueprint.name,
        requiredComponents: blueprint.requiredComponents.map((c) => c.name),
        requiredPages: blueprint.requiredPages.map((p) => p.name),
        qualityScore: params.qualityScore,
      });
      memoriesStored++;
    }
  }

  // 4. Learn from generation (updates knowledge graph)
  const componentNames = components.map(
    (c) => c.path.split("/").pop()?.replace(/\.tsx?$/, "") || "unknown"
  );

  const edges = learnFromGeneration({
    domain: params.domain,
    blueprintId: params.blueprintId || `bp_${params.projectId}`,
    componentNames,
    qualityScore: params.qualityScore,
    buildSuccess: params.buildSuccess,
  });
  knowledgeEdges = edges.length;

  // 5. Record success/failure in knowledge graph
  if (params.buildSuccess && params.qualityScore > 0.7) {
    recordSuccess({
      blueprintId: params.blueprintId || `bp_${params.projectId}`,
      componentIds: componentNames.map((n) => `comp_${n}`),
      workflowIds: [],
      agentIds: [],
      qualityScore: params.qualityScore,
    });
  } else if (!params.buildSuccess) {
    recordFailure({
      blueprintId: params.blueprintId || `bp_${params.projectId}`,
      errorType: params.qualityScore < 0.3 ? "low-quality" : "build-failure",
    });
  }

  // 6. Emit memory stats to SSE
  const memStats = getMemoryStats();
  const knowledgeStats = getKnowledgeStats();
  emit({
    type: "METRIC_UPDATE",
    payload: {
      key: "intelligenceMemorySize",
      value: memStats.total,
    },
    source: "system",
  });
  emit({
    type: "METRIC_UPDATE",
    payload: {
      key: "intelligenceKnowledgeEdges",
      value: knowledgeStats.edges,
    },
    source: "system",
  });

  console.log(
    `[AIL] Stored ${memoriesStored} memories, ${knowledgeEdges} knowledge edges. ` +
    `Memory: ${memStats.total} total. Knowledge: ${knowledgeStats.edges} edges.`
  );

  return { memoriesStored, knowledgeEdges };
}

// ═══════════════════════════════════════════════════════════
// COMPONENT SELECTION INTELLIGENCE
// ═══════════════════════════════════════════════════════════

/**
 * Get intelligent component selection probability.
 * Used to determine which components to generate.
 */
export function getComponentSelectionScore(
  componentName: string,
  domain: string
): {
  probability: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let probability = getComponentProbability(`comp_${componentName}`);

  // Boost for domain-specific components
  const patternId = `pattern_${domain}`;
  const edges = queryRelations(patternId);
  const improvesEdge = edges.find(
    (e) => e.from === `comp_${componentName}` && e.relation === "improves"
  );
  if (improvesEdge) {
    probability += improvesEdge.weight * 0.1;
    reasons.push(`Improves ${domain} pattern (+${(improvesEdge.weight * 10).toFixed(0)}%)`);
  }

  const failureEdge = edges.find(
    (e) => e.from === `comp_${componentName}` && e.relation === "causes-failure"
  );
  if (failureEdge) {
    probability -= failureEdge.weight * 0.2;
    reasons.push(`Causes failure in ${domain} (-${(failureEdge.weight * 20).toFixed(0)}%)`);
  }

  probability = Math.max(0.05, Math.min(0.95, probability));

  if (reasons.length === 0) {
    reasons.push("No knowledge graph data — using base probability");
  }

  return { probability, reasons };
}

// ═══════════════════════════════════════════════════════════
// INTELLIGENCE REPORT
// ═══════════════════════════════════════════════════════════

export function getIntelligenceReport(): {
  memory: ReturnType<typeof getMemoryStats>;
  knowledge: ReturnType<typeof getKnowledgeStats>;
  activeGraphs: number;
} {
  return {
    memory: getMemoryStats(),
    knowledge: getKnowledgeStats(),
    activeGraphs: getActiveWorkflows().length,
  };
}

/**
 * Reset all intelligence data (for testing).
 */
export function resetIntelligence(): void {
  clearGraphs();
  clearKnowledge();
  // Note: vector memory is not cleared to preserve learning
}
