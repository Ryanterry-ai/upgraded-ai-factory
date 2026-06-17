/**
 * Component Depth Validator — Detects placeholder stubs and measures real completeness.
 */

export interface DepthResult {
  componentName: string;
  filePath: string;
  lineCount: number;
  hasRealUI: boolean;
  hasBusinessLogic: boolean;
  hasStateManagement: boolean;
  hasEventHandlers: boolean;
  hasDataDisplay: boolean;
  hasFormInputs: boolean;
  isPlaceholder: boolean;
  score: number; // 0-100
  issues: string[];
}

/**
 * Analyze a single component file for depth and completeness.
 */
export function analyzeComponentDepth(
  filePath: string,
  content: string
): DepthResult {
  const issues: string[] = [];
  const lines = content.split("\n");
  const lineCount = lines.length;
  const lower = content.toLowerCase();

  // Detect placeholder patterns
  const placeholderPatterns = [
    /<h2>\s*\w+\s*<\/h2>\s*$/,                          // <h2>ComponentName</h2>
    /<h1>\s*\w+\s*<\/h1>\s*$/,                          // <h1>ComponentName</h1>
    /return\s*\(\s*<section[^>]*>\s*<h[12]>\s*\w+\s*<\/h[12]>\s*<\/section>\s*\)/, // return (<section><h2>Name</h2></section>)
    /export\s+function\s+\w+\(\)\s*\{\s*return\s*\(/,   // export function X() { return (
  ];

  const isPlaceholder = placeholderPatterns.some(p => p.test(content)) ||
    (lineCount < 15 && /<h[12]>/.test(content) && !/<input|<select|<table|<form|<div\s+className/.test(content));

  // Check for real UI elements
  const uiElements = [
    /<input/, /<select/, /<textarea/, /<button/, /<table/, /<form/,
    /<div\s+className/, /<span\s+className/, /<section/,
    /className="[^"]*grid/, /className="[^"]*flex/,
    /<svg/, /<img/, /<Link/, /<a\s+href/,
    /map\(/, /\.filter\(/, /\.reduce\(/,
  ];
  const hasRealUI = uiElements.filter(p => p.test(content)).length >= 3;

  // Check for business logic
  const logicPatterns = [
    /useState/, /useReducer/, /useEffect/, /useCallback/,
    /handleSubmit/, /handleClick/, /handleChange/,
    /filter\(/, /map\(/, /reduce\(/,
    /\.then\(/, /async/, /await/,
    /if\s*\(/, /switch\s*\(/, /case\s+/,
    /total/, /count/, /sum/, /average/,
    /search/, /filter/, /sort/, /pagination/,
    /validat/, /error/, /loading/,
  ];
  const hasBusinessLogic = logicPatterns.filter(p => p.test(content)).length >= 3;

  // Check for state management
  const statePatterns = [
    /useState/, /useReducer/, /useContext/,
    /set\w+\(/, /dispatch/,
  ];
  const hasStateManagement = statePatterns.filter(p => p.test(content)).length >= 2;

  // Check for event handlers
  const eventPatterns = [
    /onClick/, /onChange/, /onSubmit/, /onKeyDown/,
    /handle\w+/, /submit/, /click/,
  ];
  const hasEventHandlers = eventPatterns.filter(p => p.test(content)).length >= 2;

  // Check for data display
  const dataPatterns = [
    /map\(/, /\.length/, /count/, /total/,
    /data\.|items\.|list\./, /\$\{.*\}/,
    /badge/, /tag/, /label/, /status/,
  ];
  const hasDataDisplay = dataPatterns.filter(p => p.test(content)).length >= 2;

  // Check for form inputs
  const formPatterns = [
    /<input/, /<select/, /<textarea/,
    /type="text"/, /type="email"/, /type="number"/, /type="password"/,
    /value=\{/, /onChange=/, /placeholder=/,
    /required/,
  ];
  const hasFormInputs = formPatterns.filter(p => p.test(content)).length >= 2;

  // Calculate score
  let score = 0;
  if (isPlaceholder) {
    score = 5; // Placeholder = near zero
    issues.push("Component is a placeholder stub with no real UI");
  } else {
    if (hasRealUI) score += 25; else issues.push("Missing real UI elements (inputs, grids, tables)");
    if (hasBusinessLogic) score += 25; else issues.push("Missing business logic (filters, calculations, state)");
    if (hasStateManagement) score += 15; else issues.push("Missing state management");
    if (hasEventHandlers) score += 15; else issues.push("Missing event handlers");
    if (hasDataDisplay) score += 10; else issues.push("Missing data display patterns");
    if (hasFormInputs) score += 10; else issues.push("Missing form inputs");

    // Line count bonus/penalty
    if (lineCount < 20) {
      score = Math.max(score - 20, 0);
      issues.push(`Too few lines (${lineCount}). Expected 30+ for real components`);
    } else if (lineCount >= 40) {
      score = Math.min(score + 5, 100);
    }
  }

  return {
    componentName: filePath.match(/components\/(.+)\.(tsx|jsx)$/)?.[1] || filePath,
    filePath,
    lineCount,
    hasRealUI,
    hasBusinessLogic,
    hasStateManagement,
    hasEventHandlers,
    hasDataDisplay,
    hasFormInputs,
    isPlaceholder,
    score: Math.min(100, Math.max(0, score)),
    issues,
  };
}

/**
 * Analyze all component files and return depth results.
 */
export function analyzeAllComponents(
  files: Array<{ path: string; content: string; type: string }>
): DepthResult[] {
  return files
    .filter(f => f.path.includes("components/") && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")))
    .map(f => analyzeComponentDepth(f.path, f.content));
}

/**
 * Calculate overall component depth score (0-100).
 */
export function calculateComponentDepthScore(
  files: Array<{ path: string; content: string; type: string }>
): { score: number; results: DepthResult[]; placeholderCount: number; avgScore: number } {
  const results = analyzeAllComponents(files);
  if (results.length === 0) return { score: 0, results: [], placeholderCount: 0, avgScore: 0 };

  const placeholderCount = results.filter(r => r.isPlaceholder).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const realComponents = results.filter(r => !r.isPlaceholder);

  // Score = avg of real components, penalized by placeholder ratio
  const placeholderRatio = placeholderCount / results.length;
  const realAvg = realComponents.length > 0
    ? realComponents.reduce((sum, r) => sum + r.score, 0) / realComponents.length
    : 0;

  const score = Math.round(realAvg * (1 - placeholderRatio * 0.5));

  return { score, results, placeholderCount, avgScore };
}
