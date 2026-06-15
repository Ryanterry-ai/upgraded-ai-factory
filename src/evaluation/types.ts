export type EvaluatorName = 'seo' | 'performance' | 'accessibility' | 'security' | 'ux' | 'design' | 'code-quality';

export type SeverityLevel = 'critical' | 'major' | 'minor' | 'info';

export interface EvaluationFinding {
  rule: string;
  message: string;
  severity: SeverityLevel;
  file?: string;
  line?: number;
  evidence?: string;
}

export interface EvaluatorResult {
  evaluator: EvaluatorName;
  score: number;
  maxScore: number;
  percentage: number;
  findings: EvaluationFinding[];
  summary: string;
  duration: number;
}

export interface ProjectContext {
  projectPath: string;
  factoryType: string;
  projectName: string;
  fileMap: Map<string, string>;
  packageJson?: any;
  blueprint?: any;
}

export interface EvaluationReport {
  projectPath: string;
  factoryType: string;
  projectName: string;
  evaluatedAt: string;
  overallScore: number;
  overallPercentage: number;
  results: EvaluatorResult[];
  buildScore: EvaluatorResult;
  designScore: EvaluatorResult;
  uxScore: EvaluatorResult;
  seoScore: EvaluatorResult;
  accessibilityScore: EvaluatorResult;
  performanceScore: EvaluatorResult;
  securityScore: EvaluatorResult;
  codeQualityScore: EvaluatorResult;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  duration: number;
}

export interface BenchmarkPrompt {
  id: string;
  prompt: string;
  factory: string;
  complexity: 'simple' | 'moderate' | 'complex';
  tags: string[];
}

export interface BenchmarkResult {
  promptId: string;
  prompt: string;
  factory: string;
  complexity: string;
  projectPath: string;
  generationSuccess: boolean;
  generationError: string | null;
  evaluation: EvaluationReport;
  timestamp: string;
  duration: number;
}

export interface FactoryBenchmark {
  factory: string;
  totalProjects: number;
  successfulGenerations: number;
  successfulEvaluations: number;
  avgScore: number;
  avgPercentage: number;
  avgGrade: string;
  bestScore: number;
  worstScore: number;
  results: BenchmarkResult[];
}

export interface AuditReport {
  timestamp: string;
  totalProjects: number;
  totalFactories: number;
  overallScore: number;
  overallPercentage: number;
  overallGrade: string;
  factoryBenchmarks: FactoryBenchmark[];
  weakFactories: string[];
  strongFactories: string[];
  recommendations: string[];
}

export function calculateGrade(percentage: number): EvaluationReport['grade'] {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 60) return 'D';
  return 'F';
}
