import * as fs from 'fs';
import type { StudioInput } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';

export class PdfProcessor implements InputProcessor {
  type = 'pdf' as const;

  canProcess(input: StudioInput): boolean {
    return !!input.pdfPath;
  }

  async process(input: StudioInput): Promise<ProcessedInput> {
    const pdfPath = input.pdfPath!;
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF not found: ${pdfPath}`);
    }

    const stats = fs.statSync(pdfPath);
    const filename = pdfPath.split('/').pop() || 'document.pdf';
    
    let textContent = '';
    try {
      const buffer = fs.readFileSync(pdfPath);
      textContent = this.extractTextFromPdf(buffer);
    } catch {
      textContent = '[PDF content could not be extracted]';
    }

    const prompt = input.prompt || this.generatePrompt(filename, textContent);

    return {
      type: 'pdf',
      prompt,
      metadata: {
        title: `PDF: ${filename}`,
        description: `PDF document (${(stats.size / 1024).toFixed(1)}KB)`,
        structure: { filename, size: stats.size, textPreview: textContent.slice(0, 500) },
      },
    };
  }

  private extractTextFromPdf(buffer: Buffer): string {
    const text = buffer.toString('utf-8');
    const textParts: string[] = [];
    const regex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const inner = match[0];
      const textRegex = /\(([^)]+)\)/g;
      let textMatch;
      while ((textMatch = textRegex.exec(inner)) !== null) {
        textParts.push(textMatch[1]);
      }
    }
    return textParts.join(' ').slice(0, 2000) || '[PDF binary content]';
  }

  private generatePrompt(filename: string, content: string): string {
    const contentSummary = content.slice(0, 300).replace(/\s+/g, ' ');
    return `Build a web application based on the PDF document "${filename}". Content summary: ${contentSummary}`;
  }
}
