export interface BenchmarkPrompt {
    id: string;
    category: string;
    subcategory: string;
    prompt: string;
    expectedFeatures: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    competitorNotes?: string;
}
export declare const BENCHMARK_PROMPTS: BenchmarkPrompt[];
export declare function getPromptsByCategory(category: string): BenchmarkPrompt[];
export declare function getPromptsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): BenchmarkPrompt[];
export declare function getPromptById(id: string): BenchmarkPrompt | undefined;
export declare function getPromptStats(): {
    total: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
};
//# sourceMappingURL=benchmark-prompts.d.ts.map