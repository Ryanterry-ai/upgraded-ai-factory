const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const MODEL = 'text-embedding-3-small';
const DIMENSIONS = 1536;

export interface EmbeddingConfig {
  apiKey?: string;
  model?: string;
  dimensions?: number;
}

export class EmbeddingService {
  private apiKey: string;
  private model: string;
  private dimensions: number;

  constructor(config?: EmbeddingConfig) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = config?.model || MODEL;
    this.dimensions = config?.dimensions || DIMENSIONS;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return this.fallbackEmbed(text);
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: text.substring(0, 8000),
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        console.warn(`Embedding API error: ${response.status}, using fallback`);
        return this.fallbackEmbed(text);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      return data.data[0].embedding;
    } catch (error) {
      console.warn(`Embedding failed, using fallback: ${error}`);
      return this.fallbackEmbed(text);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      return Promise.all(texts.map(t => this.fallbackEmbed(t)));
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: texts.map(t => t.substring(0, 8000)),
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        console.warn(`Batch embedding API error: ${response.status}, using fallback`);
        return Promise.all(texts.map(t => this.fallbackEmbed(t)));
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      return data.data.map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      console.warn(`Batch embedding failed, using fallback: ${error}`);
      return Promise.all(texts.map(t => this.fallbackEmbed(t)));
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private fallbackEmbed(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
      }
      const idx = Math.abs(hash) % this.dimensions;
      vector[idx] += 1 / (i + 1);
    }

    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

export function createEmbeddingService(config?: Partial<EmbeddingConfig>): EmbeddingService {
  return new EmbeddingService(config);
}
