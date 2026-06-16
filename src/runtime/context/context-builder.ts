// Phase 7.5: Context Builder

import { AgentDefinition } from '../agents/agent-definitions.js';
import { AgentArtifact, AgentState } from '../state/agent-state.js';
import { RuntimeMemory } from '../memory/runtime-memory.js';

export interface AgentContext {
  agentId: string;
  agentName: string;
  department: string;
  factoryType: string;
  input: Record<string, unknown>;
  artifacts: AgentArtifact[];
  memory: AgentMemoryContext;
  previousAgents: PreviousAgentContext[];
  projectContext: ProjectContext;
}

export interface AgentMemoryContext {
  working: Record<string, unknown>;
  shared: Record<string, unknown>;
  persistent: Record<string, unknown>;
  relevantKnowledge: KnowledgeContext[];
}

export interface KnowledgeContext {
  type: string;
  content: unknown;
  confidence: number;
  source: string;
}

export interface PreviousAgentContext {
  agentId: string;
  agentName: string;
  department: string;
  outputs: AgentArtifact[];
  status: string;
  duration: number;
}

export interface ProjectContext {
  name: string;
  type: string;
  requirements: string;
  constraints: string[];
  existingArtifacts: ArtifactSummary[];
}

export interface ArtifactSummary {
  id: string;
  type: string;
  name: string;
  status: string;
  factory: string;
}

export class ContextBuilder {
  buildContext(
    agent: AgentDefinition,
    factoryType: string,
    input: Record<string, unknown>,
    allArtifacts: AgentArtifact[],
    agentStates: Map<string, AgentState>,
    memory: RuntimeMemory
  ): AgentContext {
    return {
      agentId: agent.id,
      agentName: agent.name,
      department: agent.department,
      factoryType,
      input,
      artifacts: this.getRelevantArtifacts(agent, allArtifacts),
      memory: this.buildMemoryContext(agent, memory),
      previousAgents: this.buildPreviousAgentContext(agent, agentStates),
      projectContext: this.buildProjectContext(input, allArtifacts)
    };
  }

  private getRelevantArtifacts(agent: AgentDefinition, allArtifacts: AgentArtifact[]): AgentArtifact[] {
    return allArtifacts.filter(artifact => {
      if (agent.outputTypes.includes(artifact.type)) {
        return true;
      }

      if (agent.requiredInputs.some(input => artifact.type.includes(input))) {
        return true;
      }

      if (agent.dependencies.some(dep => artifact.name.includes(dep))) {
        return true;
      }

      return false;
    });
  }

  private buildMemoryContext(agent: AgentDefinition, memory: RuntimeMemory): AgentMemoryContext {
    const working = memory.getWorking(agent.id);
    const shared = this.extractSharedMemory(memory);
    const persistent = memory.getPersistent(agent.id);
    const relevantKnowledge = memory.getTopKnowledge(undefined, 10).map(k => ({
      type: k.type,
      content: k.content,
      confidence: k.confidence,
      source: k.source
    }));

    return {
      working,
      shared,
      persistent,
      relevantKnowledge
    };
  }

  private extractSharedMemory(memory: RuntimeMemory): Record<string, unknown> {
    const shared: Record<string, unknown> = {};

    const project = memory.getShared('project');
    if (project) shared.project = project;

    const requirements = memory.getShared('requirements');
    if (requirements) shared.requirements = requirements;

    const designSystem = memory.getShared('designSystem');
    if (designSystem) shared.designSystem = designSystem;

    const architecture = memory.getShared('architecture');
    if (architecture) shared.architecture = architecture;

    return shared;
  }

  private buildPreviousAgentContext(
    agent: AgentDefinition,
    agentStates: Map<string, AgentState>
  ): PreviousAgentContext[] {
    const previous: PreviousAgentContext[] = [];

    for (const depId of agent.dependencies) {
      const state = agentStates.get(depId);
      if (state) {
        previous.push({
          agentId: depId,
          agentName: state.name,
          department: state.department,
          outputs: state.artifacts,
          status: state.status,
          duration: state.totalDuration
        });
      }
    }

    return previous;
  }

  private buildProjectContext(
    input: Record<string, unknown>,
    allArtifacts: AgentArtifact[]
  ): ProjectContext {
    return {
      name: (input.name as string) || 'Untitled Project',
      type: (input.type as string) || 'general',
      requirements: (input.requirements as string) || JSON.stringify(input),
      constraints: (input.constraints as string[]) || [],
      existingArtifacts: allArtifacts.map(a => ({
        id: a.id,
        type: a.type,
        name: a.name,
        status: a.status,
        factory: a.metadata.factory
      }))
    };
  }

  formatContextForLLM(context: AgentContext): string {
    const sections: string[] = [];

    sections.push(`# Agent Context`);
    sections.push(`Agent: ${context.agentName} (${context.department})`);
    sections.push(`Factory: ${context.factoryType}`);
    sections.push('');

    sections.push(`# Project`);
    sections.push(`Name: ${context.projectContext.name}`);
    sections.push(`Type: ${context.projectContext.type}`);
    sections.push(`Requirements: ${context.projectContext.requirements}`);
    sections.push('');

    if (context.previousAgents.length > 0) {
      sections.push(`# Previous Agent Outputs`);
      for (const prev of context.previousAgents) {
        sections.push(`## ${prev.agentName} (${prev.department})`);
        sections.push(`Status: ${prev.status}`);
        sections.push(`Duration: ${prev.duration}ms`);
        sections.push(`Outputs: ${prev.outputs.length} artifacts`);
        for (const output of prev.outputs.slice(0, 3)) {
          sections.push(`  - ${output.name} (${output.type}): ${output.status}`);
        }
        sections.push('');
      }
    }

    if (context.artifacts.length > 0) {
      sections.push(`# Relevant Artifacts`);
      for (const artifact of context.artifacts.slice(0, 10)) {
        sections.push(`- ${artifact.name} (${artifact.type}): ${artifact.status}`);
      }
      sections.push('');
    }

    if (context.memory.relevantKnowledge.length > 0) {
      sections.push(`# Relevant Knowledge`);
      for (const knowledge of context.memory.relevantKnowledge.slice(0, 5)) {
        sections.push(`- ${knowledge.type} (confidence: ${knowledge.confidence})`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }
}

export function createContextBuilder(): ContextBuilder {
  return new ContextBuilder();
}
