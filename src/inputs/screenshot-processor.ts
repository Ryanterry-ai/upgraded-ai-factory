import * as fs from 'fs';
import type { StudioInput } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';

export class ScreenshotProcessor implements InputProcessor {
  type = 'screenshot' as const;

  canProcess(input: StudioInput): boolean {
    return !!input.screenshotPath;
  }

  async process(input: StudioInput): Promise<ProcessedInput> {
    const screenshotPath = input.screenshotPath!;
    
    if (!fs.existsSync(screenshotPath)) {
      throw new Error(`Screenshot not found: ${screenshotPath}`);
    }

    const stats = fs.statSync(screenshotPath);
    const ext = screenshotPath.split('.').pop()?.toLowerCase() || 'unknown';
    
    const prompt = input.prompt || this.generatePrompt(screenshotPath, ext);

    return {
      type: 'screenshot',
      prompt,
      metadata: {
        title: `Screenshot: ${screenshotPath.split('/').pop()}`,
        description: `Analyzed screenshot (${ext.toUpperCase()}, ${(stats.size / 1024).toFixed(1)}KB)`,
        structure: { format: ext, size: stats.size },
      },
    };
  }

  private generatePrompt(path: string, ext: string): string {
    const filename = path.split('/').pop() || 'screenshot';
    return `Build a website based on the design shown in ${filename}. Replicate the layout, colors, typography, and component structure visible in the screenshot.`;
  }
}
