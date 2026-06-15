#!/usr/bin/env node

import { StudioEngine } from '../core/engine.js';
import { allFactories } from '../factories/index.js';
import type { FactoryType, StudioInput } from '../core/types.js';

interface CliArgs {
  url?: string;
  screenshot?: string;
  prompt?: string;
  figma?: string;
  pdf?: string;
  codebasePath?: string;
  factory?: FactoryType;
  output?: string;
  format?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
  list?: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--url': case '-u': result.url = args[++i]; break;
      case '--screenshot': case '-s': result.screenshot = args[++i]; break;
      case '--prompt': case '-p': result.prompt = args[++i]; break;
      case '--figma': case '-f': result.figma = args[++i]; break;
      case '--pdf': result.pdf = args[++i]; break;
      case '--codebase': case '-c': result.codebasePath = args[++i]; break;
      case '--factory': case '-F': result.factory = args[++i] as FactoryType; break;
      case '--output': case '-o': result.output = args[++i]; break;
      case '--format': result.format = args[++i]; break;
      case '--dry-run': result.dryRun = true; break;
      case '--verbose': case '-v': result.verbose = true; break;
      case '--help': case '-h': result.help = true; break;
      case '--list': result.list = true; break;
      default:
        if (!arg.startsWith('-')) {
          if (/^https?:\/\//.test(arg) && !result.url) {
            result.url = arg;
          } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(arg) && !result.screenshot) {
            result.screenshot = arg;
          } else if (/\.pdf$/i.test(arg) && !result.pdf) {
            result.pdf = arg;
          } else if (!result.prompt) {
            result.prompt = arg;
          }
        }
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Upgraded AI Factory Studio v0.1.0                ║
║   Multi-Factory AI Platform for Software Generation        ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  studio [prompt] [options]

INPUTS:
  --url, -u <url>              Website URL to analyze/clone
  --screenshot, -s <path>      Screenshot image path
  --prompt, -p <text>          Text description of what to build
  --figma, -f <url>            Figma design URL
  --pdf <path>                 PDF document path
  --codebase, -c <path>        Existing codebase path

FACTORY:
  --factory, -F <type>         Force specific factory:
                                 website | ecommerce | saas |
                                 admin | dashboard | agent | tools
  --list                       List all available factories

OUTPUT:
  --output, -o <dir>           Output directory (default: ./output)
  --format <fmt>               Output format: json, yaml, both (default: both)
  --dry-run                    Generate blueprint only, no files
  --verbose, -v                Verbose output

  --help, -h                   Show this help

EXAMPLES:
  studio "Build a modern SaaS landing page"
  studio -u https://example.com
  studio -s ./design.png -o ./my-project
  studio -f https://figma.com/file/abc123 -F website
  studio -p "Ecommerce store for shoes" -F ecommerce
  studio -c ./my-app -F saas
  studio --list
  `);
}

function listFactories(): void {
  console.log('\nAvailable Factories:\n');
  const factories = [
    { type: 'website', name: 'Website Factory', desc: 'Marketing sites, landing pages, blogs, portfolios', inputs: 'prompt, url, screenshot, figma, pdf, codebase' },
    { type: 'ecommerce', name: 'Ecommerce Factory', desc: 'Online stores with products, cart, checkout', inputs: 'prompt, url, screenshot, figma' },
    { type: 'saas', name: 'SaaS Factory', desc: 'SaaS apps with auth, billing, multi-tenancy', inputs: 'prompt, url, screenshot, figma' },
    { type: 'admin', name: 'Admin Panel Factory', desc: 'Admin dashboards with CRUD and data tables', inputs: 'prompt, url, screenshot, figma' },
    { type: 'dashboard', name: 'Dashboard Factory', desc: 'Analytics dashboards with charts and metrics', inputs: 'prompt, url, screenshot, figma' },
    { type: 'agent', name: 'AI Agent Factory', desc: 'AI chatbots with chat UI and knowledge base', inputs: 'prompt, url, screenshot' },
    { type: 'tools', name: 'Internal Tools Factory', desc: 'Internal tools, form builders, data viewers', inputs: 'prompt, url, screenshot, figma, codebase' },
  ];

  factories.forEach(f => {
    console.log(`  ${f.type.padEnd(14)} ${f.name}`);
    console.log(`  ${''.padEnd(14)} ${f.desc}`);
    console.log(`  ${''.padEnd(14)} Inputs: ${f.inputs}`);
    console.log('');
  });
}

function detectFactoryFromPrompt(prompt: string): FactoryType | undefined {
  const lower = prompt.toLowerCase();
  if (/shop|store|product|cart|checkout|ecommerce|buy|purchase|stripe/i.test(lower)) return 'ecommerce';
  if (/agent|chatbot|chat|ai|assistant|bot|llm/i.test(lower)) return 'agent';
  if (/admin|panel|crud|manage|backoffice/i.test(lower)) return 'admin';
  if (/dashboard|analytics|chart|graph|metric|visualization/i.test(lower)) return 'dashboard';
  if (/tool|internal|utility|builder|viewer|processor/i.test(lower)) return 'tools';
  if (/saas|subscription|billing|tenant|platform/i.test(lower)) return 'saas';
  return undefined;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) { printHelp(); return; }
  if (args.list) { listFactories(); return; }

  const input: StudioInput = {
    type: 'prompt',
    prompt: args.prompt,
    url: args.url,
    screenshotPath: args.screenshot,
    figmaUrl: args.figma,
    pdfPath: args.pdf,
    codebasePath: args.codebasePath,
  };

  if (!input.url && !input.screenshotPath && !input.figmaUrl && !input.pdfPath && !input.codebasePath && !input.prompt) {
    console.error('Error: At least one input is required. Use --help for usage.');
    process.exit(1);
  }

  const engine = new StudioEngine({
    outputDir: args.output || './output',
    verbose: args.verbose || false,
    dryRun: args.dryRun || false,
  });

  for (const FactoryClass of allFactories) {
    engine.registerFactory(new FactoryClass());
  }

  engine.onEvent((event) => {
    switch (event.type) {
      case 'input:received':
        console.log('\n🚀 Upgraded AI Factory Studio');
        console.log('─'.repeat(50));
        const inputInfo = event.input.url || event.input.screenshotPath || event.input.figmaUrl || event.input.pdfPath || event.input.codebasePath || event.input.prompt;
        console.log(`   Input: ${inputInfo?.slice(0, 80)}`);
        break;
      case 'factory:selected':
        console.log(`\n🏭 Factory: ${event.factory}`);
        console.log('─'.repeat(50));
        break;
      case 'factory:completed':
        console.log(`   ✅ Complete — ${event.result.files.length} files, ${(event.result.metadata.duration / 1000).toFixed(1)}s`);
        break;
    }
  });

  const result = await engine.execute(input, args.factory as FactoryType | undefined);

  if (result.success) {
    const r = result.results[0];
    console.log('\n' + '═'.repeat(50));
    console.log('✅ Generation Complete!');
    console.log('═'.repeat(50));
    console.log(`   Factory:     ${r.factory}`);
    console.log(`   Files:       ${r.files.length}`);
    console.log(`   Output:      ${r.outputDir}/${r.blueprint.project.name}/`);
    console.log(`   Blueprint:   ${r.blueprint.project.name}-blueprint.json`);
    console.log(`   Duration:    ${(r.metadata.duration / 1000).toFixed(1)}s`);
    console.log('');
  } else {
    console.error('\n❌ Generation failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
