// Phase 8: Benchmark CLI Command

import {
  createBenchmarkRunner,
  runBenchmarkSuite,
  getBenchmarkStats,
  BenchmarkConfig
} from '../benchmarks/benchmark-runner.js';
import {
  BENCHMARK_PROMPTS,
  getPromptsByCategory,
  getPromptStats
} from '../benchmarks/prompts/benchmark-prompts.js';
import {
  formatReport,
  calculateGrade
} from '../benchmarks/scoring.js';

interface BenchmarkOptions {
  command: string;
  category?: string;
  prompt?: string;
  platforms?: string;
  verbose?: boolean;
}

export async function benchmarkCommand(options: BenchmarkOptions): Promise<void> {
  console.log('Benchmark Suite');
  console.log('='.repeat(50));

  const { command, category, prompt, platforms, verbose } = options;

  switch (command) {
    case 'run':
      await runBenchmarks(category, platforms, verbose);
      break;

    case 'stats':
      await showStats();
      break;

    case 'prompts':
      await showPrompts(category);
      break;

    case 'compare':
      await comparePlatforms();
      break;

    case 'report':
      await showReport();
      break;

    case 'demo':
      await runDemo();
      break;

    default:
      printUsage();
  }
}

async function runBenchmarks(category?: string, platforms?: string, verbose?: boolean): Promise<void> {
  console.log('Running benchmarks...');
  console.log('');

  const config: Partial<BenchmarkConfig> = {};

  if (category) {
    config.categories = [category];
  }

  if (platforms) {
    config.platforms = platforms.split(',').map(p => p.trim());
  }

  const startTime = Date.now();
  const report = await runBenchmarkSuite(config);
  const duration = Date.now() - startTime;

  console.log('');
  console.log(`Benchmark completed in ${(duration / 1000).toFixed(1)}s`);
  console.log('');

  console.log(formatReport(report));
}

async function showStats(): Promise<void> {
  console.log('Benchmark Statistics');
  console.log('-'.repeat(30));

  const stats = getBenchmarkStats();

  console.log('');
  console.log(`Total Prompts: ${stats.totalPrompts}`);
  console.log('');
  console.log('By Category:');
  for (const [cat, count] of Object.entries(stats.promptsByCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log('');
  console.log('By Difficulty:');
  for (const [diff, count] of Object.entries(stats.promptsByDifficulty)) {
    console.log(`  ${diff}: ${count}`);
  }
}

async function showPrompts(category?: string): Promise<void> {
  console.log('Benchmark Prompts');
  console.log('-'.repeat(30));

  const prompts = category ? getPromptsByCategory(category) : BENCHMARK_PROMPTS;

  console.log('');
  console.log(`Showing ${prompts.length} prompts${category ? ` in ${category}` : ''}`);
  console.log('');

  for (const prompt of prompts) {
    console.log(`[${prompt.id}]`);
    console.log(`  Category: ${prompt.category} / ${prompt.subcategory}`);
    console.log(`  Difficulty: ${prompt.difficulty}`);
    console.log(`  Prompt: ${prompt.prompt.substring(0, 100)}...`);
    console.log(`  Expected: ${prompt.expectedFeatures.join(', ')}`);
    console.log('');
  }
}

async function comparePlatforms(): Promise<void> {
  console.log('Platform Comparison');
  console.log('-'.repeat(30));

  const platforms = [
    'upgraded-ai-factory',
    'same-dev',
    'lovable',
    'bolt',
    'readdy',
    'emergent'
  ];

  console.log('');
  console.log('Platform capabilities:');
  console.log('');
  console.log('Platform              | Multi-Factory | Agent System | Learning | Customization');
  console.log('-'.repeat(80));

  const capabilities: Record<string, string[]> = {
    'upgraded-ai-factory': ['✅', '✅', '✅', '✅'],
    'same-dev': ['❌', '❌', '❌', '❌'],
    'lovable': ['❌', '❌', '❌', '⚠️'],
    'bolt': ['❌', '❌', '❌', '⚠️'],
    'readdy': ['❌', '❌', '❌', '❌'],
    'emergent': ['❌', '❌', '❌', '❌']
  };

  for (const platform of platforms) {
    const name = platform.padEnd(21);
    const caps = capabilities[platform] || ['❌', '❌', '❌', '❌'];
    console.log(`${name} | ${caps[0].padEnd(13)} | ${caps[1].padEnd(10)} | ${caps[2].padEnd(8)} | ${caps[3]}`);
  }

  console.log('');
  console.log('Strengths by platform:');
  console.log('');
  console.log('Upgraded AI Factory:');
  console.log('  ✅ Multi-factory support (7 factories)');
  console.log('  ✅ 32-agent system across 9 departments');
  console.log('  ✅ Self-learning intelligence system');
  console.log('  ✅ Customizable workflows');
  console.log('  ✅ Blueprint optimization');
  console.log('  ✅ Quality prediction');
  console.log('');
  console.log('Competitors (Lovable, Bolt, etc.):');
  console.log('  ✅ Polished visual design');
  console.log('  ✅ Faster generation');
  console.log('  ✅ Better prompt understanding');
  console.log('  ✅ Refined UX');
  console.log('  ✅ Large user base feedback');
  console.log('');
  console.log('We will outperform in:');
  console.log('  • Architecture and extensibility');
  console.log('  • Workflow customization');
  console.log('  • Learning and improvement');
  console.log('  • Enterprise use cases');
  console.log('');
  console.log('Competitors may outperform in:');
  console.log('  • Visual polish');
  console.log('  • Speed');
  console.log('  • Consumer UX');
}

async function showReport(): Promise<void> {
  console.log('Latest Benchmark Report');
  console.log('-'.repeat(30));

  console.log('');
  console.log('No benchmark data yet. Run benchmarks first:');
  console.log('  npm run benchmark:run');
}

async function runDemo(): Promise<void> {
  console.log('Benchmark Demo');
  console.log('-'.repeat(30));

  console.log('');
  console.log('This will run a quick demo benchmark with 2 prompts per platform.');
  console.log('');

  const config: Partial<BenchmarkConfig> = {
    categories: ['website'],
    maxPromptsPerCategory: 2,
    platforms: ['upgraded-ai-factory', 'lovable', 'bolt']
  };

  const startTime = Date.now();
  const report = await runBenchmarkSuite(config);
  const duration = Date.now() - startTime;

  console.log('');
  console.log(`Demo completed in ${(duration / 1000).toFixed(1)}s`);
  console.log('');
  console.log(formatReport(report));
}

function printUsage(): void {
  console.log('Usage: benchmark <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  run               Run benchmark suite');
  console.log('  stats             Show benchmark statistics');
  console.log('  prompts           List all benchmark prompts');
  console.log('  compare           Compare platforms');
  console.log('  report            Show latest report');
  console.log('  demo              Run quick demo');
  console.log('');
  console.log('Options:');
  console.log('  --category <name>     Filter by category');
  console.log('  --platforms <list>    Comma-separated platform list');
  console.log('  --verbose             Enable verbose output');
  console.log('');
  console.log('Examples:');
  console.log('  benchmark run');
  console.log('  benchmark run --category website');
  console.log('  benchmark run --platforms "upgraded-ai-factory,lovable"');
  console.log('  benchmark stats');
  console.log('  benchmark prompts --category ecommerce');
  console.log('  benchmark compare');
  console.log('  benchmark demo');
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

const args = process.argv.slice(2);
const options: BenchmarkOptions = {
  command: 'stats',
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--category':
      options.category = args[++i];
      break;
    case '--prompt':
      options.prompt = args[++i];
      break;
    case '--platforms':
      options.platforms = args[++i];
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    default:
      if (!args[i].startsWith('--')) {
        options.command = args[i];
      }
      break;
  }
}

benchmarkCommand(options).catch(console.error);
