import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile, FactoryType } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig } from '../../generators/codegen.js';

export class WebsiteFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'Website Factory',
    type: 'website',
    description: 'Generates marketing websites, landing pages, blogs, and portfolios',
    supportedInputs: ['prompt', 'url', 'screenshot', 'figma', 'pdf', 'codebase'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.url) return true;
    if (input.screenshotPath) return true;
    if (input.figmaUrl) return true;
    if (input.pdfPath) return true;
    if (input.codebasePath) return true;
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /website|landing|blog|portfolio|page|site|clone|marketing|hero|footer|header|nav/i.test(lower);
    }
    return false;
  }

  async execute(input: StudioInput, config: EngineConfig): Promise<FactoryResult> {
    const startTime = Date.now();
    const files: GeneratedFile[] = [];

    const processed = await processInput(input);
    const prompt = processed.prompt;

    const blueprint = this.buildBlueprint(prompt, processed.metadata);
    const projectName = blueprint.project.name;

    const projectFiles = this.generateProjectFiles(blueprint);
    files.push(...projectFiles);

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

    return this.createResult(true, 'website', config.outputDir, files, blueprint, startTime, input.url ? 'url' : 'prompt');
  }

  private buildBlueprint(prompt: string, metadata: Record<string, unknown>): Blueprint {
    const name = (metadata.title as string) || this.extractName(prompt);
    const structure = metadata.structure as Record<string, unknown> || {};

    const pages = this.extractPages(prompt, structure);
    const components = this.extractComponents(prompt, structure);

    return this.createBlueprint({
      project: {
        name,
        description: prompt.slice(0, 200),
        framework: 'nextjs',
        styling: 'tailwind',
        language: 'typescript',
        url: metadata.url as string,
        generatedAt: new Date().toISOString(),
        version: '0.1.0',
      },
      pages,
      components,
      seo: {
        title: name,
        description: prompt.slice(0, 160),
        keywords: this.extractKeywords(prompt),
        openGraph: { title: name, description: prompt.slice(0, 160), image: '/og.png', type: 'website' },
        structuredData: [],
        sitemap: true,
        robots: 'index, follow',
      },
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|titled?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'My Website';
  }

  private extractPages(prompt: string, structure: Record<string, unknown>): Blueprint['pages'] {
    const pages = [{ path: '/', name: 'Home', description: 'Home page', components: ['Header', 'Hero', 'Features', 'Footer'], isPrimary: true }];

    if (/about/i.test(prompt)) pages.push({ path: '/about', name: 'About', description: 'About page', components: ['Header', 'AboutContent', 'Footer'], isPrimary: false });
    if (/contact/i.test(prompt)) pages.push({ path: '/contact', name: 'Contact', description: 'Contact page', components: ['Header', 'ContactForm', 'Footer'], isPrimary: false });
    if (/blog|post/i.test(prompt)) pages.push({ path: '/blog', name: 'Blog', description: 'Blog listing', components: ['Header', 'BlogList', 'Footer'], isPrimary: false });
    if (/pricing/i.test(prompt)) pages.push({ path: '/pricing', name: 'Pricing', description: 'Pricing page', components: ['Header', 'PricingTable', 'Footer'], isPrimary: false });

    const headings = (structure.headings as string[]) || [];
    headings.forEach(h => {
      if (/about|feature|service/i.test(h) && !pages.find(p => p.path === '/about')) {
        pages.push({ path: '/about', name: h, description: h, components: ['Header', 'Content', 'Footer'], isPrimary: false });
      }
    });

    return pages;
  }

  private extractComponents(prompt: string, structure: Record<string, unknown>): Blueprint['components'] {
    const components: Blueprint['components'] = [];

    components.push({ name: 'Header', type: 'organism', tag: 'header', classes: ['header'], props: [{ name: 'children', type: 'ReactNode', required: false }], variants: [], children: [], parent: null, selector: 'header' });
    components.push({ name: 'Footer', type: 'organism', tag: 'footer', classes: ['footer'], props: [{ name: 'children', type: 'ReactNode', required: false }], variants: [], children: [], parent: null, selector: 'footer' });
    components.push({ name: 'Hero', type: 'organism', tag: 'section', classes: ['hero'], props: [{ name: 'title', type: 'string', required: true }, { name: 'subtitle', type: 'string', required: false }], variants: [], children: [], parent: null, selector: '.hero' });
    components.push({ name: 'Button', type: 'atomic', tag: 'button', classes: ['btn'], props: [{ name: 'variant', type: "'primary' | 'secondary' | 'ghost'", required: false }, { name: 'size', type: "'sm' | 'md' | 'lg'", required: false }], variants: [{ name: 'primary', description: 'Primary button' }, { name: 'secondary', description: 'Secondary button' }], children: [], parent: null, selector: 'button' });
    components.push({ name: 'Card', type: 'molecular', tag: 'div', classes: ['card'], props: [{ name: 'title', type: 'string', required: true }, { name: 'description', type: 'string', required: false }], variants: [], children: [], parent: null, selector: '.card' });

    if (/feature/i.test(prompt)) components.push({ name: 'Features', type: 'organism', tag: 'section', classes: ['features'], props: [{ name: 'items', type: 'Feature[]', required: true }], variants: [], children: [], parent: null, selector: '.features' });
    if (/testimonial|review/i.test(prompt)) components.push({ name: 'Testimonials', type: 'organism', tag: 'section', classes: ['testimonials'], props: [{ name: 'items', type: 'Testimonial[]', required: true }], variants: [], children: [], parent: null, selector: '.testimonials' });
    if (/cta|call.?to.?action/i.test(prompt)) components.push({ name: 'CTA', type: 'organism', tag: 'section', classes: ['cta'], props: [{ name: 'title', type: 'string', required: true }, { name: 'buttonText', type: 'string', required: true }], variants: [], children: [], parent: null, selector: '.cta' });
    if (/pricing/i.test(prompt)) components.push({ name: 'PricingTable', type: 'organism', tag: 'section', classes: ['pricing'], props: [{ name: 'plans', type: 'Plan[]', required: true }], variants: [], children: [], parent: null, selector: '.pricing' });
    if (/contact|form/i.test(prompt)) components.push({ name: 'ContactForm', type: 'molecular', tag: 'form', classes: ['contact-form'], props: [], variants: [], children: [], parent: null, selector: '.contact-form' });
    if (/blog|post/i.test(prompt)) components.push({ name: 'BlogList', type: 'organism', tag: 'section', classes: ['blog-list'], props: [{ name: 'posts', type: 'Post[]', required: true }], variants: [], children: [], parent: null, selector: '.blog-list' });
    if (/newsletter|subscribe/i.test(prompt)) components.push({ name: 'Newsletter', type: 'molecular', tag: 'section', classes: ['newsletter'], props: [{ name: 'title', type: 'string', required: true }], variants: [], children: [], parent: null, selector: '.newsletter' });

    return components;
  }

  private extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return [...new Set(words)].slice(0, 10);
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = blueprint.project.name;
    return [
      { path: 'src/app/page.tsx', content: generatePage('Home', ['Header', 'Hero', 'Features', 'Footer']), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/Header.tsx', content: this.genComponent('Header', { children: 'ReactNode' }), type: 'component' },
      { path: 'src/components/Footer.tsx', content: this.genComponent('Footer', { children: 'ReactNode' }), type: 'component' },
      { path: 'src/components/Hero.tsx', content: this.genComponent('Hero', { title: 'string', subtitle: 'string' }), type: 'component' },
      { path: 'src/components/Button.tsx', content: this.genComponent('Button', { variant: "'primary' | 'secondary'", children: 'ReactNode' }), type: 'component' },
      { path: 'src/components/Card.tsx', content: this.genComponent('Card', { title: 'string', description: 'string' }), type: 'component' },
      { path: 'src/components/Features.tsx', content: this.genComponent('Features', { items: 'Feature[]' }), type: 'component' },
      { path: 'next.config.ts', content: generateConfig(name), type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: 'tailwind.config.ts', content: generateTailwindConfig(), type: 'config' },
      { path: 'postcss.config.js', content: generatePostcssConfig(), type: 'config' },
    ];
  }

  private genComponent(name: string, props: Record<string, string>): string {
    const propInterface = Object.entries(props).map(([k, v]) => `  ${k}: ${v};`).join('\n');
    return `import React from 'react';

interface ${name}Props {
${propInterface}
}

export function ${name}({ ${Object.keys(props).join(', ')} }: ${name}Props) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2>${name}</h2>
      </div>
    </section>
  );
}
`;
  }
}
