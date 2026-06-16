// Phase 7: Runtime CLI Command

import {
  executeWorkflow,
  createRuntime,
  createRuntimeMemory,
  createRecoverySystem,
  createReviewSystem,
  ALL_AGENTS,
  getWorkflowNodes,
  AgentRuntime
} from '../runtime/index.js';

interface RuntimeOptions {
  factory: string;
  input: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export async function runtimeCommand(options: RuntimeOptions): Promise<void> {
  console.log('Phase 7: Multi-Agent Runtime');
  console.log('='.repeat(50));

  const { factory, input, verbose, dryRun } = options;

  console.log(`Factory: ${factory}`);
  console.log(`Input: ${input}`);
  console.log(`Verbose: ${verbose || false}`);
  console.log(`Dry Run: ${dryRun || false}`);
  console.log('');

  if (dryRun) {
    await executeDryRun(factory);
    return;
  }

  try {
    const requirements = parseInput(input);
    console.log('Executing workflow...');
    console.log('');

    const startTime = Date.now();
    const runtime = createRuntime(factory, {
      enableMemory: true,
      enableRecovery: true,
      enableReview: true,
      enableApproval: false,
      logLevel: verbose ? 'debug' : 'info'
    });

    const memory = createRuntimeMemory();
    const recovery = createRecoverySystem();
    const review = createReviewSystem();

    runtime.on('runtime:start', (data) => {
      console.log(`Runtime started for ${data.factoryType}`);
    });

    runtime.on('node:start', (data) => {
      console.log(`  Agent starting: ${data.agentId}`);
    });

    runtime.on('node:complete', (data) => {
      console.log(`  Agent completed: ${data.agentId} (${data.artifacts} artifacts)`);
    });

    runtime.on('node:error', (data) => {
      console.log(`  Agent error: ${data.agentId} - ${data.error}`);
    });

    runtime.on('recovery:start', (data) => {
      console.log(`  Recovery attempt: ${data.strategy} for ${data.agentId}`);
    });

    const result = await runtime.execute(requirements);
    const duration = Date.now() - startTime;

    console.log('');
    console.log('='.repeat(50));
    console.log('Execution Complete');
    console.log('='.repeat(50));
    console.log(`Success: ${result.success}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Artifacts: ${result.artifacts.length}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('');
    console.log('Agent States:');
    for (const [agentId, state] of result.agentStates) {
      console.log(`  ${agentId}: ${state.status}`);
    }

    console.log('');
    console.log('Artifacts:');
    for (const artifact of result.artifacts) {
      console.log(`  ${artifact.id}: ${artifact.type} (${artifact.status})`);
    }

    const messageStats = runtime.getMessageStats();
    console.log('');
    console.log('Message Stats:');
    console.log(`  Total: ${messageStats.total}`);
    console.log(`  Pending: ${messageStats.pending}`);
    console.log(`  Delivered: ${messageStats.delivered}`);
    console.log(`  Processed: ${messageStats.processed}`);

    const memoryStats = memory.getStats();
    console.log('');
    console.log('Memory Stats:');
    console.log(`  Working: ${memoryStats.working}`);
    console.log(`  Shared: ${memoryStats.shared}`);
    console.log(`  Persistent: ${memoryStats.persistent}`);
    console.log(`  Knowledge: ${memoryStats.knowledge}`);

    const recoveryStats = recovery.getStats();
    console.log('');
    console.log('Recovery Stats:');
    console.log(`  Total Failures: ${recoveryStats.totalFailures}`);
    console.log(`  Recovered: ${recoveryStats.recovered}`);
    console.log(`  Failed: ${recoveryStats.failed}`);

    const reviewStats = review.getStats();
    console.log('');
    console.log('Review Stats:');
    console.log(`  Total Reviews: ${reviewStats.totalReviews}`);
    console.log(`  Approved: ${reviewStats.approved}`);
    console.log(`  Rejected: ${reviewStats.rejected}`);
    console.log(`  Needs Changes: ${reviewStats.needsChanges}`);

  } catch (error) {
    console.error('Runtime execution failed:', error);
    process.exit(1);
  }
}

async function executeDryRun(factory: string): Promise<void> {
  console.log('Dry Run Mode');
  console.log('='.repeat(50));

  const agents = ALL_AGENTS.filter(a => {
    const workflow = getWorkflowNodes(factory);
    return workflow.some(node => node.agentId === a.id);
  });

  console.log(`Factory: ${factory}`);
  console.log(`Agents: ${agents.length}`);
  console.log('');

  console.log('Workflow:');
  const workflow = getWorkflowNodes(factory);
  for (const node of workflow) {
    const agent = agents.find(a => a.id === node.agentId);
    console.log(`  ${node.id}: ${agent?.name || node.agentId} (${node.type})`);
  }

  console.log('');
  console.log('Agent Details:');
  for (const agent of agents) {
    console.log(`  ${agent.name} (${agent.department})`);
    console.log(`    Capabilities: ${agent.capabilities.join(', ')}`);
    console.log(`    Output Types: ${agent.outputTypes.join(', ')}`);
    console.log(`    Dependencies: ${agent.dependencies.join(', ') || 'none'}`);
    console.log('');
  }

  console.log('Message Flow:');
  for (let i = 0; i < workflow.length - 1; i++) {
    const current = workflow[i];
    const next = workflow[i + 1];
    console.log(`  ${current.agentId} -> ${next.agentId} (${next.type})`);
  }
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
  console.log('Usage: runtime [options]');
  console.log('');
  console.log('Options:');
  console.log('  --factory <type>    Factory type (website, ecommerce, saas, admin, dashboard, agent, tools)');
  console.log('  --input <json>      Input requirements as JSON string');
  console.log('  --verbose           Enable verbose output');
  console.log('  --dry-run           Show workflow without executing');
  console.log('');
  console.log('Examples:');
  console.log('  runtime --factory website --input \'{"name":"My Site","type":"landing"}\'');
  console.log('  runtime --factory ecommerce --input \'{"name":"My Store","products":10}\' --verbose');
  console.log('  runtime --factory saas --dry-run');
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

const args = process.argv.slice(2);
const options: RuntimeOptions = {
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

runtimeCommand(options).catch(console.error);
