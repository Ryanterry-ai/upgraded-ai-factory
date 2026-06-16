# Phase 7.5: Agent Activation

**Version:** 0.7.5  
**Status:** Complete  
**Date:** 2026-06-16

## Overview

Phase 7.5 transforms runtime agents from workflow definitions into real AI agents by connecting them to LLM providers and implementing the complete agent execution pipeline.

## Architecture Components

### 1. LLM Provider System (`src/runtime/llm/llm-client.ts`)

Multi-provider LLM client supporting:

- **OpenAI**: GPT-4o, GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **OpenRouter**: Access to multiple models via unified API

Features:
- Streaming support for all providers
- Automatic retry and error handling
- Token usage tracking
- Configurable temperature, max tokens, top-p

### 2. Prompt Builder (`src/runtime/prompts/prompt-builder.ts`)

Generates structured prompts for each agent:

- **System Prompt**: Role definition, capabilities, output format
- **User Prompt**: Task description, previous outputs, requirements
- **Context**: Memory, knowledge base, working state
- **Examples**: Factory-specific code examples

### 3. Context Builder (`src/runtime/context/context-builder.ts`)

Builds comprehensive context for each agent execution:

- **Agent Context**: Agent ID, name, department, capabilities
- **Memory Context**: Working, shared, persistent memory
- **Previous Agent Outputs**: Dependencies and their results
- **Project Context**: Name, type, requirements, constraints
- **Artifact Context**: Existing artifacts and their status

### 4. Memory Retrieval Layer (`src/runtime/memory/memory-retrieval.ts`)

Two retrieval systems:

**InMemoryRetriever:**
- Keyword-based search across memory entries
- Confidence-based filtering
- Type-based filtering
- Relevance scoring

**ArtifactRetriever:**
- Search artifacts by content, name, type
- Filter by factory, status
- Get recent artifacts
- Statistics and analytics

### 5. Artifact Injection Layer (`src/runtime/executor/artifact-injection.ts`)

Injects relevant artifacts into agent prompts:

- **Filtering**: Select artifacts relevant to agent's output types
- **Formatting**: Create human-readable summaries
- **Preview**: Generate content previews with truncation
- **Metadata**: Include dependencies, exports, version info

### 6. Agent Executor (`src/runtime/executor/agent-executor.ts`)

Complete agent execution pipeline:

1. **Context Building**: Gather all relevant context
2. **Prompt Generation**: Create structured prompts
3. **LLM Execution**: Generate responses via provider
4. **Artifact Parsing**: Extract artifacts from response
5. **Storage**: Store artifacts in memory and retrievers
6. **Recovery**: Handle failures with recovery strategies

## CLI Usage

### Dry Run (Show Workflow)

```bash
# Website factory
npm run agent:website

# Ecommerce factory
npm run agent:ecommerce

# SaaS factory
npm run agent:saas
```

### Execute with LLM

```bash
# Set API key
export OPENAI_API_KEY="sk-..."

# Execute website workflow
npm run agent-activate -- --factory website --input '{"name":"My Site","type":"landing"}'

# Execute with Anthropic
npm run agent-activate -- --factory ecommerce --provider anthropic --verbose

# Execute with OpenRouter
npm run agent-activate -- --factory saas --provider openrouter --model "openai/gpt-4o"
```

### Environment Variables

```bash
# Required (one of)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...

# Optional
LLM_PROVIDER=openai|anthropic|openrouter
OPENAI_MODEL=gpt-4o
ANTHROPIC_MODEL=claude-sonnet-4-20250514
OPENROUTER_MODEL=openai/gpt-4o
```

## Programmatic Usage

```typescript
import { createAgentExecutor, executeFactoryWorkflow } from './runtime';

// Simple execution
const result = await executeFactoryWorkflow('website', {
  name: 'My Site',
  type: 'landing'
});

// Advanced execution with custom config
const executor = createAgentExecutor({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  enableMemory: true,
  enableRecovery: true
});

executor.on('agent:start', (data) => {
  console.log(`Starting: ${data.agentName}`);
});

const result = await executor.executeWorkflow('ecommerce', {
  name: 'My Store',
  products: 100
});

console.log(`Artifacts: ${result.artifacts.length}`);
console.log(`Tokens: ${result.totalTokens}`);
```

## Agent Execution Flow

### Example: Website Factory

```
1. Requirements Analyst
   Input: User request
   Output: Documentation, Schema

2. Strategic Planner
   Input: Requirements
   Output: Blueprint, Documentation

3. Product Architect
   Input: Blueprint
   Output: Blueprint, Schema, Documentation

4. UI Designer
   Input: Blueprint, Schema
   Output: Design System, Component

5. Content Strategist
   Input: Requirements
   Output: Documentation, Schema

6. SEO Specialist
   Input: Content
   Output: Config, Documentation

7. React Developer
   Input: Design System, Components
   Output: Component, Page, Config

8. Next.js Specialist
   Input: Components, Pages
   Output: Page, API Route, Config

9. Tailwind Specialist
   Input: Design System
   Output: Config, Component

10. Test Engineer
    Input: Components, API Routes
    Output: Test, Documentation

11. Tech Lead
    Input: All artifacts
    Output: Documentation (review)

12. Quality Assurance
    Input: All artifacts
    Output: Final approval
```

## Artifact Types

Each agent produces specific artifact types:

| Agent | Output Types |
|-------|--------------|
| Requirements Analyst | documentation, schema |
| Strategic Planner | blueprint, documentation |
| Product Architect | blueprint, schema, documentation |
| UI Designer | design_system, component, documentation |
| Content Strategist | documentation, schema |
| SEO Specialist | config, documentation |
| React Developer | component, page, config |
| Next.js Specialist | page, api_route, config |
| Tailwind Specialist | config, component |
| Test Engineer | test, documentation |
| Tech Lead | documentation |
| Quality Assurance | documentation |

## Error Handling

### Recovery Strategies

1. **Auto-fix**: Automatically fix common issues
2. **Retry with context**: Retry with additional context
3. **Fallback agent**: Use alternative agent
4. **Skip artifact**: Skip non-critical artifacts
5. **Human escalation**: Escalate to human reviewers
6. **Fail gracefully**: Handle failures without crashing

### Error Types

- `import_error`: Missing or broken imports
- `type_error`: TypeScript type errors
- `missing_component`: Missing React components
- `missing_use_client`: Missing "use client" directive
- `missing_dependency`: Missing npm dependencies
- `config_error`: Configuration errors
- `build_error`: Build failures
- `runtime_error`: Runtime errors
- `security_vulnerability`: Security issues

## Performance

- **Workflow execution**: 30-120 seconds depending on factory
- **Per agent**: 2-10 seconds
- **Token usage**: 1,000-5,000 tokens per agent
- **Total tokens**: 10,000-50,000 per workflow

## Integration with Previous Phases

### Phase 7 (Runtime)

- Uses agent definitions from Phase 7
- Uses workflow nodes from Phase 7
- Uses memory system from Phase 7
- Uses recovery system from Phase 7
- Uses review system from Phase 7

### Phase 6 (Memory)

- Integrates with memory store
- Uses pattern learning
- Stores generated artifacts
- Retrieves relevant knowledge

### Phase 5.5 (Reliability)

- Uses auto-repair patterns
- Validates generated artifacts
- Handles build failures

## Testing

```bash
# Build
npm run build

# Dry run tests
npm run agent:website
npm run agent:ecommerce
npm run agent:saas

# Full execution (requires API key)
export OPENAI_API_KEY="sk-..."
npm run agent-activate -- --factory website --input '{"name":"Test"}' --verbose
```

## Next Steps

- **Phase 8**: Self-Improving Factory with feedback loops
- **Parallel Execution**: Run multiple agents concurrently
- **Streaming Responses**: Real-time output streaming
- **Cost Optimization**: Token usage optimization
- **Quality Metrics**: Measure output quality
- **Web UI**: Runtime monitoring dashboard
