import type { StudioInput, InputType } from '../core/types.js';
import type { InputProcessor, ProcessedInput } from './types.js';
import { UrlProcessor } from './url-processor.js';
import { ScreenshotProcessor } from './screenshot-processor.js';
import { PromptProcessor } from './prompt-processor.js';
import { FigmaProcessor } from './figma-processor.js';
import { PdfProcessor } from './pdf-processor.js';
import { CodebaseProcessor } from './codebase-processor.js';

const processors: InputProcessor[] = [
  new UrlProcessor(),
  new ScreenshotProcessor(),
  new PromptProcessor(),
  new FigmaProcessor(),
  new PdfProcessor(),
  new CodebaseProcessor(),
];

export function detectInputType(input: StudioInput): InputType {
  if (input.url) return 'url';
  if (input.screenshotPath) return 'screenshot';
  if (input.figmaUrl) return 'figma';
  if (input.pdfPath) return 'pdf';
  if (input.codebasePath) return 'codebase';
  return 'prompt';
}

export async function processInput(input: StudioInput): Promise<ProcessedInput> {
  const type = detectInputType(input);
  const processor = processors.find(p => p.type === type);
  
  if (!processor) {
    throw new Error(`No processor found for input type: ${type}`);
  }

  return processor.process(input);
}

export function getProcessor(type: InputType): InputProcessor | undefined {
  return processors.find(p => p.type === type);
}
