import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig, sanitizeProjectName } from '../../generators/codegen.js';

export class AdminFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'Admin Panel Factory',
    type: 'admin',
    description: 'Generates admin dashboards with CRUD, user management, and data tables',
    supportedInputs: ['prompt', 'url', 'screenshot', 'figma'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /admin\s*(panel|dashboard|page)|backoffice|admin\s*console|crud\s*(app|panel|dashboard)|manage(ment)?\s*(panel|dashboard|app|console)/i.test(lower);
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

    return this.createResult(true, 'admin', config.outputDir, files, blueprint, startTime, 'prompt');
  }

  private buildBlueprint(prompt: string, _metadata: Record<string, unknown>): Blueprint {
    const name = this.extractName(prompt);
    return this.createBlueprint({
      project: { name, description: prompt.slice(0, 200), framework: 'nextjs', styling: 'tailwind', language: 'typescript', generatedAt: new Date().toISOString(), version: '0.1.0' },
      pages: [
        { path: '/', name: 'Dashboard', description: 'Admin dashboard', components: ['AdminLayout', 'StatsOverview'], isPrimary: true },
        { path: '/users', name: 'Users', description: 'User management', components: ['AdminLayout', 'DataTable', 'UserActions'], isPrimary: false },
        { path: '/settings', name: 'Settings', description: 'System settings', components: ['AdminLayout', 'SettingsForm'], isPrimary: false },
      ],
      components: [
        { name: 'AdminLayout', type: 'template', tag: 'div', classes: [], props: [{ name: 'children', type: 'ReactNode', required: true }], variants: [], children: [], parent: null, selector: '.admin-layout' },
        { name: 'Sidebar', type: 'organism', tag: 'aside', classes: [], props: [{ name: 'items', type: 'NavItem[]', required: true }], variants: [], children: [], parent: null, selector: 'aside' },
        { name: 'DataTable', type: 'organism', tag: 'table', classes: [], props: [{ name: 'columns', type: 'Column[]', required: true }, { name: 'data', type: 'any[]', required: true }], variants: [], children: [], parent: null, selector: 'table' },
        { name: 'StatsOverview', type: 'organism', tag: 'div', classes: [], props: [{ name: 'stats', type: 'Stat[]', required: true }], variants: [], children: [], parent: null, selector: '.stats' },
        { name: 'Button', type: 'atomic', tag: 'button', classes: [], props: [{ name: 'variant', type: 'string', required: false }], variants: [], children: [], parent: null, selector: 'button' },
      ],
      dataModels: [
        { name: 'User', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'email', type: 'string', required: true, unique: true }, { name: 'name', type: 'string', required: true, unique: false }, { name: 'role', type: 'string', required: true, unique: false }, { name: 'status', type: 'string', required: true, unique: false }], relations: [] },
      ],
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'Admin Panel';
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = sanitizeProjectName(blueprint.project.name);
    return [
      { path: 'src/app/page.tsx', content: this.genDashboardPage(), type: 'page' },
      { path: 'src/app/users/page.tsx', content: this.genUsersPage(), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/AdminLayout.tsx', content: this.genAdminLayout(), type: 'component' },
      { path: 'src/components/Sidebar.tsx', content: this.genSidebar(), type: 'component' },
      { path: 'src/components/DataTable.tsx', content: this.genDataTable(), type: 'component' },
      { path: 'src/components/StatsOverview.tsx', content: this.genStatsOverview(), type: 'component' },
      { path: 'src/lib/types.ts', content: this.genTypes(), type: 'type' },
      { path: 'src/app/api/users/route.ts', content: this.genUsersApi(), type: 'api' },
      { path: generateConfig(name).filename, content: generateConfig(name).content, type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: generateTailwindConfig().filename, content: generateTailwindConfig().content, type: 'config' },
      { path: generatePostcssConfig().filename, content: generatePostcssConfig().content, type: 'config' },
    ];
  }

  private genDashboardPage(): string {
    return `import { AdminLayout } from '@/components/AdminLayout';
import { StatsOverview } from '@/components/StatsOverview';

const stats = [
  { label: 'Total Users', value: '1,234', change: '+12%' },
  { label: 'Revenue', value: '$45,678', change: '+8%' },
  { label: 'Orders', value: '890', change: '+5%' },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <StatsOverview stats={stats} />
    </AdminLayout>
  );
}
`;
  }

  private genUsersPage(): string {
    return `import { AdminLayout } from '@/components/AdminLayout';
import { DataTable } from '@/components/DataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
];

const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
];

export default function UsersPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <DataTable columns={columns} data={users} />
    </AdminLayout>
  );
}
`;
  }

  private genAdminLayout(): string {
    return `"use client";
import React from 'react';
import { Sidebar } from './Sidebar';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Users', href: '/users' },
  { label: 'Settings', href: '/settings' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
`;
  }

  private genSidebar(): string {
    return `"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem { label: string; href: string; }

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <div className="mb-8 text-xl font-bold px-4">Admin</div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={\`block px-4 py-2 rounded-lg \${pathname === item.href ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}\`}>{item.label}</Link>
        ))}
      </nav>
    </aside>
  );
}
`;
  }

  private genDataTable(): string {
    return `import React from 'react';

interface Column { key: string; label: string; }
interface DataTableProps { columns: Column[]; data: any[]; }

export function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>{columns.map((col) => <th key={col.key} className="px-4 py-3 text-left text-sm font-medium">{col.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => <td key={col.key} className="px-4 py-3 text-sm">{row[col.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;
  }

  private genStatsOverview(): string {
    return `import React from 'react';

interface Stat { label: string; value: string; change: string; }

export function StatsOverview({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="p-6 border rounded-lg">
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="text-3xl font-bold mt-1">{stat.value}</p>
          <p className="text-sm text-green-600 mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
  );
}
`;
  }

  private genTypes(): string {
    return `export interface User { id: string; email: string; name: string; role: string; status: string; }
export interface Stat { label: string; value: string; change: string; }
export interface Column { key: string; label: string; }
`;
  }

  private genUsersApi(): string {
    return `import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ users: [{ id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }] });
}
`;
  }
}
