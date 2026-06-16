#!/usr/bin/env node

import { createMemoryIntegration } from '../memory/memory-integration.js';
import { createEngine } from '../core/factory-setup.js';

const memory = createMemoryIntegration();

interface MemoryCommand {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
}

const commands: Record<string, MemoryCommand> = {
  stats: {
    name: 'stats',
    description: 'Show memory store statistics',
    execute: async () => {
      const stats = await memory.getStats();
      console.log('\n📊 Memory Store Statistics\n');
      for (const [table, count] of Object.entries(stats)) {
        console.log(`  ${table}: ${count}`);
      }
      console.log('');
    },
  },

  projects: {
    name: 'projects',
    description: 'List stored projects',
    execute: async (args) => {
      const factory = args[0] as any;
      const projects = await memory.getStore().listProjects({ factory, limit: 20 });
      console.log(`\n📁 Projects${factory ? ` (${factory})` : ''}\n`);
      if (projects.length === 0) {
        console.log('  No projects found.');
      } else {
        for (const p of projects) {
          console.log(`  [${p.build_success ? '✅' : '❌'}] ${p.name} (${p.factory}) — score: ${p.quality_score}`);
          console.log(`    ${p.prompt.substring(0, 60)}...`);
        }
      }
      console.log('');
    },
  },

  patterns: {
    name: 'patterns',
    description: 'List learned patterns',
    execute: async (args) => {
      const category = args[0];
      const patterns = await memory.getStore().getTopPatterns(category, 20);
      console.log(`\n🧩 Patterns${category ? ` (${category})` : ''}\n`);
      if (patterns.length === 0) {
        console.log('  No patterns found.');
      } else {
        for (const p of patterns) {
          console.log(`  [${p.category}] ${p.description.substring(0, 60)}`);
          console.log(`    success: ${(p.success_rate * 100).toFixed(0)}% | used: ${p.usage_count}x`);
        }
      }
      console.log('');
    },
  },

  search: {
    name: 'search',
    description: 'Search for similar projects/patterns',
    execute: async (args) => {
      const query = args.join(' ');
      if (!query) {
        console.log('Usage: memory search <query>');
        return;
      }
      console.log(`\n🔍 Searching for: "${query}"\n`);
      const context = await memory.retrieveContext(query);
      const formatted = memory.getRetrieval().formatContextForGeneration(context);
      console.log(formatted);
      console.log('');
    },
  },

  record: {
    name: 'record',
    description: 'Record a generation result',
    execute: async (args) => {
      const [factory, prompt] = args;
      if (!factory || !prompt) {
        console.log('Usage: memory record <factory> <prompt>');
        return;
      }
      console.log(`\n📝 Recording generation: ${factory} — "${prompt.substring(0, 40)}..."\n`);
      const engine = createEngine();
      const startTime = Date.now();
      const result = await engine.generate({ prompt, factory, dryRun: false });
      const buildTimeMs = Date.now() - startTime;
      const { project, generation } = await memory.recordGeneration(
        prompt, factory as any, result.results[0], result.success, buildTimeMs
      );
      console.log(`  Project: ${project.name} (score: ${project.quality_score})`);
      console.log(`  Generation: ${generation.build_success ? '✅' : '❌'} (${generation.file_count} files, ${buildTimeMs}ms)`);
      console.log('');
    },
  },

  retrieve: {
    name: 'retrieve',
    description: 'Retrieve context for a prompt',
    execute: async (args) => {
      const prompt = args.join(' ');
      if (!prompt) {
        console.log('Usage: memory retrieve <prompt>');
        return;
      }
      console.log(`\n🎯 Retrieving context for: "${prompt}"\n`);
      const context = await memory.retrieveContext(prompt);
      console.log(`  Found:`);
      console.log(`    Projects: ${context.relevantProjects.length}`);
      console.log(`    Patterns: ${context.relevantPatterns.length}`);
      console.log(`    Blueprints: ${context.relevantBlueprints.length}`);
      console.log(`    Generations: ${context.relevantGenerations.length}`);
      console.log(`    Top patterns: ${context.topPatterns.length}`);
      console.log(`    Successful gens: ${context.successfulGenerations.length}`);
      console.log('');
      const formatted = memory.getRetrieval().formatContextForGeneration(context);
      if (formatted) console.log(formatted);
      console.log('');
    },
  },

  enable: {
    name: 'enable',
    description: 'Enable memory layer',
    execute: async () => {
      memory.setEnabled(true);
      console.log('✅ Memory layer enabled');
    },
  },

  disable: {
    name: 'disable',
    description: 'Disable memory layer',
    execute: async () => {
      memory.setEnabled(false);
      console.log('❌ Memory layer disabled');
    },
  },
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const rest = args.slice(1);

  if (!command || command === 'help') {
    console.log('\n🧠 Memory & Learning Layer — CLI\n');
    console.log('Commands:');
    for (const [name, cmd] of Object.entries(commands)) {
      console.log(`  memory ${name.padEnd(12)} ${cmd.description}`);
    }
    console.log('');
    return;
  }

  const cmd = commands[command];
  if (!cmd) {
    console.log(`Unknown command: ${command}`);
    console.log('Run "memory help" for available commands.');
    return;
  }

  try {
    await cmd.execute(rest);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
}

main();
