// Phase 7: Memory Integration

import {
  AgentMemory,
  KnowledgeEntry,
  AgentState
} from '../state/agent-state.js';

export interface MemoryStore {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  has(key: string): boolean;
  keys(): string[];
  clear(): void;
}

export class InMemoryStore implements MemoryStore {
  private store: Map<string, unknown> = new Map();

  get(key: string): unknown | undefined {
    return this.store.get(key);
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export class RuntimeMemory {
  private workingMemory: InMemoryStore;
  private sharedMemory: InMemoryStore;
  private persistentMemory: InMemoryStore;
  private knowledgeBase: KnowledgeEntry[];

  constructor() {
    this.workingMemory = new InMemoryStore();
    this.sharedMemory = new InMemoryStore();
    this.persistentMemory = new InMemoryStore();
    this.knowledgeBase = [];
  }

  getWorking(agentId: string): Record<string, unknown> {
    const data = this.workingMemory.get(agentId);
    return (data as Record<string, unknown>) || {};
  }

  setWorking(agentId: string, key: string, value: unknown): void {
    const data = this.getWorking(agentId);
    data[key] = value;
    this.workingMemory.set(agentId, data);
  }

  getShared(key: string): unknown | undefined {
    return this.sharedMemory.get(key);
  }

  setShared(key: string, value: unknown): void {
    this.sharedMemory.set(key, value);
  }

  getPersistent(agentId: string): Record<string, unknown> {
    const data = this.persistentMemory.get(agentId);
    return (data as Record<string, unknown>) || {};
  }

  setPersistent(agentId: string, key: string, value: unknown): void {
    const data = this.getPersistent(agentId);
    data[key] = value;
    this.persistentMemory.set(agentId, data);
  }

  addKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'lastUsed' | 'useCount'>): KnowledgeEntry {
    const newEntry: KnowledgeEntry = {
      id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...entry,
      lastUsed: new Date().toISOString(),
      useCount: 0
    };
    this.knowledgeBase.push(newEntry);
    return newEntry;
  }

  searchKnowledge(query: string, type?: string): KnowledgeEntry[] {
    let results = this.knowledgeBase;

    if (type) {
      results = results.filter(e => e.type === type);
    }

    const queryLower = query.toLowerCase();
    return results.filter(e => {
      const contentStr = JSON.stringify(e.content).toLowerCase();
      return contentStr.includes(queryLower);
    });
  }

  getTopKnowledge(type?: string, limit: number = 10): KnowledgeEntry[] {
    let results = this.knowledgeBase;
    if (type) {
      results = results.filter(e => e.type === type);
    }
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  recordPattern(pattern: Omit<KnowledgeEntry, 'id' | 'lastUsed' | 'useCount' | 'type'>): KnowledgeEntry {
    return this.addKnowledge({
      ...pattern,
      type: 'pattern',
      confidence: 0.8
    });
  }

  recordComponent(component: Omit<KnowledgeEntry, 'id' | 'lastUsed' | 'useCount' | 'type'>): KnowledgeEntry {
    return this.addKnowledge({
      ...component,
      type: 'component',
      confidence: 0.9
    });
  }

  recordDesignSystem(designSystem: Omit<KnowledgeEntry, 'id' | 'lastUsed' | 'useCount' | 'type'>): KnowledgeEntry {
    return this.addKnowledge({
      ...designSystem,
      type: 'design_system',
      confidence: 0.85
    });
  }

  recordErrorFix(errorFix: Omit<KnowledgeEntry, 'id' | 'lastUsed' | 'useCount' | 'type'>): KnowledgeEntry {
    return this.addKnowledge({
      ...errorFix,
      type: 'error_fix',
      confidence: 0.75
    });
  }

  getStats(): {
    working: number;
    shared: number;
    persistent: number;
    knowledge: number;
  } {
    return {
      working: this.workingMemory.size(),
      shared: this.sharedMemory.size(),
      persistent: this.persistentMemory.size(),
      knowledge: this.knowledgeBase.length
    };
  }

  exportState(): {
    working: Record<string, unknown>;
    shared: Record<string, unknown>;
    persistent: Record<string, unknown>;
    knowledge: KnowledgeEntry[];
  } {
    const working: Record<string, unknown> = {};
    for (const key of this.workingMemory.keys()) {
      working[key] = this.workingMemory.get(key);
    }

    const shared: Record<string, unknown> = {};
    for (const key of this.sharedMemory.keys()) {
      shared[key] = this.sharedMemory.get(key);
    }

    const persistent: Record<string, unknown> = {};
    for (const key of this.persistentMemory.keys()) {
      persistent[key] = this.persistentMemory.get(key);
    }

    return {
      working,
      shared,
      persistent,
      knowledge: [...this.knowledgeBase]
    };
  }

  importState(state: {
    working?: Record<string, unknown>;
    shared?: Record<string, unknown>;
    persistent?: Record<string, unknown>;
    knowledge?: KnowledgeEntry[];
  }): void {
    if (state.working) {
      for (const [key, value] of Object.entries(state.working)) {
        this.workingMemory.set(key, value);
      }
    }

    if (state.shared) {
      for (const [key, value] of Object.entries(state.shared)) {
        this.sharedMemory.set(key, value);
      }
    }

    if (state.persistent) {
      for (const [key, value] of Object.entries(state.persistent)) {
        this.persistentMemory.set(key, value);
      }
    }

    if (state.knowledge) {
      this.knowledgeBase = [...state.knowledge];
    }
  }
}

export function createRuntimeMemory(): RuntimeMemory {
  return new RuntimeMemory();
}
