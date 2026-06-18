/**
 * MODULE 2: Graph Execution Engine
 *
 * LangGraph-like execution engine for workflows.
 * Supports branching, retry, rollback, and dynamic decision nodes.
 *
 * Every workflow runs as a graph, not a linear pipeline.
 * Agents are callable nodes. Failures trigger retry or fallback.
 * Decisions branch execution dynamically.
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type NodeType = "agent" | "workflow" | "state" | "decision";
export type NodeStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "rolled-back";

export interface GraphNode {
  id: string;
  type: NodeType;
  execute: (context: GraphContext) => Promise<GraphResult>;
  next?: string[];
  fallback?: string;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphResult {
  success: boolean;
  data?: unknown;
  error?: string;
  branchTo?: string;
}

export interface GraphContext {
  projectId: string;
  domain: string;
  blueprint?: unknown;
  memory?: unknown[];
  knowledge?: unknown[];
  previousResults: Record<string, GraphResult>;
  state: Record<string, unknown>;
  attempt: number;
}

export interface GraphState {
  id: string;
  nodes: Map<string, GraphNode>;
  status: NodeStatus[];
  currentNodeId: string | null;
  context: GraphContext;
  history: GraphHistoryEntry[];
  startedAt: number;
  completedAt: number | null;
}

export interface GraphHistoryEntry {
  nodeId: string;
  status: NodeStatus;
  result?: GraphResult;
  timestamp: number;
  attempt: number;
}

// ═══════════════════════════════════════════════════════════
// GRAPH STORE
// ═══════════════════════════════════════════════════════════

const _graphs: Map<string, GraphState> = new Map();
const _nodeRegistry: Map<string, GraphNode> = new Map();

export function registerNode(node: GraphNode): void {
  _nodeRegistry.set(node.id, node);
}

export function getNode(nodeId: string): GraphNode | undefined {
  return _nodeRegistry.get(nodeId);
}

export function getGraph(graphId: string): GraphState | undefined {
  return _graphs.get(graphId);
}

export function clearGraphs(): void {
  _graphs.clear();
}

// ═══════════════════════════════════════════════════════════
// GRAPH BUILDING
// ═══════════════════════════════════════════════════════════

/**
 * Build a graph from an array of nodes.
 */
export function buildGraph(
  graphId: string,
  nodes: GraphNode[],
  context: Omit<GraphContext, "previousResults" | "state" | "attempt">
): GraphState {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
    _nodeRegistry.set(node.id, node);
  }

  const state: GraphState = {
    id: graphId,
    nodes: nodeMap,
    status: [],
    currentNodeId: null,
    context: {
      ...context,
      previousResults: {},
      state: {},
      attempt: 0,
    },
    history: [],
    startedAt: 0,
    completedAt: null,
  };

  _graphs.set(graphId, state);
  return state;
}

/**
 * Build a graph from blueprint flows (SSE workflow format).
 */
export function buildGraphFromFlows(
  graphId: string,
  flows: string[],
  nodeExecutor: (stepName: string, context: GraphContext) => Promise<GraphResult>,
  context: Omit<GraphContext, "previousResults" | "state" | "attempt">
): GraphState {
  const nodes: GraphNode[] = [];

  for (let i = 0; i < flows.length; i++) {
    const flow = flows[i];
    const steps = flow.split("→").map((s) => s.trim()).filter((s) => s.length > 0);

    for (let j = 0; j < steps.length; j++) {
      const step = steps[j];
      const nodeId = `node_${i}_${j}`;
      const nextNodeId = j < steps.length - 1 ? `node_${i}_${j + 1}` : undefined;

      nodes.push({
        id: nodeId,
        type: "workflow",
        execute: async (ctx) => nodeExecutor(step, ctx),
        next: nextNodeId ? [nextNodeId] : [],
        metadata: { flow: flow, step: step, stepIndex: j },
      });
    }
  }

  return buildGraph(graphId, nodes, context);
}

// ═══════════════════════════════════════════════════════════
// GRAPH EXECUTION
// ═══════════════════════════════════════════════════════════

/**
 * Run the graph starting from a node ID.
 * Executes nodes in sequence, handles branching, retry, and rollback.
 */
export async function runGraph(
  graphId: string,
  startNodeId?: string
): Promise<GraphContext> {
  const graph = _graphs.get(graphId);
  if (!graph) throw new Error(`Graph ${graphId} not found`);

  graph.startedAt = graph.startedAt || Date.now();
  graph.context.attempt++;

  // Find start node
  const startNode = startNodeId
    ? graph.nodes.get(startNodeId)
    : findStartNode(graph);

  if (!startNode) {
    throw new Error(`No start node found in graph ${graphId}`);
  }

  let currentNode: GraphNode | undefined = startNode;
  const visited = new Set<string>();

  while (currentNode) {
    // Prevent infinite loops
    if (visited.has(currentNode.id)) break;
    visited.add(currentNode.id);

    graph.currentNodeId = currentNode.id;

    // Execute with retry
    const result = await executeWithRetry(graph, currentNode);

    // Record in history
    graph.history.push({
      nodeId: currentNode.id,
      status: result.success ? "completed" : "failed",
      result,
      timestamp: Date.now(),
      attempt: graph.context.attempt,
    });

    graph.context.previousResults[currentNode.id] = result;

    if (!result.success && !currentNode.fallback) {
      // Node failed and no fallback — graph stops
      break;
    }

    // Determine next node
    const nextNodeId = determineNextNode(currentNode, result);
    if (!nextNodeId) break;

    currentNode = graph.nodes.get(nextNodeId);
  }

  graph.completedAt = Date.now();
  return graph.context;
}

/**
 * Execute a single node with retry logic.
 */
async function executeWithRetry(
  graph: GraphState,
  node: GraphNode
): Promise<GraphResult> {
  const maxRetries = node.maxRetries ?? 0;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    graph.context.attempt = attempt;

    try {
      const result = await node.execute(graph.context);
      if (result.success) return result;
      lastError = result.error || "Node execution returned failure";
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    // If we have a fallback and this is the last attempt, use fallback
    if (attempt === maxRetries && node.fallback) {
      const fallbackNode = graph.nodes.get(node.fallback);
      if (fallbackNode) {
        return executeWithRetry(graph, fallbackNode);
      }
    }
  }

  return { success: false, error: lastError };
}

/**
 * Determine the next node to execute.
 */
function determineNextNode(node: GraphNode, result: GraphResult): string | null {
  // Decision node branches based on result
  if (node.type === "decision" && result.branchTo) {
    return result.branchTo;
  }

  // Normal flow — go to next node
  if (node.next && node.next.length > 0) {
    return node.next[0];
  }

  return null;
}

/**
 * Find the start node (first node with no incoming edges).
 */
function findStartNode(graph: GraphState): GraphNode | undefined {
  const hasIncoming = new Set<string>();

  for (const node of graph.nodes.values()) {
    if (node.next) {
      for (const nextId of node.next) {
        hasIncoming.add(nextId);
      }
    }
  }

  for (const node of graph.nodes.values()) {
    if (!hasIncoming.has(node.id)) {
      return node;
    }
  }

  // Fallback: return first node
  return graph.nodes.values().next().value;
}

// ═══════════════════════════════════════════════════════════
// BRANCHING, ROLLBACK
// ═══════════════════════════════════════════════════════════

/**
 * Branch execution from a node based on a condition.
 * Returns the node ID to branch to.
 */
export function branch(
  graphId: string,
  nodeId: string,
  condition: boolean,
  trueBranch: string,
  falseBranch: string
): string {
  const graph = _graphs.get(graphId);
  if (!graph) throw new Error(`Graph ${graphId} not found`);

  const node = graph.nodes.get(nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found in graph`);

  node.type = "decision";
  const originalExecute = node.execute;
  node.execute = async (ctx) => {
    const result = await originalExecute(ctx);
    return { ...result, branchTo: condition ? trueBranch : falseBranch };
  };

  return condition ? trueBranch : falseBranch;
}

/**
 * Rollback the graph to a specific node.
 * Marks all nodes after it as "rolled-back".
 */
export function rollback(
  graphId: string,
  toNodeId: string
): void {
  const graph = _graphs.get(graphId);
  if (!graph) throw new Error(`Graph ${graphId} not found`);

  // Mark all history entries after the target as rolled back
  let found = false;
  for (let i = graph.history.length - 1; i >= 0; i--) {
    if (graph.history[i].nodeId === toNodeId) {
      found = true;
      break;
    }
    graph.history[i].status = "rolled-back";
  }

  if (!found) {
    throw new Error(`Node ${toNodeId} not found in graph history`);
  }

  // Reset current node
  graph.currentNodeId = toNodeId;

  // Remove rolled-back results from context
  const rolledBack = graph.history.filter((h) => h.status === "rolled-back");
  for (const entry of rolledBack) {
    delete graph.context.previousResults[entry.nodeId];
  }
}

// ═══════════════════════════════════════════════════════════
// GRAPH ANALYTICS
// ═══════════════════════════════════════════════════════════

/**
 * Get execution summary for a graph.
 */
export function getGraphSummary(graphId: string): {
  totalNodes: number;
  completed: number;
  failed: number;
  rolledBack: number;
  duration: number;
} | null {
  const graph = _graphs.get(graphId);
  if (!graph) return null;

  const completed = graph.history.filter((h) => h.status === "completed").length;
  const failed = graph.history.filter((h) => h.status === "failed").length;
  const rolledBack = graph.history.filter((h) => h.status === "rolled-back").length;
  const duration = (graph.completedAt || Date.now()) - graph.startedAt;

  return {
    totalNodes: graph.nodes.size,
    completed,
    failed,
    rolledBack,
    duration,
  };
}
