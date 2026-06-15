import type { StudioInput } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';

export class PromptProcessor implements InputProcessor {
  type = 'prompt' as const;

  canProcess(input: StudioInput): boolean {
    return !!input.prompt && !input.url && !input.screenshotPath;
  }

  async process(input: StudioInput): Promise<ProcessedInput> {
    const rawPrompt = input.prompt!;
    const analysis = this.analyzePrompt(rawPrompt);

    return {
      type: 'prompt',
      prompt: rawPrompt,
      metadata: {
        title: analysis.title as string,
        description: rawPrompt.slice(0, 200),
        structure: analysis,
      },
    };
  }

  private analyzePrompt(prompt: string): Record<string, unknown> {
    const lower = prompt.toLowerCase();

    const keywords = {
      ecommerce: /shop|store|product|cart|checkout|ecommerce|e-commerce|buy|purchase|pricing|stripe/i.test(lower),
      saas: /saas|dashboard|admin|subscription|billing|tenant|multi-tenant|app|platform/i.test(lower),
      blog: /blog|post|article|content|cms|markdown/i.test(lower),
      portfolio: /portfolio|showcase|work|projects|gallery/i.test(lower),
      landing: /landing|page|marketing|hero|cta|convert/i.test(lower),
      agent: /agent|chatbot|chat|ai|assistant|bot/i.test(lower),
      tools: /tool|internal|crud|panel|management/i.test(lower),
    };

    const features: string[] = [];
    if (/auth|login|register|sign.?in|sign.?up/i.test(lower)) features.push('authentication');
    if (/search|filter|find/i.test(lower)) features.push('search');
    if (/table|data|list/i.test(lower)) features.push('data-tables');
    if (/form|input|submit/i.test(lower)) features.push('forms');
    if (/chart|graph|analytics|metric/i.test(lower)) features.push('charts');
    if (/modal|dialog|popup/i.test(lower)) features.push('modals');
    if (/nav|menu|sidebar/i.test(lower)) features.push('navigation');
    if (/footer/i.test(lower)) features.push('footer');
    if (/responsive|mobile|tablet/i.test(lower)) features.push('responsive');
    if (/dark.?mode|theme/i.test(lower)) features.push('dark-mode');

    let title = 'Project';
    const titleMatch = prompt.match(/(?:called?|named?|titled?)\s+["']?([^"']+)["']?/i);
    if (titleMatch) title = titleMatch[1] || 'Project';
    else {
      const words = prompt.split(/\s+/).slice(0, 3).join(' ');
      title = words.charAt(0).toUpperCase() + words.slice(1);
    }

    return { title, keywords, features, type: this.detectType(keywords) };
  }

  private detectType(keywords: Record<string, boolean>): string {
    if (keywords.ecommerce) return 'ecommerce';
    if (keywords.agent) return 'agent';
    if (keywords.tools) return 'tools';
    if (keywords.saas) return 'saas';
    if (keywords.blog) return 'website';
    if (keywords.portfolio) return 'website';
    if (keywords.landing) return 'website';
    return 'website';
  }
}
