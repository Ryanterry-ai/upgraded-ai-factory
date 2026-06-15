import type { StudioInput } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';

export class FigmaProcessor implements InputProcessor {
  type = 'figma' as const;

  canProcess(input: StudioInput): boolean {
    return !!input.figmaUrl;
  }

  async process(input: StudioInput): Promise<ProcessedInput> {
    const figmaUrl = input.figmaUrl!;
    const token = input.figmaToken;

    const fileId = this.extractFileId(figmaUrl);
    
    let figmaData: Record<string, unknown> = {};
    if (token && fileId) {
      try {
        figmaData = await this.fetchFigmaData(fileId, token) as Record<string, unknown>;
      } catch {
        figmaData = { error: 'Failed to fetch Figma data' };
      }
    }

    const prompt = input.prompt || this.generatePrompt(figmaUrl, figmaData);

    return {
      type: 'figma',
      prompt,
      url: figmaUrl,
      metadata: {
        title: (figmaData.name as string) || 'Figma Design',
        description: `Figma design: ${figmaUrl}`,
        structure: figmaData,
      },
    };
  }

  private extractFileId(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match?.[1] || null;
  }

  private async fetchFigmaData(fileId: string, token: string): Promise<Record<string, unknown>> {
    const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: { 'X-Figma-Token': token },
    });
    if (!response.ok) throw new Error('Figma API error');
    return response.json() as Promise<Record<string, unknown>>;
  }

  private generatePrompt(url: string, data: Record<string, unknown>): string {
    const name = (data.name as string) || 'Figma design';
    return `Implement the Figma design "${name}" from ${url}. Replicate the layout, components, colors, typography, and spacing exactly as shown in the design.`;
  }
}
