import type { StudioInput } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';

export class UrlProcessor implements InputProcessor {
  type = 'url' as const;

  canProcess(input: StudioInput): boolean {
    return !!input.url;
  }

  async process(input: StudioInput): Promise<ProcessedInput> {
    const url = input.url!;
    let html = '';

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      html = await response.text();
    } catch {
      html = '';
    }

    const title = this.extractTitle(html);
    const description = this.extractDescription(html);
    const structure = this.analyzeStructure(html);

    const prompt = input.prompt || this.generatePrompt(url, title, description, structure);

    return {
      type: 'url',
      prompt,
      url,
      metadata: { title, description, structure },
    };
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1]?.trim() || 'Website';
  }

  private extractDescription(html: string): string {
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    return match?.[1]?.trim() || '';
  }

  private analyzeStructure(html: string): Record<string, unknown> {
    const hasHeader = /<header/i.test(html) || /<nav/i.test(html);
    const hasFooter = /<footer/i.test(html);
    const hasSidebar = /<aside/i.test(html) || /sidebar/i.test(html);
    const hasHero = /hero/i.test(html);
    const hasCards = /card/i.test(html);
    const hasGrid = /grid/i.test(html);
    const hasForm = /<form/i.test(html);
    const hasTable = /<table/i.test(html);
    const hasModal = /modal/i.test(html);

    const headings: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`<h${i}[^>]*>([^<]+)</h${i}>`, 'gi');
      let match;
      while ((match = regex.exec(html)) !== null) {
        headings.push(match[1].trim());
      }
    }

    const images: string[] = [];
    const imgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      images.push(imgMatch[1]);
    }

    return { hasHeader, hasFooter, hasSidebar, hasHero, hasCards, hasGrid, hasForm, hasTable, hasModal, headings: headings.slice(0, 10), images: images.slice(0, 10) };
  }

  private generatePrompt(url: string, title: string, description: string, structure: Record<string, unknown>): string {
    const parts = [`Clone the website at ${url}`];
    if (title) parts.push(`titled "${title}"`);
    if (description) parts.push(`with description: ${description}`);
    
    const features: string[] = [];
    if (structure.hasHeader) features.push('header navigation');
    if (structure.hasFooter) features.push('footer');
    if (structure.hasSidebar) features.push('sidebar');
    if (structure.hasHero) features.push('hero section');
    if (structure.hasCards) features.push('card components');
    if (structure.hasForm) features.push('forms');
    if (structure.hasTable) features.push('data tables');
    
    if (features.length > 0) {
      parts.push(`Include: ${features.join(', ')}`);
    }
    
    return parts.join(' ');
  }
}
