// Phase 7.5: Agent Executor

import { EventEmitter } from 'events';
import { AgentDefinition, getAgentById, getWorkflowNodes } from '../agents/agent-definitions.js';
import { AgentState, AgentArtifact, RuntimeConfig, DEFAULT_RUNTIME_CONFIG, createInitialState, createExecutionStep, createFailureRecord } from '../state/agent-state.js';
import { LLMClient, LLMMessage, createLLMClientFromEnv } from '../llm/llm-client.js';
import { PromptBuilder, createPromptBuilder } from '../prompts/prompt-builder.js';
import { ContextBuilder, createContextBuilder, AgentContext } from '../context/context-builder.js';
import { RuntimeMemory, createRuntimeMemory } from '../memory/runtime-memory.js';
import { InMemoryRetriever, ArtifactRetriever, createMemoryRetriever, createArtifactRetriever } from '../memory/memory-retrieval.js';
import { ArtifactInjector, createArtifactInjector } from './artifact-injection.js';
import { RecoverySystem, createRecoverySystem } from '../recovery/recovery-system.js';
import { ReviewSystem, createReviewSystem } from '../review/review-system.js';

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  artifacts: AgentArtifact[];
  output: string;
  error?: string;
  duration: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface WorkflowExecutionResult {
  success: boolean;
  factoryType: string;
  results: AgentExecutionResult[];
  artifacts: AgentArtifact[];
  totalDuration: number;
  totalTokens: number;
  errors: string[];
}

export interface AgentExecutorConfig extends Partial<RuntimeConfig> {
  provider?: 'openai' | 'anthropic' | 'openrouter';
  llmProvider?: 'openai' | 'anthropic' | 'openrouter';
  model?: string;
  llmModel?: string;
  maxRetries?: number;
  timeout?: number;
}

class AgentExecutor extends EventEmitter {
  private config: RuntimeConfig;
  private llmClient: LLMClient;
  private promptBuilder: PromptBuilder;
  private contextBuilder: ContextBuilder;
  private memory: RuntimeMemory;
  private memoryRetriever: InMemoryRetriever;
  private artifactRetriever: ArtifactRetriever;
  private artifactInjector: ArtifactInjector;
  private recovery: RecoverySystem;
  private review: ReviewSystem;
  private agentStates: Map<string, AgentState> = new Map();
  private allArtifacts: AgentArtifact[] = [];
  private previousOutputs: Record<string, string> = {};

  constructor(config: AgentExecutorConfig = {}) {
    super();
    this.config = { ...DEFAULT_RUNTIME_CONFIG, ...config };

    const provider = config.provider || config.llmProvider;
    this.llmClient = createLLMClientFromEnv(provider);
    this.promptBuilder = createPromptBuilder();
    this.contextBuilder = createContextBuilder();
    this.memory = createRuntimeMemory();
    this.memoryRetriever = createMemoryRetriever(this.memory);
    this.artifactRetriever = createArtifactRetriever();
    this.artifactInjector = createArtifactInjector();
    this.recovery = createRecoverySystem();
    this.review = createReviewSystem();
  }

  async executeWorkflow(
    factoryType: string,
    input: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const results: AgentExecutionResult[] = [];
    const errors: string[] = [];
    let totalTokens = 0;

    this.emit('workflow:start', { factoryType, input });

    const workflow = getWorkflowNodes(factoryType);

    for (const node of workflow) {
      if (node.type === 'start' || node.type === 'end') {
        continue;
      }

      const agentDef = getAgentById(node.agentId);
      if (!agentDef) {
        errors.push(`Agent not found: ${node.agentId}`);
        continue;
      }

      this.emit('agent:start', { agentId: agentDef.id, agentName: agentDef.name });

      try {
        const result = await this.executeAgent(agentDef, factoryType, input);
        results.push(result);
        totalTokens += result.tokenUsage.total;

        if (result.success) {
          this.emit('agent:complete', { agentId: agentDef.id, artifacts: result.artifacts.length });
        } else {
          this.emit('agent:error', { agentId: agentDef.id, error: result.error });
          errors.push(`Agent ${agentDef.name} failed: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Agent ${agentDef.name} error: ${errorMsg}`);
        this.emit('agent:error', { agentId: agentDef.id, error: errorMsg });
      }
    }

    const totalDuration = Date.now() - startTime;

    this.emit('workflow:complete', {
      success: errors.length === 0,
      results: results.length,
      artifacts: this.allArtifacts.length,
      duration: totalDuration
    });

    return {
      success: errors.length === 0,
      factoryType,
      results,
      artifacts: this.allArtifacts,
      totalDuration,
      totalTokens,
      errors
    };
  }

  async executeAgent(
    agentDef: AgentDefinition,
    factoryType: string,
    input: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const state = createInitialState(agentDef.id, agentDef.department, agentDef.name);
    state.status = 'running';
    this.agentStates.set(agentDef.id, state);

    try {
      const step = createExecutionStep(agentDef.id, 'execute');
      state.executionHistory.push(step);

      const context = this.contextBuilder.buildContext(
        agentDef,
        factoryType,
        input,
        this.allArtifacts,
        this.agentStates,
        this.memory
      );

      const relevantArtifacts = this.artifactRetriever.searchArtifacts(agentDef.name);
      for (const artifact of relevantArtifacts) {
        this.artifactInjector.injectArtifacts([artifact], agentDef.outputTypes);
      }

      const promptContext = {
        agent: agentDef,
        factoryType,
        input,
        artifacts: this.allArtifacts,
        memory: this.memory,
        previousOutputs: this.previousOutputs
      };

      const prompt = this.promptBuilder.buildPrompt(promptContext);
      const injectedArtifacts = this.artifactInjector.injectArtifacts(
        this.allArtifacts,
        agentDef.outputTypes
      );
      const artifactContext = this.artifactInjector.formatForInjection(injectedArtifacts);

      const messages: LLMMessage[] = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: `${prompt.context}\n\n${artifactContext}\n\n${prompt.user}` }
      ];

      this.emit('llm:request', { agentId: agentDef.id, messageCount: messages.length });

      const response = await this.llmClient.generate(messages);

      this.emit('llm:response', {
        agentId: agentDef.id,
        tokens: response.usage.totalTokens,
        finishReason: response.finishReason
      });

      const artifacts = this.parseArtifacts(response.content, agentDef, factoryType);

      for (const artifact of artifacts) {
        this.allArtifacts.push(artifact);
        this.artifactRetriever.storeArtifact(artifact);
        state.artifacts.push(artifact);

        this.memoryRetriever.store(
          artifact.type,
          artifact.content,
          0.9,
          `${agentDef.name}_output`
        );
      }

      this.previousOutputs[agentDef.name] = response.content;

      state.status = 'completed';
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.output = { artifacts: artifacts.map(a => a.id) };

      const duration = Date.now() - startTime;

      return {
        agentId: agentDef.id,
        agentName: agentDef.name,
        success: true,
        artifacts,
        output: response.content,
        duration,
        tokenUsage: {
          prompt: response.usage.promptTokens,
          completion: response.usage.completionTokens,
          total: response.usage.totalTokens
        }
      };
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : String(error);

      const failure = createFailureRecord(
        agentDef.id,
        'runtime_error',
        state.error
      );

      await this.recovery.recover(failure, null as any);

      return {
        agentId: agentDef.id,
        agentName: agentDef.name,
        success: false,
        artifacts: [],
        output: '',
        error: state.error,
        duration: Date.now() - startTime,
        tokenUsage: { prompt: 0, completion: 0, total: 0 }
      };
    }
  }

  private parseArtifacts(
    response: string,
    agentDef: AgentDefinition,
    factoryType: string
  ): AgentArtifact[] {
    const artifacts: AgentArtifact[] = [];

    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const artifact = this.artifactInjector.createArtifactFromOutput(
          agentDef.id,
          agentDef.name,
          factoryType,
          parsed.type || agentDef.outputTypes[0],
          parsed.content || parsed
        );
        artifacts.push(artifact);
      } else {
        const parsed = JSON.parse(response);
        if (parsed.type && parsed.content) {
          const artifact = this.artifactInjector.createArtifactFromOutput(
            agentDef.id,
            agentDef.name,
            factoryType,
            parsed.type,
            parsed.content
          );
          artifacts.push(artifact);
        }
      }
    } catch {
      const artifact = this.artifactInjector.createArtifactFromOutput(
        agentDef.id,
        agentDef.name,
        factoryType,
        agentDef.outputTypes[0] || 'documentation',
        response
      );
      artifacts.push(artifact);
    }

    return artifacts;
  }

  getAgentState(agentId: string): AgentState | undefined {
    return this.agentStates.get(agentId);
  }

  getAllArtifacts(): AgentArtifact[] {
    return [...this.allArtifacts];
  }

  getMemory(): RuntimeMemory {
    return this.memory;
  }

  getRecoveryStats() {
    return this.recovery.getStats();
  }

  getReviewStats() {
    return this.review.getStats();
  }

  getArtifactStats() {
    return this.artifactRetriever.getStats();
  }

  getRetrievalStats() {
    return this.memoryRetriever.getStats();
  }
}

export { AgentExecutor };

export function createAgentExecutor(config?: AgentExecutorConfig): AgentExecutor {
  return new AgentExecutor(config);
}

export async function executeFactoryWorkflow(
  factoryType: string,
  input: Record<string, unknown>,
  config?: AgentExecutorConfig
): Promise<WorkflowExecutionResult> {
  const executor = createAgentExecutor(config);
  return executor.executeWorkflow(factoryType, input);
}
