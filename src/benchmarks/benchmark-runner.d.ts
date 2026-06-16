import { ScoredOutput, ComparisonResult, BenchmarkReport } from './scoring.js';
export interface BenchmarkConfig {
    platforms: string[];
    categories: string[];
    maxPromptsPerCategory: number;
    timeout: number;
    retryCount: number;
}
export interface BenchmarkRunner {
    runAll(): Promise<BenchmarkReport>;
    runCategory(category: string): Promise<ComparisonResult[]>;
    runPrompt(promptId: string): Promise<ScoredOutput[]>;
    getProgress(): BenchmarkProgress;
}
export interface BenchmarkProgress {
    total: number;
    completed: number;
    failed: number;
    currentPrompt: string;
    currentPlatform: string;
    startTime: string;
    estimatedTimeRemaining: number;
}
export declare function createBenchmarkRunner(config?: Partial<BenchmarkConfig>): BenchmarkRunner;
export declare function runBenchmarkSuite(config?: Partial<BenchmarkConfig>): Promise<BenchmarkReport>;
export declare function getBenchmarkStats(): {
    totalPrompts: number;
    promptsByCategory: Record<string, number>;
    promptsByDifficulty: Record<string, number>;
};
//# sourceMappingURL=benchmark-runner.d.ts.map