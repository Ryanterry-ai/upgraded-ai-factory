import { callLLMWithFallback, isLLMAvailable, type LLMMessage } from "./llm-adapter";

export interface AgentDefinition {
  id: string;
  name: string;
  department: string;
  role: string;
  capabilities: string[];
  systemPrompt: string;
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  success: boolean;
  output: string;
  duration: number;
  tokenUsage: number;
}

// Subset of 32 agents that run during generation
// Full definitions in src/runtime/agents/agent-definitions.ts
export const GENERATION_AGENTS: AgentDefinition[] = [
  {
    id: "product-manager",
    name: "Product Manager",
    department: "product",
    role: "Analyze requirements and define project scope",
    capabilities: ["requirements_analysis", "scope_definition", "feature_prioritization"],
    systemPrompt: `You are a Product Manager agent. Analyze the project prompt and provide:
1. A clear project scope (2-3 sentences)
2. Key features list (3-5 items)
3. Target audience
4. Success criteria
Return ONLY valid JSON: {"scope": "string", "features": ["string"], "audience": "string", "successCriteria": "string"}`,
  },
  {
    id: "frontend-engineer",
    name: "Frontend Engineer",
    department: "engineering",
    role: "Design component architecture and data flow",
    capabilities: ["component_design", "architecture", "data_flow"],
    systemPrompt: `You are a Frontend Engineer agent. Given the project requirements, suggest:
1. Component hierarchy (list of component names and their relationships)
2. State management approach
3. Key user interactions
Return ONLY valid JSON: {"components": [{"name": "string", "purpose": "string", "children": ["string"]}], "stateManagement": "string", "interactions": ["string"]}`,
  },
  {
    id: "seo-specialist",
    name: "SEO Specialist",
    department: "growth",
    role: "Optimize metadata and content structure for search engines",
    capabilities: ["seo_optimization", "metadata", "content_structure"],
    systemPrompt: `You are an SEO Specialist agent. For the given project, provide:
1. Recommended page title (max 60 chars)
2. Meta description (max 160 chars)
3. Suggested URL structure
4. Keywords (3-5)
Return ONLY valid JSON: {"title": "string", "description": "string", "urlStructure": "string", "keywords": ["string"]}`,
  },
  {
    id: "qa-engineer",
    name: "QA Engineer",
    department: "quality",
    role: "Review generated code for quality issues",
    capabilities: ["code_review", "quality_assurance", "testing"],
    systemPrompt: `You are a QA Engineer agent. Review the generated project structure and identify:
1. Potential issues (list of strings)
2. Missing best practices (list of strings)
3. Quality score (0-100)
Return ONLY valid JSON: {"issues": ["string"], "missingBestPractices": ["string"], "qualityScore": number}`,
  },
  {
    id: "security-agent",
    name: "Security Agent",
    department: "quality",
    role: "Identify security vulnerabilities and suggest fixes",
    capabilities: ["security_audit", "vulnerability_assessment"],
    systemPrompt: `You are a Security Agent. Analyze the project for security concerns:
1. Potential vulnerabilities (list of strings)
2. Recommended security headers
3. Security score (0-100)
Return ONLY valid JSON: {"vulnerabilities": ["string"], "headers": ["string"], "securityScore": number}`,
  },
  {
    id: "performance-agent",
    name: "Performance Agent",
    department: "quality",
    role: "Optimize for Core Web Vitals and performance",
    capabilities: ["performance_optimization", "core_web_vitals"],
    systemPrompt: `You are a Performance Agent. Analyze the project for performance:
1. Performance recommendations (list of strings)
2. Core Web Vitals concerns (list of strings)
3. Performance score (0-100)
Return ONLY valid JSON: {"recommendations": ["string"], "coreWebVitals": ["string"], "performanceScore": number}`,
  },
];

const AGENT_TIMEOUT_MS = 10000;

async function runAgent(
  agent: AgentDefinition,
  context: string
): Promise<AgentResult> {
  const startTime = Date.now();

  if (!isLLMAvailable()) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      success: false,
      output: "",
      duration: Date.now() - startTime,
      tokenUsage: 0,
    };
  }

  const messages: LLMMessage[] = [
    { role: "system", content: agent.systemPrompt },
    { role: "user", content: context },
  ];

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Agent timeout")), AGENT_TIMEOUT_MS)
  );

  try {
    const result = await Promise.race([
      callLLMWithFallback(messages, {
        model: "gpt-4o-mini",
        temperature: 0.5,
        maxTokens: 500,
      }),
      timeoutPromise,
    ]);

    return {
      agentId: agent.id,
      agentName: agent.name,
      success: !result.usedFallback && result.content.length > 0,
      output: result.content,
      duration: Date.now() - startTime,
      tokenUsage: result.usage.totalTokens,
    };
  } catch (err) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      success: false,
      output: "",
      duration: Date.now() - startTime,
      tokenUsage: 0,
    };
  }
}

export interface WorkflowResult {
  agents: AgentResult[];
  totalDuration: number;
  totalTokens: number;
  successCount: number;
  failCount: number;
  insights: {
    scope?: string;
    features?: string[];
    seoTitle?: string;
    seoDescription?: string;
    qualityScore?: number;
    securityScore?: number;
    performanceScore?: number;
    issues?: string[];
  };
}

export async function runAgentWorkflow(
  prompt: string,
  factory: string,
  projectName: string
): Promise<WorkflowResult> {
  const context = `Project: ${projectName}\nFactory: ${factory}\nDescription: ${prompt.slice(0, 500)}`;
  const startTime = Date.now();
  const results: AgentResult[] = [];

  // Run agents in parallel for speed
  const agentPromises = GENERATION_AGENTS.map((agent) => runAgent(agent, context));
  const agentResults = await Promise.allSettled(agentPromises);

  for (const result of agentResults) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    }
  }

  // Parse insights from agent outputs
  const insights: WorkflowResult["insights"] = {};

  for (const result of results) {
    if (!result.success || !result.output) continue;

    try {
      const cleaned = result.output
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      switch (result.agentId) {
        case "product-manager":
          insights.scope = parsed.scope;
          insights.features = parsed.features;
          break;
        case "seo-specialist":
          insights.seoTitle = parsed.title;
          insights.seoDescription = parsed.description;
          break;
        case "qa-engineer":
          insights.qualityScore = parsed.qualityScore;
          insights.issues = parsed.issues;
          break;
        case "security-agent":
          insights.securityScore = parsed.securityScore;
          break;
        case "performance-agent":
          insights.performanceScore = parsed.performanceScore;
          break;
      }
    } catch {
      // Non-JSON output, skip
    }
  }

  const successCount = results.filter((r) => r.success).length;

  return {
    agents: results,
    totalDuration: Date.now() - startTime,
    totalTokens: results.reduce((sum, r) => sum + r.tokenUsage, 0),
    successCount,
    failCount: results.length - successCount,
    insights,
  };
}
