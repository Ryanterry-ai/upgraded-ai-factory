// Phase 7.5: Memory Retrieval Layer

import { RuntimeMemory } from '../memory/runtime-memory.js';
import { AgentArtifact } from '../state/agent-state.js';

export interface RetrievalQuery {
  text: string;
  type?: string;
  limit?: number;
  minConfidence?: number;
}

export interface RetrievalResult {
  id: string;
  type: string;
  content: unknown;
  confidence: number;
  source: string;
  score: number;
}

export interface MemoryRetriever {
  retrieve(query: RetrievalQuery): RetrievalResult[];
  store(type: string, content: unknown, confidence: number, source: string): void;
  getStats(): RetrievalStats;
}

export interface RetrievalStats {
  totalEntries: number;
  byType: Record<string, number>;
  averageConfidence: number;
}

export class InMemoryRetriever implements MemoryRetriever {
  private memory: RuntimeMemory;
  private entries: Map<string, { type: string; content: unknown; confidence: number; source: string; embedding?: number[] }> = new Map();

  constructor(memory: RuntimeMemory) {
    this.memory = memory;
  }

  retrieve(query: RetrievalQuery): RetrievalResult[] {
    const results: RetrievalResult[] = [];

    for (const [id, entry] of this.entries) {
      let score = 0;

      if (query.type && entry.type !== query.type) {
        continue;
      }

      if (query.minConfidence && entry.confidence < query.minConfidence) {
        continue;
      }

      const contentStr = JSON.stringify(entry.content).toLowerCase();
      const queryLower = query.text.toLowerCase();
      const queryWords = queryLower.split(' ');

      let matchCount = 0;
      for (const word of queryWords) {
        if (contentStr.includes(word)) {
          matchCount++;
        }
      }

      if (queryWords.length > 0) {
        score = matchCount / queryWords.length;
      } else {
        score = entry.confidence;
      }

      if (score > 0) {
        results.push({
          id,
          type: entry.type,
          content: entry.content,
          confidence: entry.confidence,
          source: entry.source,
          score
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 10);
  }

  store(type: string, content: unknown, confidence: number, source: string): void {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.entries.set(id, { type, content, confidence, source });

    this.memory.addKnowledge({
      type: type as 'pattern' | 'component' | 'design_system' | 'error_fix',
      content,
      confidence,
      source
    });
  }

  getStats(): RetrievalStats {
    const byType: Record<string, number> = {};
    let totalConfidence = 0;

    for (const entry of this.entries.values()) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      totalConfidence += entry.confidence;
    }

    return {
      totalEntries: this.entries.size,
      byType,
      averageConfidence: this.entries.size > 0 ? totalConfidence / this.entries.size : 0
    };
  }

  clear(): void {
    this.entries.clear();
  }
}

export class ArtifactRetriever {
  private artifacts: Map<string, AgentArtifact> = new Map();

  storeArtifact(artifact: AgentArtifact): void {
    this.artifacts.set(artifact.id, artifact);
  }

  getArtifact(id: string): AgentArtifact | undefined {
    return this.artifacts.get(id);
  }

  getArtifactsByType(type: string): AgentArtifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.type === type);
  }

  getArtifactsByFactory(factory: string): AgentArtifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.metadata.factory === factory);
  }

  searchArtifacts(query: string): AgentArtifact[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.artifacts.values()).filter(a => {
      const contentStr = JSON.stringify(a.content).toLowerCase();
      const nameStr = a.name.toLowerCase();
      return contentStr.includes(queryLower) || nameStr.includes(queryLower);
    });
  }

  getRecentArtifacts(limit: number = 10): AgentArtifact[] {
    return Array.from(this.artifacts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getStats(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const artifact of this.artifacts.values()) {
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;
      byStatus[artifact.status] = (byStatus[artifact.status] || 0) + 1;
    }

    return {
      total: this.artifacts.size,
      byType,
      byStatus
    };
  }
}

export function createMemoryRetriever(memory: RuntimeMemory): InMemoryRetriever {
  return new InMemoryRetriever(memory);
}

export function createArtifactRetriever(): ArtifactRetriever {
  return new ArtifactRetriever();
}
