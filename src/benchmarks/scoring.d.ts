export interface ScoringCriteria {
    buildSuccess: number;
    typecheck: number;
    lint: number;
    seo: number;
    accessibility: number;
    performance: number;
    mobileUx: number;
    featureCompleteness: number;
    designQuality: number;
    promptAccuracy: number;
}
export interface ScoredOutput {
    promptId: string;
    platform: string;
    scores: ScoringCriteria;
    totalScore: number;
    grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
    passRate: number;
    issues: string[];
    strengths: string[];
    timestamp: string;
}
export interface ComparisonResult {
    promptId: string;
    category: string;
    platforms: ScoredOutput[];
    winner: string;
    margin: number;
}
export interface BenchmarkReport {
    totalPrompts: number;
    platforms: string[];
    overallScores: Record<string, PlatformScore>;
    categoryScores: Record<string, Record<string, PlatformScore>>;
    winners: Record<string, string>;
    insights: string[];
    timestamp: string;
}
export interface PlatformScore {
    platform: string;
    averageScore: number;
    passRate: number;
    wins: number;
    losses: number;
    ties: number;
    strengths: string[];
    weaknesses: string[];
}
export declare const WEIGHTS: ScoringCriteria;
export declare function calculateTotalScore(scores: ScoringCriteria): number;
export declare function calculateGrade(totalScore: number): ScoredOutput['grade'];
export declare function calculatePassRate(scores: ScoringCriteria): number;
export declare function identifyStrengths(scores: ScoringCriteria): string[];
export declare function identifyIssues(scores: ScoringCriteria): string[];
export declare function createScoredOutput(promptId: string, platform: string, scores: ScoringCriteria): ScoredOutput;
export declare function compareOutputs(outputs: ScoredOutput[]): ComparisonResult;
export declare function generateReport(results: ComparisonResult[]): BenchmarkReport;
export declare function formatReport(report: BenchmarkReport): string;
//# sourceMappingURL=scoring.d.ts.map