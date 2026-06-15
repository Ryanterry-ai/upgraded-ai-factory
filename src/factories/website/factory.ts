import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile, FactoryType } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig, sanitizeProjectName } from '../../generators/codegen.js';

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
    const rawName = (metadata.title as string) || this.extractName(prompt);
    const name = sanitizeProjectName(rawName);
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
    const nextConfig = generateConfig(name);
    const tailwindConfig = generateTailwindConfig();
    const postcssConfig = generatePostcssConfig();

    return [
      { path: 'src/app/page.tsx', content: generatePage('Home', ['Header', 'Hero', 'Features', 'Footer']), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/Header.tsx', content: this.genComponent('Header', {}), type: 'component' },
      { path: 'src/components/Footer.tsx', content: this.genComponent('Footer', {}), type: 'component' },
      { path: 'src/components/Hero.tsx', content: this.genComponent('Hero', {}), type: 'component' },
      { path: 'src/components/Button.tsx', content: this.genComponent('Button', {}), type: 'component' },
      { path: 'src/components/Card.tsx', content: this.genComponent('Card', {}), type: 'component' },
      { path: 'src/components/Features.tsx', content: this.genComponent('Features', {}), type: 'component' },
      { path: nextConfig.filename, content: nextConfig.content, type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: tailwindConfig.filename, content: tailwindConfig.content, type: 'config' },
      { path: postcssConfig.filename, content: postcssConfig.content, type: 'config' },
    ];
  }

  private genComponent(name: string, props: Record<string, string>): string {
    const propInterface = Object.entries(props).map(([k, v]) => `  ${k}?: ${v};`).join('\n');
    const propNames = Object.keys(props);

    // Generate meaningful content based on component name
    const content = this.getComponentContent(name);

    if (propNames.length === 0) {
      return `export function ${name}() {
  return (
    ${content}
  );
}
`;
    }

    return `interface ${name}Props {
${propInterface}
}

export function ${name}({ ${propNames.join(', ')} }: ${name}Props) {
  return (
    ${content}
  );
}
`;
  }

  private getComponentContent(name: string): string {
    switch (name) {
      case 'Header':
        return `<header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="text-xl font-bold">Brand</div>
        <div className="flex gap-6">
          <a href="#" className="text-sm font-medium hover:text-primary">Home</a>
          <a href="#" className="text-sm font-medium hover:text-primary">About</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Contact</a>
        </div>
      </nav>
    </header>`;
      case 'Footer':
        return `<footer className="border-t bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</a>
          </div>
        </div>
      </div>
    </footer>`;
      case 'Hero':
        return `<section className="py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome
        </h1>
        <p className="mt-6 text-lg text-gray-600 md:text-xl">
          Build something amazing with our platform.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-dark">
            Get Started
          </button>
          <button className="rounded-lg border px-6 py-3 hover:bg-gray-50">
            Learn More
          </button>
        </div>
      </div>
    </section>`;
      case 'Features':
        return `<section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Fast</h3>
            <p className="mt-2 text-gray-600">Lightning fast performance.</p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Secure</h3>
            <p className="mt-2 text-gray-600">Enterprise-grade security.</p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Easy</h3>
            <p className="mt-2 text-gray-600">Simple to use and deploy.</p>
          </div>
        </div>
      </div>
    </section>`;
      case 'Button':
        return `<button className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark">
      Click me
    </button>`;
      case 'Card':
        return `<div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-xl font-semibold">Card Title</h3>
      <p className="mt-2 text-gray-600">Card description goes here.</p>
    </div>`;
      default:
        return `<section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold">${name}</h2>
      </div>
    </section>`;
    }
  }
}
