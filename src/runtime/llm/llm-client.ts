// Phase 7.5: LLM Provider System

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type LLMProvider = 'openai' | 'anthropic' | 'openrouter';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

const DEFAULT_CONFIGS: Record<LLMProvider, Partial<LLMConfig>> = {
  openai: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  },
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1
  },
  openrouter: {
    model: 'openai/gpt-4o',
    temperature: 0.7,
    maxTokens: 4096
  }
};

export class LLMClient {
  private config: LLMConfig;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;

  constructor(config: LLMConfig) {
    this.config = {
      ...DEFAULT_CONFIGS[config.provider],
      ...config
    };

    this.initializeClient();
  }

  private initializeClient(): void {
    switch (this.config.provider) {
      case 'openai':
        this.openaiClient = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl
        });
        break;

      case 'anthropic':
        this.anthropicClient = new Anthropic({
          apiKey: this.config.apiKey
        });
        break;

      case 'openrouter':
        this.openaiClient = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl || 'https://openrouter.ai/api/v1'
        });
        break;
    }
  }

  async generate(messages: LLMMessage[]): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'openai':
      case 'openrouter':
        return this.generateOpenAI(messages);

      case 'anthropic':
        return this.generateAnthropic(messages);

      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async generateOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      })),
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      top_p: this.config.topP,
      frequency_penalty: this.config.frequencyPenalty,
      presence_penalty: this.config.presencePenalty
    });

    const choice = response.choices[0];
    return {
      content: choice.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      finishReason: choice.finish_reason || 'stop'
    };
  }

  private async generateAnthropic(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropicClient.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature,
      top_p: this.config.topP,
      system: systemMessage?.content || '',
      messages: nonSystemMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return {
      content: content.text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: response.stop_reason || 'end_turn'
    };
  }

  async *generateStream(messages: LLMMessage[]): AsyncGenerator<LLMStreamChunk> {
    if (this.config.provider === 'anthropic') {
      yield* this.generateStreamAnthropic(messages);
    } else {
      yield* this.generateStreamOpenAI(messages);
    }
  }

  private async *generateStreamOpenAI(messages: LLMMessage[]): AsyncGenerator<LLMStreamChunk> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const stream = await this.openaiClient.chat.completions.create({
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      })),
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          content: delta.content,
          done: false
        };
      }
      if (chunk.choices[0]?.finish_reason) {
        yield {
          content: '',
          done: true
        };
      }
    }
  }

  private async *generateStreamAnthropic(messages: LLMMessage[]): AsyncGenerator<LLMStreamChunk> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const stream = this.anthropicClient.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature,
      system: systemMessage?.content || '',
      messages: nonSystemMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          content: event.delta.text,
          done: false
        };
      }
      if (event.type === 'message_stop') {
        yield {
          content: '',
          done: true
        };
      }
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

export function createLLMClient(config: LLMConfig): LLMClient {
  return new LLMClient(config);
}

export function createLLMClientFromEnv(provider?: LLMProvider): LLMClient {
  const selectedProvider = provider || (process.env.LLM_PROVIDER as LLMProvider) || 'openai';

  let apiKey: string;
  let model: string;
  let baseUrl: string | undefined;

  switch (selectedProvider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY || '';
      model = process.env.OPENAI_MODEL || 'gpt-4o';
      break;

    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
      break;

    case 'openrouter':
      apiKey = process.env.OPENROUTER_API_KEY || '';
      model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';
      baseUrl = process.env.OPENROUTER_BASE_URL;
      break;

    default:
      throw new Error(`Unsupported provider: ${selectedProvider}`);
  }

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${selectedProvider}`);
  }

  return createLLMClient({
    provider: selectedProvider,
    model,
    apiKey,
    baseUrl
  });
}
