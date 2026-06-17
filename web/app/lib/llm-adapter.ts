import { getEnv } from "./env";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
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

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function callLLM(
  messages: LLMMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse> {
  const env = getEnv();
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured — LLM calls disabled");
  }

  const model = options?.model || "gpt-4o-mini";
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 2048;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || "",
    model: data.model || model,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    finishReason: choice?.finish_reason || "stop",
  };
}

export async function callLLMWithFallback(
  messages: LLMMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse & { usedFallback: boolean }> {
  try {
    const result = await callLLM(messages, options);
    return { ...result, usedFallback: false };
  } catch (err) {
    console.warn("LLM call failed, using fallback:", err);
    return {
      content: "",
      model: options?.model || "gpt-4o-mini",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "error",
      usedFallback: true,
    };
  }
}

export function isLLMAvailable(): boolean {
  const env = getEnv();
  return !!env.OPENAI_API_KEY;
}
