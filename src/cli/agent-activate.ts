// Phase 7.5: Agent Activation CLI Command

import { executeFactoryWorkflow, createAgentExecutor, AgentExecutorConfig } from '../runtime/index.js';

interface AgentActivationOptions {
  factory: string;
  input: string;
  provider?: 'openai' | 'anthropic' | 'openrouter';
  model?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export async function agentActivationCommand(options: AgentActivationOptions): Promise<void> {
  console.log('Phase 7.5: Agent Activation');
  console.log('='.repeat(50));

  const { factory, input, provider, model, verbose, dryRun } = options;

  console.log(`Factory: ${factory}`);
  console.log(`Input: ${input}`);
  console.log(`Provider: ${provider || process.env.LLM_PROVIDER || 'openai'}`);
  console.log(`Model: ${model || 'default'}`);
  console.log(`Verbose: ${verbose || false}`);
  console.log(`Dry Run: ${dryRun || false}`);
  console.log('');

  if (dryRun) {
    await executeAgentActivationDryRun(factory);
    return;
  }

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.error('Error: No API key found. Set one of:');
    console.error('  - OPENAI_API_KEY');
    console.error('  - ANTHROPIC_API_KEY');
    console.error('  - OPENROUTER_API_KEY');
    process.exit(1);
  }

  try {
    const requirements = parseInput(input);
    console.log('Executing agent workflow...');
    console.log('');

    const startTime = Date.now();

    const config: AgentExecutorConfig = {
      provider: provider || (process.env.LLM_PROVIDER as any) || 'openai',
      model: model,
      enableMemory: true,
      enableRecovery: true,
      enableReview: true,
      enableApproval: false,
      logLevel: verbose ? 'debug' : 'info'
    };

    const executor = createAgentExecutor(config);

    executor.on('workflow:start', (data) => {
      console.log(`Workflow started for ${data.factoryType}`);
    });

    executor.on('agent:start', (data) => {
      console.log(`  Agent starting: ${data.agentName}`);
    });

    executor.on('llm:request', (data) => {
      if (verbose) {
        console.log(`    LLM request: ${data.messageCount} messages`);
      }
    });

    executor.on('llm:response', (data) => {
      if (verbose) {
        console.log(`    LLM response: ${data.tokens} tokens (${data.finishReason})`);
      }
    });

    executor.on('agent:complete', (data) => {
      console.log(`  Agent completed: ${data.artifacts} artifacts`);
    });

    executor.on('agent:error', (data) => {
      console.log(`  Agent error: ${data.error}`);
    });

    const result = await executor.executeWorkflow(factory, requirements);
    const duration = Date.now() - startTime;

    console.log('');
    console.log('='.repeat(50));
    console.log('Execution Complete');
    console.log('='.repeat(50));
    console.log(`Success: ${result.success}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Agents: ${result.results.length}`);
    console.log(`Artifacts: ${result.artifacts.length}`);
    console.log(`Total Tokens: ${result.totalTokens}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('');
    console.log('Agent Results:');
    for (const r of result.results) {
      console.log(`  ${r.agentName}: ${r.success ? 'Success' : 'Failed'} (${r.duration}ms, ${r.tokenUsage.total} tokens)`);
      if (r.artifacts.length > 0) {
        for (const a of r.artifacts) {
          console.log(`    - ${a.name} (${a.type}): ${a.status}`);
        }
      }
    }

    console.log('');
    console.log('Artifacts Summary:');
    const byType: Record<string, number> = {};
    for (const a of result.artifacts) {
      byType[a.type] = (byType[a.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }

    const artifactStats = executor.getArtifactStats();
    console.log('');
    console.log('Artifact Stats:');
    console.log(`  Total: ${artifactStats.total}`);
    console.log(`  By Status:`);
    for (const [status, count] of Object.entries(artifactStats.byStatus)) {
      console.log(`    ${status}: ${count}`);
    }

    const retrievalStats = executor.getRetrievalStats();
    console.log('');
    console.log('Memory Retrieval Stats:');
    console.log(`  Total Entries: ${retrievalStats.totalEntries}`);
    console.log(`  Average Confidence: ${retrievalStats.averageConfidence.toFixed(2)}`);

  } catch (error) {
    console.error('Agent execution failed:', error);
    process.exit(1);
  }
}

async function executeAgentActivationDryRun(factory: string): Promise<void> {
  console.log('Agent Activation Dry Run');
  console.log('='.repeat(50));

  const { getWorkflowNodes, getAgentById } = await import('../runtime/index.js');

  const workflow = getWorkflowNodes(factory);
  const agents = workflow
    .map(node => getAgentById(node.agentId))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  console.log(`Factory: ${factory}`);
  console.log(`Agents: ${agents.length}`);
  console.log('');

  console.log('Workflow Execution Plan:');
  for (const node of workflow) {
    const agent = getAgentById(node.agentId);
    console.log(`  ${node.id}: ${agent?.name || node.agentId} (${node.type})`);
    if (agent) {
      console.log(`    Department: ${agent.department}`);
      console.log(`    Output Types: ${agent.outputTypes.join(', ')}`);
      console.log(`    Dependencies: ${agent.dependencies.join(', ') || 'none'}`);
    }
    console.log('');
  }

  console.log('Execution Order:');
  for (let i = 0; i < workflow.length; i++) {
    const node = workflow[i];
    const agent = getAgentById(node.agentId);
    if (agent && node.type !== 'start' && node.type !== 'end') {
      console.log(`  ${i}. ${agent.name} → ${agent.outputTypes.join(', ')}`);
    }
  }

  console.log('');
  console.log('Required Environment Variables:');
  console.log('  - OPENAI_API_KEY or ANTHROPIC_API_KEY or OPENROUTER_API_KEY');
  console.log('  - LLM_PROVIDER (optional, default: openai)');
  console.log('  - OPENAI_MODEL (optional, default: gpt-4o)');
  console.log('  - ANTHROPIC_MODEL (optional, default: claude-sonnet-4-20250514)');
  console.log('  - OPENROUTER_MODEL (optional, default: openai/gpt-4o)');
}

function parseInput(input: string): Record<string, unknown> {
  try {
    return JSON.parse(input);
  } catch {
    return {
      name: input,
      type: 'general',
      requirements: input
    };
  }
}

function printUsage(): void {
  console.log('Usage: agent-activate [options]');
  console.log('');
  console.log('Options:');
  console.log('  --factory <type>    Factory type (website, ecommerce, saas, admin, dashboard, agent, tools)');
  console.log('  --input <json>      Input requirements as JSON string');
  console.log('  --provider <name>   LLM provider (openai, anthropic, openrouter)');
  console.log('  --model <name>      LLM model name');
  console.log('  --verbose           Enable verbose output');
  console.log('  --dry-run           Show workflow without executing');
  console.log('');
  console.log('Examples:');
  console.log('  agent-activate --factory website --input \'{"name":"My Site","type":"landing"}\'');
  console.log('  agent-activate --factory ecommerce --provider anthropic --verbose');
  console.log('  agent-activate --factory saas --dry-run');
  console.log('');
  console.log('Environment Variables:');
  console.log('  OPENAI_API_KEY       OpenAI API key');
  console.log('  ANTHROPIC_API_KEY    Anthropic API key');
  console.log('  OPENROUTER_API_KEY   OpenRouter API key');
  console.log('  LLM_PROVIDER         Default LLM provider');
  console.log('  OPENAI_MODEL         OpenAI model name');
  console.log('  ANTHROPIC_MODEL      Anthropic model name');
  console.log('  OPENROUTER_MODEL     OpenRouter model name');
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

const args = process.argv.slice(2);
const options: AgentActivationOptions = {
  factory: 'website',
  input: '{}',
  verbose: false,
  dryRun: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--factory':
      options.factory = args[++i];
      break;
    case '--input':
      options.input = args[++i];
      break;
    case '--provider':
      options.provider = args[++i] as any;
      break;
    case '--model':
      options.model = args[++i];
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--dry-run':
    case '-d':
      options.dryRun = true;
      break;
  }
}

agentActivationCommand(options).catch(console.error);
