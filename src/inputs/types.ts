import type { StudioInput, InputType } from '../core/types.js';

export interface InputProcessor {
  type: InputType;
  canProcess(input: StudioInput): boolean;
  process(input: StudioInput): Promise<ProcessedInput>;
}

export interface ProcessedInput {
  type: InputType;
  prompt: string;
  url?: string;
  metadata: InputMetadata;
}

export interface InputMetadata {
  title?: string;
  description?: string;
  structure?: Record<string, unknown>;
  design?: Record<string, unknown>;
  components?: Record<string, unknown>;
  [key: string]: unknown;
}
