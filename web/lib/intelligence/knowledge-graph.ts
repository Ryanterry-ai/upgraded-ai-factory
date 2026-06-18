/**
 * MODULE 3: Knowledge Graph Layer
 *
 * Stores relationships between blueprints, workflows, components,
 * agent behaviors, and success/failure patterns.
 *
 * Every successful generation updates the graph.
 * Every failed workflow creates a negative edge.
 * The system learns patterns over time.
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type RelationType =
  | "improves"
  | "breaks"
  | "depends-on"
  | "replaces"
  | "causes-failure"
  | "enhances"
  | "conflicts-with"
  | "succeeds-with";

export interface KnowledgeEdge {
  from: string;
  to: string;
  relation: RelationType;
  weight: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface KnowledgeNode {
  id: string;
  type: "blueprint" | "component" | "workflow" | "agent" | "pattern";
  label: string;
  metadata: Record<string, unknown>;
}

export interface PatternScore {
  patternId: string;
  score: number;
  reasons: string[];
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE STORE
// ═══════════════════════════════════════════════════════════

const _nodes: Map<string, KnowledgeNode> = new Map();
const _edges: KnowledgeEdge[] = [];
const _edgeIndex: Map<string, KnowledgeEdge[]> = new Map(); // nodeId → edges from that node

export function getKnowledgeStats(): {
  nodes: number;
  edges: number;
  byRelation: Record<RelationType, number>;
} {
  const byRelation: Record<RelationType, number> = {
    improves: 0,
    breaks: 0,
    "depends-on": 0,
    replaces: 0,
    "causes-failure": 0,
    enhances: 0,
    "conflicts-with": 0,
    "succeeds-with": 0,
  };

  for (const edge of _edges) {
    byRelation[edge.relation]++;
  }

  return { nodes: _nodes.size, edges: _edges.length, byRelation };
}

export function clearKnowledge(): void {
  _nodes.clear();
  _edges.length = 0;
  _edgeIndex.clear();
}

// ═══════════════════════════════════════════════════════════
// NODE OPERATIONS
// ═══════════════════════════════════════════════════════════

export function addNode(node: KnowledgeNode): void {
  _nodes.set(node.id, node);
}

export function getNode(nodeId: string): KnowledgeNode | undefined {
  return _nodes.get(nodeId);
}

export function getNodesByType(type: KnowledgeNode["type"]): KnowledgeNode[] {
  return Array.from(_nodes.values()).filter((n) => n.type === type);
}

// ═══════════════════════════════════════════════════════════
// EDGE OPERATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Add a relationship edge to the knowledge graph.
 * Normalizes weights to [0, 1] range.
 */
export function addRelation(edge: Omit<KnowledgeEdge, "timestamp">): void {
  const normalizedWeight = Math.max(0, Math.min(1, edge.weight));

  const fullEdge: KnowledgeEdge = {
    ...edge,
    weight: normalizedWeight,
    timestamp: Date.now(),
  };

  _edges.push(fullEdge);

  // Update index
  const existing = _edgeIndex.get(edge.from) || [];
  existing.push(fullEdge);
  _edgeIndex.set(edge.from, existing);
}

/**
 * Query all edges from/to a specific node.
 */
export function queryRelations(nodeId: string): KnowledgeEdge[] {
  const outgoing = _edgeIndex.get(nodeId) || [];
  const incoming = _edges.filter((e) => e.to === nodeId);
  return [...outgoing, ...incoming];
}

/**
 * Query edges by relation type.
 */
export function queryByRelation(relation: RelationType): KnowledgeEdge[] {
  return _edges.filter((e) => e.relation === relation);
}

/**
 * Get the best patterns for a domain based on the knowledge graph.
 * Returns patterns with highest positive scores.
 */
export function getBestPatterns(domain: string): PatternScore[] {
  const patternNodes = getNodesByType("pattern");
  const scores: PatternScore[] = [];

  for (const pattern of patternNodes) {
    if (pattern.metadata.domain !== domain) continue;

    const edges = queryRelations(pattern.id);
    let score = 0.5; // Base score
    const reasons: string[] = [];

    for (const edge of edges) {
      switch (edge.relation) {
        case "improves":
          score += edge.weight * 0.2;
          reasons.push(`Improves ${edge.to} (+${(edge.weight * 20).toFixed(0)}%)`);
          break;
        case "enhances":
          score += edge.weight * 0.15;
          reasons.push(`Enhances ${edge.to} (+${(edge.weight * 15).toFixed(0)}%)`);
          break;
        case "succeeds-with":
          score += edge.weight * 0.1;
          reasons.push(`Succeeds with ${edge.to} (+${(edge.weight * 10).toFixed(0)}%)`);
          break;
        case "causes-failure":
          score -= edge.weight * 0.3;
          reasons.push(`Causes failure with ${edge.to} (-${(edge.weight * 30).toFixed(0)}%)`);
          break;
        case "breaks":
          score -= edge.weight * 0.25;
          reasons.push(`Breaks ${edge.to} (-${(edge.weight * 25).toFixed(0)}%)`);
          break;
        case "conflicts-with":
          score -= edge.weight * 0.15;
          reasons.push(`Conflicts with ${edge.to} (-${(edge.weight * 15).toFixed(0)}%)`);
          break;
      }
    }

    score = Math.max(0, Math.min(1, score));

    scores.push({
      patternId: pattern.id,
      score,
      reasons,
    });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/**
 * Record a successful generation — creates positive edges.
 */
export function recordSuccess(params: {
  blueprintId: string;
  componentIds: string[];
  workflowIds: string[];
  agentIds: string[];
  qualityScore: number;
}): void {
  const weight = Math.min(1, params.qualityScore);

  // Blueprint improves components
  for (const compId of params.componentIds) {
    addRelation({
      from: params.blueprintId,
      to: compId,
      relation: "improves",
      weight,
    });
  }

  // Blueprint succeeds with workflow
  for (const wfId of params.workflowIds) {
    addRelation({
      from: params.blueprintId,
      to: wfId,
      relation: "succeeds-with",
      weight,
    });
  }

  // Components enhance each other (if they're in the same project)
  for (let i = 0; i < params.componentIds.length; i++) {
    for (let j = i + 1; j < params.componentIds.length; j++) {
      addRelation({
        from: params.componentIds[i],
        to: params.componentIds[j],
        relation: "enhances",
        weight: weight * 0.5,
      });
    }
  }

  // Agent succeeds with blueprint
  for (const agentId of params.agentIds) {
    addRelation({
      from: agentId,
      to: params.blueprintId,
      relation: "succeeds-with",
      weight,
    });
  }
}

/**
 * Record a failure — creates negative edges.
 */
export function recordFailure(params: {
  blueprintId?: string;
  componentId?: string;
  workflowId?: string;
  agentId?: string;
  errorType: string;
}): void {
  if (params.blueprintId && params.componentId) {
    addRelation({
      from: params.blueprintId,
      to: params.componentId,
      relation: "causes-failure",
      weight: 0.8,
      metadata: { error: params.errorType },
    });
  }

  if (params.workflowId && params.agentId) {
    addRelation({
      from: params.agentId,
      to: params.workflowId,
      relation: "breaks",
      weight: 0.7,
      metadata: { error: params.errorType },
    });
  }
}

/**
 * Record a component replacement (new component replaces old).
 */
export function recordReplacement(
  oldComponentId: string,
  newComponentId: string,
  improvementScore: number
): void {
  addRelation({
    from: newComponentId,
    to: oldComponentId,
    relation: "replaces",
    weight: Math.min(1, improvementScore),
  });
}

/**
 * Learn from generation: auto-create edges based on quality.
 */
export function learnFromGeneration(params: {
  domain: string;
  blueprintId: string;
  componentNames: string[];
  qualityScore: number;
  buildSuccess: boolean;
}): string[] {
  const createdEdges: string[] = [];

  // Create/update pattern node for this domain
  const patternId = `pattern_${params.domain}`;
  if (!_nodes.has(patternId)) {
    addNode({
      id: patternId,
      type: "pattern",
      label: `${params.domain} pattern`,
      metadata: {
        domain: params.domain,
        usageCount: 0,
        avgQuality: 0,
      },
    });
  }

  const pattern = _nodes.get(patternId)!;
  const usageCount = (pattern.metadata.usageCount as number) || 0;
  const avgQuality = (pattern.metadata.avgQuality as number) || 0;
  pattern.metadata.usageCount = usageCount + 1;
  pattern.metadata.avgQuality =
    (avgQuality * usageCount + params.qualityScore) / (usageCount + 1);

  // Blueprint depends-on pattern
  addRelation({
    from: params.blueprintId,
    to: patternId,
    relation: "depends-on",
    weight: 0.5,
  });
  createdEdges.push(`${params.blueprintId} -> depends-on -> ${patternId}`);

  // If successful, components improve pattern
  if (params.buildSuccess && params.qualityScore > 0.7) {
    for (const compName of params.componentNames.slice(0, 5)) {
      const compId = `comp_${compName}`;
      addRelation({
        from: compId,
        to: patternId,
        relation: "improves",
        weight: params.qualityScore,
      });
      createdEdges.push(`${compId} -> improves -> ${patternId}`);
    }
  }

  // If failed, pattern causes failure
  if (!params.buildSuccess) {
    addRelation({
      from: params.blueprintId,
      to: patternId,
      relation: "causes-failure",
      weight: 0.6,
      metadata: { qualityScore: params.qualityScore },
    });
    createdEdges.push(`${params.blueprintId} -> causes-failure -> ${patternId}`);
  }

  return createdEdges;
}

/**
 * Get component selection probability based on knowledge graph.
 * Components with negative edges have lower probability.
 */
export function getComponentProbability(componentId: string): number {
  const edges = queryRelations(componentId);
  let probability = 0.5; // Base probability

  for (const edge of edges) {
    if (edge.to === componentId) {
      // Incoming edges
      switch (edge.relation) {
        case "improves":
        case "enhances":
          probability += edge.weight * 0.1;
          break;
        case "causes-failure":
        case "breaks":
          probability -= edge.weight * 0.2;
          break;
      }
    }
  }

  return Math.max(0.05, Math.min(0.95, probability));
}
