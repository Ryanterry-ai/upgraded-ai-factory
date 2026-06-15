import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig } from '../../generators/codegen.js';

export class ToolsFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'Internal Tools Factory',
    type: 'tools',
    description: 'Generates internal tools, data viewers, form builders, and utilities',
    supportedInputs: ['prompt', 'url', 'screenshot', 'figma', 'codebase'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /\binternal\s*(tool|app|utility|dashboard)|\btool\s*(app|builder|dashboard)|\butility\s*(app|tool)|\bform\s*builder|\bdata\s*(viewer|entry|editor)|\bcalculator|\bconverter|\bcrud\s*(app|tool)/i.test(lower);
    }
    if (input.codebasePath) return true;
    return false;
  }

  async execute(input: StudioInput, config: EngineConfig): Promise<FactoryResult> {
    const startTime = Date.now();
    const files: GeneratedFile[] = [];
    const processed = await processInput(input);
    const blueprint = this.buildBlueprint(processed.prompt, processed.metadata);
    const projectName = blueprint.project.name;
    files.push(...this.generateProjectFiles(blueprint));

    if (!config.dryRun) {
      const fs = await import('fs');
      const path = await import('path');
      const outDir = path.join(config.outputDir, projectName);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      for (const file of files) {
        const filePath = path.join(outDir, file.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, file.content);
      }
      await this.writeBlueprint(blueprint, config.outputDir, projectName);
    }

    return this.createResult(true, 'tools', config.outputDir, files, blueprint, startTime, input.codebasePath ? 'codebase' : 'prompt');
  }

  private buildBlueprint(prompt: string, _metadata: Record<string, unknown>): Blueprint {
    const name = this.extractName(prompt);
    return this.createBlueprint({
      project: { name, description: prompt.slice(0, 200), framework: 'nextjs', styling: 'tailwind', language: 'typescript', generatedAt: new Date().toISOString(), version: '0.1.0' },
      pages: [
        { path: '/', name: 'Home', description: 'Tool home', components: ['AppLayout', 'ToolContent'], isPrimary: true },
      ],
      components: [
        { name: 'AppLayout', type: 'template', tag: 'div', classes: [], props: [{ name: 'children', type: 'ReactNode', required: true }], variants: [], children: [], parent: null, selector: '.app-layout' },
        { name: 'ToolContent', type: 'organism', tag: 'main', classes: [], props: [{ name: 'title', type: 'string', required: true }], variants: [], children: [], parent: null, selector: 'main' },
        { name: 'FormBuilder', type: 'organism', tag: 'form', classes: [], props: [{ name: 'fields', type: 'Field[]', required: true }], variants: [], children: [], parent: null, selector: '.form-builder' },
        { name: 'DataViewer', type: 'organism', tag: 'div', classes: [], props: [{ name: 'data', type: 'any[]', required: true }], variants: [], children: [], parent: null, selector: '.data-viewer' },
        { name: 'Button', type: 'atomic', tag: 'button', classes: [], props: [{ name: 'variant', type: 'string', required: false }], variants: [], children: [], parent: null, selector: 'button' },
        { name: 'Input', type: 'atomic', tag: 'input', classes: [], props: [{ name: 'label', type: 'string', required: true }], variants: [], children: [], parent: null, selector: 'input' },
      ],
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'Internal Tool';
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = blueprint.project.name;
    return [
      { path: 'src/app/page.tsx', content: this.genToolPage(name), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/AppLayout.tsx', content: this.genAppLayout(), type: 'component' },
      { path: 'src/components/FormBuilder.tsx', content: this.genFormBuilder(), type: 'component' },
      { path: 'src/components/DataViewer.tsx', content: this.genDataViewer(), type: 'component' },
      { path: 'src/lib/types.ts', content: this.genTypes(), type: 'type' },
      { path: 'next.config.ts', content: generateConfig(name), type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: 'tailwind.config.ts', content: generateTailwindConfig(), type: 'config' },
      { path: 'postcss.config.js', content: generatePostcssConfig(), type: 'config' },
    ];
  }

  private genToolPage(name: string): string {
    return `import { AppLayout } from '@/components/AppLayout';
import { FormBuilder } from '@/components/FormBuilder';
import { DataViewer } from '@/components/DataViewer';

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'User', 'Viewer'], required: false },
];

const sampleData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
];

export default function ToolPage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">${name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormBuilder fields={fields} />
        <DataViewer data={sampleData} />
      </div>
    </AppLayout>
  );
}
`;
  }

  private genAppLayout(): string {
    return `"use client";
import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4"><h1 className="text-lg font-semibold">Internal Tools</h1></header>
      <main className="p-6">{children}</main>
    </div>
  );
}
`;
  }

  private genFormBuilder(): string {
    return `"use client";
import React, { useState } from 'react';

interface Field { name: string; label: string; type: string; required?: boolean; options?: string[]; }

export function FormBuilder({ fields }: { fields: Field[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const handleChange = (name: string, value: string) => setValues(prev => ({ ...prev, [name]: value }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log(values); };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
      <h2 className="text-lg font-semibold">Form</h2>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</label>
          {field.type === 'select' ? (
            <select value={values[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select...</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input type={field.type} value={values[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} required={field.required} className="w-full border rounded-lg px-3 py-2" />
          )}
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Submit</button>
    </form>
  );
}
`;
  }

  private genDataViewer(): string {
    return `import React from 'react';

export function DataViewer({ data }: { data: any[] }) {
  if (data.length === 0) return <div className="bg-white p-6 rounded-lg border text-center text-gray-500">No data</div>;
  const columns = Object.keys(data[0]).filter(k => k !== 'id');
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 border-b"><h2 className="text-lg font-semibold">Data</h2></div>
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{columns.map(col => <th key={col} className="px-4 py-3 text-left text-sm font-medium capitalize">{col}</th>)}</tr></thead>
        <tbody className="divide-y">{data.map((row, i) => <tr key={i} className="hover:bg-gray-50">{columns.map(col => <td key={col} className="px-4 py-3 text-sm">{row[col]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
`;
  }

  private genTypes(): string {
    return `export interface Field { name: string; label: string; type: string; required?: boolean; options?: string[]; }
`;
  }
}
