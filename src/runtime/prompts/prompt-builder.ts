// Phase 7.5: Prompt Builder

import { AgentDefinition } from '../agents/agent-definitions.js';
import { AgentArtifact } from '../state/agent-state.js';
import { RuntimeMemory } from '../memory/runtime-memory.js';

export interface PromptContext {
  agent: AgentDefinition;
  factoryType: string;
  input: Record<string, unknown>;
  artifacts: AgentArtifact[];
  memory: RuntimeMemory;
  previousOutputs: Record<string, string>;
}

export interface BuiltPrompt {
  system: string;
  user: string;
  context: string;
  examples?: string[];
}

export class PromptBuilder {
  buildPrompt(context: PromptContext): BuiltPrompt {
    const system = this.buildSystemPrompt(context);
    const user = this.buildUserPrompt(context);
    const contextStr = this.buildContextString(context);
    const examples = this.buildExamples(context);

    return {
      system,
      user,
      context: contextStr,
      examples
    };
  }

  private buildSystemPrompt(context: PromptContext): string {
    const { agent, factoryType } = context;

    const sections: string[] = [];

    sections.push(`You are ${agent.name}, a specialized AI agent in the ${agent.department} department.`);
    sections.push('');
    sections.push(`## Role`);
    sections.push(agent.description);
    sections.push('');
    sections.push(`## Capabilities`);
    sections.push(agent.capabilities.map(c => `- ${this.formatCapability(c)}`).join('\n'));
    sections.push('');
    sections.push(`## Output Types`);
    sections.push(agent.outputTypes.map(t => `- ${this.formatOutputType(t)}`).join('\n'));
    sections.push('');
    sections.push(`## Factory Context`);
    sections.push(`You are working on a ${factoryType} project.`);
    sections.push('');
    sections.push(`## Rules`);
    sections.push('1. Always produce valid, well-structured output');
    sections.push('2. Follow TypeScript best practices');
    sections.push('3. Use proper naming conventions');
    sections.push('4. Include error handling where appropriate');
    sections.push('5. Follow the project\'s design system and patterns');
    sections.push('6. Output must be parseable as JSON');
    sections.push('');
    sections.push(`## Output Format`);
    sections.push('Return your output as a JSON object with the following structure:');
    sections.push('```json');
    sections.push(JSON.stringify({
      type: '<output_type>',
      name: '<descriptive_name>',
      content: '<actual_content>',
      metadata: {
        description: '<what this output does>',
        dependencies: ['<list of dependencies>'],
        exports: ['<list of exports>']
      }
    }, null, 2));
    sections.push('```');

    return sections.join('\n');
  }

  private buildUserPrompt(context: PromptContext): string {
    const { agent, input, artifacts, previousOutputs } = context;

    const sections: string[] = [];

    sections.push(`## Task`);
    sections.push(`Execute your role as ${agent.name} for this ${context.factoryType} project.`);
    sections.push('');

    if (input.name) {
      sections.push(`## Project Name`);
      sections.push(input.name as string);
      sections.push('');
    }

    if (input.requirements) {
      sections.push(`## Requirements`);
      sections.push(input.requirements as string);
      sections.push('');
    }

    const previousOutputsList = Object.entries(previousOutputs);
    if (previousOutputsList.length > 0) {
      sections.push(`## Previous Agent Outputs`);
      for (const [agentName, output] of previousOutputsList) {
        sections.push(`### ${agentName}`);
        sections.push(output.substring(0, 2000));
        sections.push('');
      }
    }

    if (artifacts.length > 0) {
      sections.push(`## Existing Artifacts`);
      for (const artifact of artifacts.slice(0, 5)) {
        sections.push(`- ${artifact.name} (${artifact.type}): ${artifact.status}`);
      }
      sections.push('');
    }

    sections.push(`## Your Output`);
    sections.push('Produce your output as a JSON object following the format specified in your system prompt.');

    return sections.join('\n');
  }

  private buildContextString(context: PromptContext): string {
    const { memory, agent } = context;

    const sections: string[] = [];

    const knowledge = memory.getTopKnowledge(undefined, 5);
    if (knowledge.length > 0) {
      sections.push('## Relevant Knowledge');
      for (const entry of knowledge) {
        sections.push(`- ${entry.type}: ${JSON.stringify(entry.content).substring(0, 200)}`);
      }
      sections.push('');
    }

    const workingMemory = memory.getWorking(agent.id);
    if (Object.keys(workingMemory).length > 0) {
      sections.push('## Working Memory');
      sections.push(JSON.stringify(workingMemory, null, 2));
      sections.push('');
    }

    return sections.join('\n');
  }

  private buildExamples(context: PromptContext): string[] {
    const { agent, factoryType } = context;

    const examples: string[] = [];

    if (agent.outputTypes.includes('component')) {
      examples.push(this.getComponentExample(factoryType));
    }

    if (agent.outputTypes.includes('page')) {
      examples.push(this.getPageExample(factoryType));
    }

    if (agent.outputTypes.includes('api_route')) {
      examples.push(this.getApiRouteExample(factoryType));
    }

    if (agent.outputTypes.includes('blueprint')) {
      examples.push(this.getBlueprintExample(factoryType));
    }

    return examples;
  }

  private getComponentExample(factoryType: string): string {
    return `Example component output:
\`\`\`json
{
  "type": "component",
  "name": "Header",
  "content": "import React from 'react';\\n\\ninterface HeaderProps {\\n  title?: string;\\n  navigation?: Array<{ label: string; href: string }>;\\n}\\n\\nexport default function Header({ title = '${factoryType}', navigation = [] }: HeaderProps) {\\n  return (\\n    <header className=\\"bg-white shadow-sm\\">\\n      <div className=\\"max-w-7xl mx-auto px-4 py-4\\">\\n        <h1 className=\\"text-2xl font-bold\\">{title}</h1>\\n        <nav className=\\"mt-4\\">\\n          {navigation.map((item) => (\\n            <a key={item.href} href={item.href} className=\\"mr-4 text-blue-600\\">\\n              {item.label}\\n            </a>\\n          ))}\\n        </nav>\\n      </div>\\n    </header>\\n  );\\n}",
  "metadata": {
    "description": "Main header component with navigation",
    "dependencies": ["react"],
    "exports": ["default"]
  }
}
\`\`\``;
  }

  private getPageExample(factoryType: string): string {
    return `Example page output:
\`\`\`json
{
  "type": "page",
  "name": "HomePage",
  "content": "import Header from '@/components/Header';\\nimport Footer from '@/components/Footer';\\n\\nexport default function HomePage() {\\n  return (\\n    <div className=\\"min-h-screen flex flex-col\\">\\n      <Header title=\\"${factoryType}\\" />\\n      <main className=\\"flex-1\\">\\n        <section className=\\"py-20\\">\\n          <div className=\\"max-w-7xl mx-auto px-4\\">\\n            <h2 className=\\"text-4xl font-bold text-center\\">Welcome</h2>\\n          </div>\\n        </section>\\n      </main>\\n      <Footer />\\n    </div>\\n  );\\n}",
  "metadata": {
    "description": "Main home page",
    "dependencies": ["Header", "Footer"],
    "exports": ["default"]
  }
}
\`\`\``;
  }

  private getApiRouteExample(factoryType: string): string {
    return `Example API route output:
\`\`\`json
{
  "type": "api_route",
  "name": "items-api",
  "content": "import { NextRequest, NextResponse } from 'next/server';\\n\\nexport async function GET(request: NextRequest) {\\n  try {\\n    const items = [];\\n    return NextResponse.json({ success: true, data: items });\\n  } catch (error) {\\n    return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 });\\n  }\\n}\\n\\nexport async function POST(request: NextRequest) {\\n  try {\\n    const body = await request.json();\\n    return NextResponse.json({ success: true, data: body }, { status: 201 });\\n  } catch (error) {\\n    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });\\n  }\\n}",
  "metadata": {
    "description": "API route for items CRUD",
    "dependencies": ["next/server"],
    "exports": ["GET", "POST"]
  }
}
\`\`\``;
  }

  private getBlueprintExample(factoryType: string): string {
    return `Example blueprint output:
\`\`\`json
{
  "type": "blueprint",
  "name": "${factoryType}-blueprint",
  "content": {
    "name": "${factoryType}",
    "type": "${factoryType}",
    "version": "1.0.0",
    "description": "Production-ready ${factoryType} application",
    "factories": ["${factoryType}"],
    "pages": ["Home", "About", "Contact"],
    "components": ["Header", "Footer", "Sidebar"],
    "apiRoutes": [],
    "database": null,
    "auth": false,
    "seo": true,
    "performance": true,
    "accessibility": true
  },
  "metadata": {
    "description": "Project blueprint for ${factoryType}",
    "dependencies": [],
    "exports": ["blueprint"]
  }
}
\`\`\``;
  }

  private formatCapability(capability: string): string {
    return capability
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatOutputType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export function createPromptBuilder(): PromptBuilder {
  return new PromptBuilder();
}
