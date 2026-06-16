// Phase 7: Runtime Core - LangGraph-style Agent Execution

import { EventEmitter } from 'events';
import {
  AgentState,
  AgentStatus,
  AgentArtifact,
  WorkflowNode,
  ExecutionStep,
  RuntimeConfig,
  DEFAULT_RUNTIME_CONFIG,
  createInitialState,
  createExecutionStep,
  createFailureRecord
} from './state/agent-state.js';
import {
  AgentDefinition,
  getAgentById,
  getWorkflowNodes,
  ALL_AGENTS
} from './agents/agent-definitions.js';
import { InMemoryMessageBus, createTaskAssignment, createTaskComplete, createTaskFailed } from './communication/message-schema.js';
import { validateArtifact, createArtifact } from './communication/artifact-schema.js';

export interface RuntimeEvent {
  type: string;
  agentId: string;
  timestamp: string;
  data: unknown;
}

export interface RuntimeResult {
  success: boolean;
  artifacts: AgentArtifact[];
  errors: string[];
  duration: number;
  agentStates: Map<string, AgentState>;
}

class AgentRuntime extends EventEmitter {
  private config: RuntimeConfig;
  private states: Map<string, AgentState> = new Map();
  private messageBus: InMemoryMessageBus;
  private artifacts: Map<string, AgentArtifact> = new Map();
  private events: RuntimeEvent[] = [];
  private running: boolean = false;
  private factoryType: string;
  private workflowNodes: WorkflowNode[];

  constructor(factoryType: string, config: Partial<RuntimeConfig> = {}) {
    super();
    this.config = { ...DEFAULT_RUNTIME_CONFIG, ...config };
    this.factoryType = factoryType;
    this.workflowNodes = getWorkflowNodes(factoryType);
    this.messageBus = new InMemoryMessageBus();
  }

  async execute(input: Record<string, unknown>): Promise<RuntimeResult> {
    const startTime = Date.now();
    this.running = true;
    const errors: string[] = [];

    this.emit('runtime:start', { factoryType: this.factoryType, input });

    try {
      const startNode = this.workflowNodes.find(n => n.type === 'start');
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      await this.executeNode(startNode, input);

      const duration = Date.now() - startTime;
      const artifacts = Array.from(this.artifacts.values());

      this.emit('runtime:complete', { duration, artifacts: artifacts.length });

      return {
        success: true,
        artifacts,
        errors,
        duration,
        agentStates: this.states
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);

      this.emit('runtime:error', { error: errorMsg });

      return {
        success: false,
        artifacts: Array.from(this.artifacts.values()),
        errors,
        duration,
        agentStates: this.states
      };
    } finally {
      this.running = false;
    }
  }

  private async executeNode(node: WorkflowNode, context: Record<string, unknown>): Promise<void> {
    const agentDef = getAgentById(node.agentId);
    if (!agentDef) {
      throw new Error(`Agent not found: ${node.agentId}`);
    }

    const state = createInitialState(node.agentId, agentDef.department, agentDef.name);
    state.status = 'running';
    state.currentStep = node.id;
    this.states.set(node.agentId, state);

    this.emit('node:start', { nodeId: node.id, agentId: node.agentId });

    try {
      const step = createExecutionStep(node.agentId, `execute_${node.id}`);
      state.executionHistory.push(step);

      const artifacts = await this.executeAgent(agentDef, context, node);

      for (const artifact of artifacts) {
        this.artifacts.set(artifact.id, artifact);
        state.artifacts.push(artifact);

        const validation = validateArtifact(artifact);
        if (!validation.valid) {
          artifact.validationErrors = validation.errors;
          artifact.status = 'rejected';
        } else {
          artifact.status = 'validated';
        }
      }

      state.status = 'completed';
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.output = { artifacts: artifacts.map(a => a.id) };

      this.emit('node:complete', { nodeId: node.id, agentId: node.agentId, artifacts: artifacts.length });

      for (const edge of node.edges.sort((a, b) => a.priority - b.priority)) {
        const nextNode = this.workflowNodes.find(n => n.id === edge.target);
        if (nextNode) {
          const nextContext = {
            ...context,
            artifacts: Array.from(this.artifacts.values()),
            currentNode: node.id
          };
          await this.executeNode(nextNode, nextContext);
        }
      }
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : String(error);

      const failure = createFailureRecord(
        node.agentId,
        'runtime_error',
        state.error
      );

      this.emit('node:error', { nodeId: node.id, agentId: node.agentId, error: state.error });

      if (this.config.enableRecovery) {
        const recovered = await this.attemptRecovery(node, failure);
        if (recovered) {
          state.status = 'retrying';
          await this.executeNode(node, context);
        }
      }
    }
  }

  private async executeAgent(
    agentDef: AgentDefinition,
    context: Record<string, unknown>,
    node: WorkflowNode
  ): Promise<AgentArtifact[]> {
    const artifacts: AgentArtifact[] = [];

    const existingArtifacts = (context.artifacts as AgentArtifact[]) || [];
    const requiredArtifacts = existingArtifacts.filter(a =>
      node.config.requiredArtifacts.includes(a.type)
    );

    for (const artifactType of agentDef.outputTypes) {
      if (node.config.requiredArtifacts.includes(artifactType) || 
          agentDef.outputTypes.indexOf(artifactType) < 2) {
        const artifact = createArtifact(
          `${node.id}-${artifactType}-${Date.now()}`,
          artifactType,
          `${agentDef.name}_${artifactType}`,
          this.generateArtifactContent(agentDef, artifactType, context),
          {
            factory: this.factoryType,
            version: '1.0.0',
            dependencies: agentDef.dependencies,
            exports: [`${agentDef.name}_${artifactType}`],
            imports: []
          }
        );
        artifacts.push(artifact);
      }
    }

    return artifacts;
  }

  private generateArtifactContent(
    agentDef: AgentDefinition,
    artifactType: string,
    context: Record<string, unknown>
  ): unknown {
    const requirements = context.requirements || {};

    switch (artifactType) {
      case 'blueprint':
        return {
          name: (requirements as Record<string, unknown>).name || 'Project',
          type: this.factoryType,
          version: '1.0.0',
          factories: [this.factoryType],
          agents: agentDef.department,
          capabilities: agentDef.capabilities
        };
      case 'component':
        return {
          name: `${agentDef.name}Component`,
          type: 'functional',
          props: {},
          exports: ['default']
        };
      case 'page':
        return {
          path: '/',
          components: [`${agentDef.name}Component`],
          layout: 'default'
        };
      case 'config':
        return {
          filename: 'config.mjs',
          content: `export default ${JSON.stringify({ enabled: true }, null, 2)};`
        };
      case 'schema':
        return {
          name: `${agentDef.name}Schema`,
          fields: [],
          indexes: []
        };
      case 'test':
        return {
          name: `${agentDef.name}Test`,
          type: 'unit',
          tests: []
        };
      case 'documentation':
        return {
          title: `${agentDef.name} Documentation`,
          content: `Documentation for ${agentDef.name}`,
          sections: []
        };
      case 'security_config':
        return {
          authentication: { enabled: true },
          authorization: { enabled: true },
          encryption: { enabled: true }
        };
      case 'database_schema':
        return {
          tables: [],
          indexes: [],
          relations: []
        };
      case 'deployment_config':
        return {
          provider: 'vercel',
          region: 'auto',
          scaling: 'automatic'
        };
      case 'performance_config':
        return {
          caching: { enabled: true },
          optimization: { enabled: true },
          monitoring: { enabled: true }
        };
      default:
        return { type: artifactType, content: {} };
    }
  }

  private async attemptRecovery(node: WorkflowNode, failure: ReturnType<typeof createFailureRecord>): Promise<boolean> {
    const agentDef = getAgentById(node.agentId);
    if (!agentDef) return false;

    const handler = agentDef.failureHandlers.find(h => h.failureType === failure.failureType);
    if (!handler) return false;

    this.emit('recovery:start', { nodeId: node.id, agentId: node.agentId, strategy: handler.strategy });

    switch (handler.strategy) {
      case 'auto_fix':
        return await this.autoFix(node, failure);
      case 'retry_with_context':
        return failure.recoveryAttempted ? false : true;
      case 'fallback_agent':
        return await this.fallbackToAgent(node, handler.fallbackAgent);
      case 'skip_artifact':
        return true;
      case 'fail_gracefully':
        return false;
      case 'human_escalation':
        return false;
      default:
        return false;
    }
  }

  private async autoFix(node: WorkflowNode, failure: ReturnType<typeof createFailureRecord>): Promise<boolean> {
    this.emit('recovery:auto_fix', { nodeId: node.id, failure: failure.failureType });
    return true;
  }

  private async fallbackToAgent(node: WorkflowNode, fallbackAgentId?: string): Promise<boolean> {
    if (!fallbackAgentId) return false;

    const fallbackDef = getAgentById(fallbackAgentId);
    if (!fallbackDef) return false;

    this.emit('recovery:fallback', { nodeId: node.id, fallbackAgent: fallbackAgentId });
    return true;
  }

  getStates(): Map<string, AgentState> {
    return this.states;
  }

  getArtifacts(): AgentArtifact[] {
    return Array.from(this.artifacts.values());
  }

  getEvents(): RuntimeEvent[] {
    return this.events;
  }

  getMessageStats() {
    return this.messageBus.getStats();
  }

  isRunning(): boolean {
    return this.running;
  }

  getConfig(): RuntimeConfig {
    return this.config;
  }
}

export { AgentRuntime };
export type { AgentArtifact };

export function createRuntime(factoryType: string, config?: Partial<RuntimeConfig>): AgentRuntime {
  return new AgentRuntime(factoryType, config);
}

export async function executeWorkflow(
  factoryType: string,
  input: Record<string, unknown>,
  config?: Partial<RuntimeConfig>
): Promise<RuntimeResult> {
  const runtime = createRuntime(factoryType, config);
  return runtime.execute(input);
}
