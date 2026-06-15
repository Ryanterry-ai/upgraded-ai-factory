import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig } from '../../generators/codegen.js';

export class DashboardFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'Dashboard Factory',
    type: 'dashboard',
    description: 'Generates analytics dashboards with charts, metrics, and data visualization',
    supportedInputs: ['prompt', 'url', 'screenshot', 'figma'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /analytics\s*(dashboard|app)|dashboard\s*(app|page)|chart\s*(app|dashboard)|data\s*(visualization|dashboard)|kpi\s*(dashboard|tracker)|metrics?\s*(dashboard|app)/i.test(lower);
    }
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

    return this.createResult(true, 'dashboard', config.outputDir, files, blueprint, startTime, 'prompt');
  }

  private buildBlueprint(prompt: string, _metadata: Record<string, unknown>): Blueprint {
    const name = this.extractName(prompt);
    return this.createBlueprint({
      project: { name, description: prompt.slice(0, 200), framework: 'nextjs', styling: 'tailwind', language: 'typescript', generatedAt: new Date().toISOString(), version: '0.1.0' },
      pages: [
        { path: '/', name: 'Dashboard', description: 'Main dashboard', components: ['DashboardLayout', 'MetricCards', 'Charts'], isPrimary: true },
      ],
      components: [
        { name: 'DashboardLayout', type: 'template', tag: 'div', classes: [], props: [{ name: 'children', type: 'ReactNode', required: true }], variants: [], children: [], parent: null, selector: '.dashboard-layout' },
        { name: 'MetricCards', type: 'organism', tag: 'div', classes: [], props: [{ name: 'metrics', type: 'Metric[]', required: true }], variants: [], children: [], parent: null, selector: '.metrics' },
        { name: 'LineChart', type: 'molecular', tag: 'div', classes: [], props: [{ name: 'data', type: 'ChartData', required: true }, { name: 'title', type: 'string', required: true }], variants: [], children: [], parent: null, selector: '.line-chart' },
        { name: 'BarChart', type: 'molecular', tag: 'div', classes: [], props: [{ name: 'data', type: 'ChartData', required: true }, { name: 'title', type: 'string', required: true }], variants: [], children: [], parent: null, selector: '.bar-chart' },
        { name: 'DataTable', type: 'organism', tag: 'table', classes: [], props: [{ name: 'columns', type: 'Column[]', required: true }, { name: 'data', type: 'any[]', required: true }], variants: [], children: [], parent: null, selector: 'table' },
      ],
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'Analytics Dashboard';
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = blueprint.project.name;
    return [
      { path: 'src/app/page.tsx', content: this.genDashboardPage(), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/DashboardLayout.tsx', content: this.genDashboardLayout(), type: 'component' },
      { path: 'src/components/MetricCards.tsx', content: this.genMetricCards(), type: 'component' },
      { path: 'src/components/LineChart.tsx', content: this.genLineChart(), type: 'component' },
      { path: 'src/components/BarChart.tsx', content: this.genBarChart(), type: 'component' },
      { path: 'src/components/DataTable.tsx', content: this.genDataTable(), type: 'component' },
      { path: 'src/lib/types.ts', content: this.genTypes(), type: 'type' },
      { path: 'src/lib/mock-data.ts', content: this.genMockData(), type: 'util' },
      { path: 'src/app/api/metrics/route.ts', content: this.genMetricsApi(), type: 'api' },
      { path: 'next.config.ts', content: generateConfig(name), type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: 'tailwind.config.ts', content: generateTailwindConfig(), type: 'config' },
      { path: 'postcss.config.js', content: generatePostcssConfig(), type: 'config' },
    ];
  }

  private genDashboardPage(): string {
    return `import { DashboardLayout } from '@/components/DashboardLayout';
import { MetricCards } from '@/components/MetricCards';
import { LineChart } from '@/components/LineChart';
import { BarChart } from '@/components/BarChart';
import { DataTable } from '@/components/DataTable';
import { metrics, revenueData, salesData, recentOrders } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      <MetricCards metrics={metrics} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <LineChart data={revenueData} title="Revenue Over Time" />
        <BarChart data={salesData} title="Sales by Category" />
      </div>
      <div className="mt-6">
        <DataTable columns={[{ key: 'id', label: 'Order ID' }, { key: 'customer', label: 'Customer' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }]} data={recentOrders} />
      </div>
    </DashboardLayout>
  );
}
`;
  }

  private genDashboardLayout(): string {
    return `"use client";
import React from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4"><h1 className="text-lg font-semibold">Dashboard</h1></header>
      <main className="p-6">{children}</main>
    </div>
  );
}
`;
  }

  private genMetricCards(): string {
    return `import React from 'react';

interface Metric { label: string; value: string; change: string; icon?: string; }

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-500">{m.label}</p>
          <p className="text-3xl font-bold mt-1">{m.value}</p>
          <p className={\`text-sm mt-1 \${m.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}\`}>{m.change}</p>
        </div>
      ))}
    </div>
  );
}
`;
  }

  private genLineChart(): string {
    return `import React from 'react';

interface DataPoint { label: string; value: number; }
export function LineChart({ data, title }: { data: DataPoint[]; title: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-48">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-blue-500 rounded-t" style={{ height: \`\${(d.value / max) * 100}%\` }} />
            <span className="text-xs mt-1 text-gray-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
  }

  private genBarChart(): string {
    return `import React from 'react';

interface DataPoint { label: string; value: number; }
export function BarChart({ data, title }: { data: DataPoint[]; title: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm w-24 text-gray-600">{d.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: \`\${(d.value / max) * 100}%\` }} />
            </div>
            <span className="text-sm font-medium w-12 text-right">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
  }

  private genDataTable(): string {
    return `import React from 'react';

interface Column { key: string; label: string; }
export function DataTable({ columns, data }: { columns: Column[]; data: any[] }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{columns.map(c => <th key={c.key} className="px-4 py-3 text-left text-sm font-medium">{c.label}</th>)}</tr></thead>
        <tbody className="divide-y">{data.map((row, i) => <tr key={i} className="hover:bg-gray-50">{columns.map(c => <td key={c.key} className="px-4 py-3 text-sm">{row[c.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
`;
  }

  private genTypes(): string {
    return `export interface Metric { label: string; value: string; change: string; }
export interface DataPoint { label: string; value: number; }
export interface Column { key: string; label: string; }
`;
  }

  private genMockData(): string {
    return `export const metrics = [
  { label: 'Total Revenue', value: '$45,231', change: '+20.1%' },
  { label: 'Subscriptions', value: '2,350', change: '+10.3%' },
  { label: 'Sales', value: '12,234', change: '+5.7%' },
  { label: 'Active Users', value: '573', change: '-2.4%' },
];

export const revenueData = [
  { label: 'Jan', value: 4000 },
  { label: 'Feb', value: 3000 },
  { label: 'Mar', value: 5000 },
  { label: 'Apr', value: 4500 },
  { label: 'May', value: 6000 },
  { label: 'Jun', value: 5500 },
];

export const salesData = [
  { label: 'Electronics', value: 340 },
  { label: 'Clothing', value: 225 },
  { label: 'Books', value: 180 },
  { label: 'Home', value: 150 },
];

export const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: '$125.00', status: 'Completed' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: '$89.99', status: 'Processing' },
  { id: 'ORD-003', customer: 'Bob Wilson', amount: '$234.50', status: 'Shipped' },
];
`;
  }

  private genMetricsApi(): string {
    return `import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ metrics: [{ label: 'Revenue', value: 45231, change: 20.1 }] });
}
`;
  }
}
