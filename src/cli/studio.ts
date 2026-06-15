#!/usr/bin/env node

import { createEngine } from '../core/factory-setup.js';
import { runFactoryBenchmarks } from '../audit/benchmark-runner.js';
import { generateReport, saveReport } from '../audit/report-generator.js';

const args = process.argv.slice(2);
const command = args[0];

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        Upgraded AI Factory Studio v0.1.0                    ║
║        Production Readiness Audit System                     ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  studio <command> [options]

Commands:
  generate <prompt>        Generate a project from any input
  route <text>             Route input to best factory (show decision)
  audit [factory]          Run benchmark audit for a factory
  audit:all                Run benchmarks for ALL factories
  list                     List all available factories
  help                     Show this help message

Options:
  --factory <type>         Specify factory type directly
  --output <dir>           Output directory (default: ./output)
  --dry-run                Generate blueprint only, no source files
  --count <n>              Number of benchmarks to run (default: 20)
  --verbose                Show detailed output

Examples:
  studio generate "Ecommerce store for handmade candles with cart"
  studio generate "https://example.com" --output ./my-project
  studio route "Analytics dashboard with KPIs and charts"
  studio audit website --count 10
  studio audit:all
  studio list
`);
}

function detectInputType(arg: string): { type: string; content: string } {
  if (/^https?:\/\//i.test(arg)) {
    return { type: 'url', content: arg };
  }
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(arg)) {
    return { type: 'screenshot', content: arg };
  }
  if (/\.pdf$/i.test(arg)) {
    return { type: 'pdf', content: arg };
  }
  return { type: 'prompt', content: arg };
}

async function main(): Promise<void> {
  const engine = createEngine();

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    case 'list': {
      const factories = engine.getRegistry().getAll();
      console.log('\n📋 Available Factories:\n');
      for (const f of factories) {
        const inputs = f.config.supportedInputs.join(', ');
        console.log(`  🏭 ${f.config.type.padEnd(12)} ${f.config.name}`);
        console.log(`     Supported inputs: ${inputs}`);
        console.log();
      }
      break;
    }

    case 'route': {
      const text = args[1];
      if (!text) {
        console.error('❌ Error: Please provide text to route.');
        process.exit(1);
      }
      console.log(`\n🔍 Routing input through Requirement Understanding Engine...\n`);
      const routing = await engine.getRouter().routeFromText(text);
      console.log(`📍 Selected Factory: ${routing.factory}`);
      console.log(`📊 Confidence: ${(routing.confidence * 100).toFixed(1)}%`);
      console.log(`📝 Reason: ${routing.reason}`);
      console.log(`⏱️  Processing Time: ${routing.processingTimeMs}ms`);
      if (routing.alternatives.length > 0) {
        console.log(`🔄 Alternatives: ${routing.alternatives.join(', ')}`);
      }
      console.log(`\n📋 Canonical Requirements:`);
      console.log(`   Project Name: ${routing.requirements.projectName}`);
      console.log(`   Project Type: ${routing.requirements.projectType}`);
      console.log(`   Complexity: ${routing.requirements.complexity}`);
      console.log(`   Features: ${routing.requirements.features.length}`);
      console.log(`   Entities: ${routing.requirements.entities.length}`);
      console.log(`   Industry: ${routing.requirements.industry}`);
      console.log(`   Target Audience: ${routing.requirements.targetAudience}`);
      if (routing.requirements.ambiguities.length > 0) {
        console.log(`   ⚠️  Ambiguities: ${routing.requirements.ambiguities.join('; ')}`);
      }
      if (routing.requirements.suggestions.length > 0) {
        console.log(`   💡 Suggestions: ${routing.requirements.suggestions.join('; ')}`);
      }
      break;
    }

    case 'generate': {
      const promptOrUrl = args[1];
      if (!promptOrUrl) {
        console.error('❌ Error: Please provide a prompt, URL, or file path.');
        process.exit(1);
      }

      const factoryFlag = args.indexOf('--factory');
      const outputFlag = args.indexOf('--output');
      const dryRunFlag = args.includes('--dry-run');
      const verboseFlag = args.includes('--verbose');

      const outputDir = outputFlag >= 0 ? args[outputFlag + 1] : './output';
      const factoryType = factoryFlag >= 0 ? args[factoryFlag + 1] : undefined;

      const detected = detectInputType(promptOrUrl);

      console.log(`\n🏭 Upgraded AI Factory Studio v0.1.0`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📥 Input Type: ${detected.type}`);
      console.log(`📝 Content: ${detected.content.substring(0, 100)}${detected.content.length > 100 ? '...' : ''}`);
      console.log();

      const result = await engine.generate({
        prompt: detected.type === 'prompt' ? detected.content : undefined,
        url: detected.type === 'url' ? detected.content : undefined,
        outputDir,
        factory: factoryType,
        dryRun: dryRunFlag,
      });

      if (result.success) {
        const r = result.results[0];
        console.log(`✅ Generation Complete!`);
        console.log(`   Factory: ${r.factory}`);
        console.log(`   Output: ${r.outputDir}`);
        console.log(`   Files: ${r.files.length}`);
        console.log(`   Duration: ${r.metadata.duration}ms`);
        if (result.routing) {
          console.log(`   Routing Confidence: ${(result.routing.confidence * 100).toFixed(1)}%`);
          console.log(`   Reason: ${result.routing.reason}`);
        }
      } else {
        console.error('❌ Generation failed.');
        process.exit(1);
      }
      break;
    }

    case 'audit': {
      const factoryName = args[1] || 'website';
      const countFlag = args.indexOf('--count');
      const count = countFlag >= 0 ? parseInt(args[countFlag + 1]) : 20;

      console.log(`\n🔍 Running Audit for ${factoryName} factory (${count} benchmarks)...\n`);

      const scorecard = await runFactoryBenchmarks(factoryName, count);

      console.log(`\n📊 Scorecard for ${factoryName}:`);
      console.log(`   Score: ${scorecard.avgScore}/100`);
      console.log(`   Build Rate: ${scorecard.successfulBuilds}/${scorecard.totalProjects}`);
      console.log(`   Avg TS Errors: ${scorecard.avgTsErrors}`);
      console.log(`   Responsive: ${scorecard.responsiveRate}%`);
      console.log(`   Accessibility: ${scorecard.accessibilityRate}%`);

      const report = generateReport([scorecard]);
      saveReport(report, './audit-reports');

      break;
    }

    case 'audit:all': {
      const countFlag = args.indexOf('--count');
      const count = countFlag >= 0 ? parseInt(args[countFlag + 1]) : 20;

      const factories = ['website', 'ecommerce', 'saas', 'admin', 'dashboard', 'agent', 'tools'];
      const scorecards = [];

      for (const factory of factories) {
        console.log(`\n🔍 Auditing ${factory}...`);
        const scorecard = await runFactoryBenchmarks(factory, count);
        scorecards.push(scorecard);
      }

      const report = generateReport(scorecards);
      saveReport(report, './audit-reports');

      console.log(`\n📊 Overall Score: ${report.overallScore}/100`);
      console.log(`   Build Rate: ${report.overallBuildRate}%`);
      console.log(`   Weak Factories: ${report.weakFactories.join(', ')}`);
      console.log(`   Strong Factories: ${report.strongFactories.join(', ')}`);

      break;
    }

    default:
      printHelp();
  }
}

main().catch(console.error);
