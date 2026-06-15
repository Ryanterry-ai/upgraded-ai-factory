import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig, sanitizeProjectName } from '../../generators/codegen.js';

export class SaasFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'SaaS Factory',
    type: 'saas',
    description: 'Generates SaaS applications with auth, billing, and multi-tenancy',
    supportedInputs: ['prompt', 'url', 'screenshot', 'figma'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /saas\b|subscription\s*(app|platform|service)|billing\s*(app|system|platform)|multi-tenant|tenant\s*(platform|app)|auth\s*(app|system)/i.test(lower);
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

    return this.createResult(true, 'saas', config.outputDir, files, blueprint, startTime, 'prompt');
  }

  private buildBlueprint(prompt: string, metadata: Record<string, unknown>): Blueprint {
    const name = this.extractName(prompt);

    return this.createBlueprint({
      project: { name, description: prompt.slice(0, 200), framework: 'nextjs', styling: 'tailwind', language: 'typescript', generatedAt: new Date().toISOString(), version: '0.1.0' },
      pages: [
        { path: '/', name: 'Home', description: 'Landing page', components: ['Header', 'Hero', 'Pricing', 'Footer'], isPrimary: true },
        { path: '/login', name: 'Login', description: 'Login page', components: ['LoginForm'], isPrimary: false },
        { path: '/register', name: 'Register', description: 'Registration page', components: ['RegisterForm'], isPrimary: false },
        { path: '/dashboard', name: 'Dashboard', description: 'Main dashboard', components: ['Sidebar', 'DashboardContent'], isPrimary: false },
        { path: '/settings', name: 'Settings', description: 'User settings', components: ['SettingsForm'], isPrimary: false },
      ],
      components: [
        { name: 'Header', type: 'organism', tag: 'header', classes: [], props: [{ name: 'user', type: 'User | null', required: false }], variants: [], children: [], parent: null, selector: 'header' },
        { name: 'Sidebar', type: 'organism', tag: 'aside', classes: [], props: [{ name: 'items', type: 'NavItem[]', required: true }], variants: [], children: [], parent: null, selector: 'aside' },
        { name: 'Footer', type: 'organism', tag: 'footer', classes: [], props: [], variants: [], children: [], parent: null, selector: 'footer' },
        { name: 'LoginForm', type: 'molecular', tag: 'form', classes: [], props: [], variants: [], children: [], parent: null, selector: '.login-form' },
        { name: 'RegisterForm', type: 'molecular', tag: 'form', classes: [], props: [], variants: [], children: [], parent: null, selector: '.register-form' },
        { name: 'DashboardContent', type: 'organism', tag: 'main', classes: [], props: [{ name: 'stats', type: 'Stats', required: true }], variants: [], children: [], parent: null, selector: 'main' },
        { name: 'SettingsForm', type: 'molecular', tag: 'form', classes: [], props: [{ name: 'user', type: 'User', required: true }], variants: [], children: [], parent: null, selector: '.settings-form' },
        { name: 'Button', type: 'atomic', tag: 'button', classes: [], props: [{ name: 'variant', type: "'primary' | 'secondary' | 'ghost'", required: false }], variants: [], children: [], parent: null, selector: 'button' },
        { name: 'Input', type: 'atomic', tag: 'input', classes: [], props: [{ name: 'label', type: 'string', required: true }, { name: 'type', type: 'string', required: false }], variants: [], children: [], parent: null, selector: 'input' },
      ],
      dataModels: [
        { name: 'User', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'email', type: 'string', required: true, unique: true }, { name: 'name', type: 'string', required: true, unique: false }, { name: 'role', type: 'string', required: true, unique: false }], relations: [] },
        { name: 'Tenant', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'name', type: 'string', required: true, unique: false }, { name: 'plan', type: 'string', required: true, unique: false }], relations: [{ type: 'one-to-many', target: 'User', field: 'users' }] },
        { name: 'Subscription', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'plan', type: 'string', required: true, unique: false }, { name: 'status', type: 'string', required: true, unique: false }], relations: [{ type: 'one-to-one', target: 'Tenant', field: 'tenantId' }] },
      ],
      apiContracts: [
        { method: 'POST', path: '/api/auth/login', description: 'Login', request: { email: 'string', password: 'string' }, response: { token: 'string' } },
        { method: 'POST', path: '/api/auth/register', description: 'Register', request: { email: 'string', password: 'string', name: 'string' }, response: { user: 'User' } },
        { method: 'GET', path: '/api/dashboard', description: 'Get dashboard data', request: {}, response: { stats: 'Stats' } },
      ],
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'My SaaS';
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = sanitizeProjectName(blueprint.project.name);
    return [
      { path: 'src/app/page.tsx', content: generatePage('Home', ['Header', 'Hero', 'Footer']), type: 'page' },
      { path: 'src/app/login/page.tsx', content: generatePage('Login', ['LoginForm']), type: 'page' },
      { path: 'src/app/register/page.tsx', content: generatePage('Register', ['RegisterForm']), type: 'page' },
      { path: 'src/app/dashboard/page.tsx', content: generatePage('Dashboard', ['Sidebar', 'DashboardContent']), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/LoginForm.tsx', content: this.genLoginForm(), type: 'component' },
      { path: 'src/components/RegisterForm.tsx', content: this.genRegisterForm(), type: 'component' },
      { path: 'src/components/Sidebar.tsx', content: this.genSidebar(), type: 'component' },
      { path: 'src/components/DashboardContent.tsx', content: this.genDashboardContent(), type: 'component' },
      { path: 'src/components/Header.tsx', content: this.genHeader(), type: 'component' },
      { path: 'src/components/Footer.tsx', content: this.genFooter(), type: 'component' },
      { path: 'src/components/Hero.tsx', content: this.genHero(), type: 'component' },
      { path: 'src/lib/types.ts', content: this.genTypes(), type: 'type' },
      { path: 'src/app/api/auth/login/route.ts', content: this.genLoginApi(), type: 'api' },
      { path: 'src/app/api/auth/register/route.ts', content: this.genRegisterApi(), type: 'api' },
      { path: generateConfig(name).filename, content: generateConfig(name).content, type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: generateTailwindConfig().filename, content: generateTailwindConfig().content, type: 'config' },
      { path: generatePostcssConfig().filename, content: generatePostcssConfig().content, type: 'config' },
    ];
  }

  private genLoginForm(): string {
    return `"use client";
import React, { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-md space-y-4 p-8 rounded-lg border">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Sign In</button>
      </form>
    </div>
  );
}
`;
  }

  private genRegisterForm(): string {
    return `"use client";
import React, { useState } from 'react';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-md space-y-4 p-8 rounded-lg border">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
        <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create Account</button>
      </form>
    </div>
  );
}
`;
  }

  private genSidebar(): string {
    return `import Link from 'next/link';

interface NavItem { label: string; href: string; icon?: string; }

const defaultItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Settings', href: '/settings' },
];

export function Sidebar({ items = defaultItems }: { items?: NavItem[] }) {
  return (
    <aside className="w-64 border-r min-h-screen p-4">
      <nav className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block px-4 py-2 rounded-lg hover:bg-gray-100">{item.label}</Link>
        ))}
      </nav>
    </aside>
  );
}
`;
  }

  private genDashboardContent(): string {
    return `interface Stats { users?: number; revenue?: number; growth?: number; }

export function DashboardContent({ stats = {} }: { stats?: Stats }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg"><p className="text-sm text-gray-500">Users</p><p className="text-2xl font-bold">{stats.users ?? 0}</p></div>
        <div className="p-4 border rounded-lg"><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold">\${stats.revenue ?? 0}</p></div>
        <div className="p-4 border rounded-lg"><p className="text-sm text-gray-500">Growth</p><p className="text-2xl font-bold">{stats.growth ?? 0}%</p></div>
      </div>
    </div>
  );
}
`;
  }

  private genTypes(): string {
    return `export interface User { id: string; email: string; name: string; role: string; }
export interface Tenant { id: string; name: string; plan: string; }
export interface Stats { users: number; revenue: number; growth: number; }
`;
  }

  private genLoginApi(): string {
    return `import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const { email, password } = await request.json();
  return NextResponse.json({ token: 'mock-token', user: { id: '1', email, name: 'User', role: 'admin' } });
}
`;
  }

  private genRegisterApi(): string {
    return `import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  return NextResponse.json({ user: { id: Date.now().toString(), email, name, role: 'user' } });
}
`;
  }

  private genHeader(): string {
    return `export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="text-xl font-bold">SaaS App</a>
        <div className="flex gap-6">
          <a href="/login" className="text-sm font-medium hover:text-primary">Login</a>
          <a href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark">Sign Up</a>
        </div>
      </nav>
    </header>
  );
}
`;
  }

  private genFooter(): string {
    return `export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <p className="text-sm text-gray-500 text-center">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
}
`;
  }

  private genHero(): string {
    return `export function Hero() {
  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Build Better Products</h1>
        <p className="mt-6 text-lg text-gray-600">The all-in-one platform for your team</p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/register" className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-dark">Get Started Free</a>
          <a href="/login" className="rounded-lg border px-6 py-3 hover:bg-gray-50">Learn More</a>
        </div>
      </div>
    </section>
  );
}
`;
  }
}
