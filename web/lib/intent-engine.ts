/**
 * Business Intent Engine
 *
 * Extracts WHY the user needs this application, not just WHAT category it falls into.
 * Runs after SolutionEngine.detect() (which gives the candidate problems/goals/systems
 * for the matched domain) and before planArchitecture() (which decides pages/components).
 *
 * Output directly biases: which SolutionPack systems get emphasized, which dataModel
 * fields get generated, what RPSE starting metrics look like, and what hero/dashboard
 * copy says — so the same domain produces visibly different output for different intents.
 */

import type { SolutionModel } from "./solution-engine";
import { callLLMWithFallback, isLLMAvailable, type LLMMessage } from "./llm-adapter";

// ═══════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════

export interface IntentPersona {
  role: string;                    // "gym owner", "front desk staff", "member"
  needs: string[];                 // ["see who is about to churn", "fast check-in flow"]
  accessLevel: "admin" | "staff" | "customer" | "public";
}

export interface SuccessMetric {
  metric: string;                  // "monthly churn rate"
  direction: "increase" | "decrease" | "maintain";
  targetHint?: string;             // "from ~22% to under 15%" — only if stated/implied in prompt
}

export interface IntentProfile {
  primaryProblem: string;          // single sentence, the dominant pain point
  primaryGoal: string;             // single sentence, what success looks like
  secondaryGoals: string[];        // 0-3 supporting goals
  personas: IntentPersona[];       // 1-4 personas who will use the generated app
  successMetrics: SuccessMetric[]; // 1-4 metrics, used to bias RPSE starting data
  constraints: string[];           // ["mobile-first", "India market", "small team <5 staff"]
  prioritizedSystems: string[];    // ordered subset of SolutionModel.systems[].name —
                                    // which business systems matter most for THIS request
  source: "llm-inferred" | "fallback-default";
  confidence: number;              // 0-1, used to decide whether to show a clarifying
                                    // question in the UI in a later version
}

// ═══════════════════════════════════════════════════════════
// CORE FUNCTION
// ═══════════════════════════════════════════════════════════

export async function extractIntent(
  prompt: string,
  solutionModel: SolutionModel | null
): Promise<IntentProfile> {
  if (!solutionModel) {
    return genericFallback(prompt);
  }

  if (!isLLMAvailable()) {
    return fallbackFromSolutionModel(prompt, solutionModel);
  }

  const systemPrompt = buildSystemPrompt(solutionModel);
  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const { content, usedFallback } = await callLLMWithFallback(messages, {
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    maxTokens: 700,
  });

  if (usedFallback || !content) {
    return fallbackFromSolutionModel(prompt, solutionModel);
  }

  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return validateAndNormalize(parsed, solutionModel, prompt);
  } catch {
    return fallbackFromSolutionModel(prompt, solutionModel);
  }
}

// ═══════════════════════════════════════════════════════════
// LLM PROMPT CONSTRUCTION
// ═══════════════════════════════════════════════════════════

function buildSystemPrompt(solutionModel: SolutionModel): string {
  const systemNames = solutionModel.systems.map(s => s.name).join(", ");
  const knownProblems = solutionModel.userProblems.join(", ");
  const knownGoals = solutionModel.businessGoals.join(", ");

  return `You are a business analyst, not a developer. Given a user's app request, extract their
underlying business intent — the problem they're actually trying to solve, not just the
category of app they named.

This request matches the "${solutionModel.domain}" domain. Known business systems for this
domain: ${systemNames}. Common problems in this domain: ${knownProblems}. Common goals:
${knownGoals}.

Ground your answer in what the user actually wrote. Only infer beyond the literal prompt
when the inference is a reasonable default for this domain — do not invent specific numbers
or facts the user didn't state or strongly imply.

Return ONLY valid JSON with this exact structure, no markdown, no explanation:
{
  "primaryProblem": "string — the dominant pain point in one sentence",
  "primaryGoal": "string — what success looks like in one sentence",
  "secondaryGoals": ["string"],
  "personas": [{"role": "string", "needs": ["string"], "accessLevel": "admin"|"staff"|"customer"|"public"}],
  "successMetrics": [{"metric": "string", "direction": "increase"|"decrease"|"maintain", "targetHint": "string or omit"}],
  "constraints": ["string"],
  "prioritizedSystems": ["string — must be a subset of: ${systemNames}, ordered most to least important"],
  "confidence": 0.0-1.0
}`;
}

// ═══════════════════════════════════════════════════════════
// VALIDATION & FALLBACKS
// ═══════════════════════════════════════════════════════════

function validateAndNormalize(
  parsed: Record<string, unknown>,
  solutionModel: SolutionModel,
  prompt: string
): IntentProfile {
  const validSystemNames = new Set(solutionModel.systems.map(s => s.name));
  const prioritized = Array.isArray(parsed.prioritizedSystems)
    ? (parsed.prioritizedSystems as string[]).filter(s => validSystemNames.has(s))
    : [];

  return {
    primaryProblem: typeof parsed.primaryProblem === "string" ? parsed.primaryProblem : solutionModel.userProblems[0] ?? "Unspecified",
    primaryGoal: typeof parsed.primaryGoal === "string" ? parsed.primaryGoal : solutionModel.businessGoals[0] ?? "Unspecified",
    secondaryGoals: Array.isArray(parsed.secondaryGoals) ? (parsed.secondaryGoals as string[]).slice(0, 3) : [],
    personas: Array.isArray(parsed.personas) ? (parsed.personas as IntentPersona[]).slice(0, 4) : [],
    successMetrics: Array.isArray(parsed.successMetrics) ? (parsed.successMetrics as SuccessMetric[]).slice(0, 4) : [],
    constraints: Array.isArray(parsed.constraints) ? (parsed.constraints as string[]).slice(0, 6) : [],
    prioritizedSystems: prioritized.length > 0 ? prioritized : solutionModel.systems.map(s => s.name),
    source: "llm-inferred",
    confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
  };
}

function fallbackFromSolutionModel(prompt: string, solutionModel: SolutionModel): IntentProfile {
  const lower = prompt.toLowerCase();

  // ═══ RULE-BASED INTENT EXTRACTION (Phase 2) ═══
  // Analyze the prompt text to infer the dominant problem and prioritize systems.
  // This runs when no LLM key is available.

  // Problem detection rules — ordered by specificity (most specific first)
  const problemRules: Array<{
    pattern: RegExp;
    problem: string;
    goal: string;
    systems: string[];
    confidence: number;
  }> = [
    // Retention / churn (gym)
    { pattern: /churn|losing|leaving|retention|stop coming|quit|after.{0,10}month/i,
      problem: "Member retention is declining — members leave before their commitment period ends",
      goal: "Reduce member churn and increase retention rates",
      systems: ["Member Management", "Attendance Tracking"],
      confidence: 0.7 },
    // Billing / payment (gym)
    { pattern: /payment|invoice|billing|overdue|collection|paid|dues|monthly/i,
      problem: "Payment collection is unreliable — manual follow-ups miss overdue invoices",
      goal: "Automate billing and achieve 95%+ invoice collection rate",
      systems: ["Billing & Payments", "Member Management"],
      confidence: 0.7 },
    // Lead conversion
    { pattern: /lead|prospect|walk.?in|inquiry|conversion|trial|enquir/i,
      problem: "Lead follow-up is inconsistent — prospects slip through the cracks",
      goal: "Convert more leads into active members with automated follow-up",
      systems: ["Lead Pipeline", "Member Management"],
      confidence: 0.6 },
    // Attendance patterns
    { pattern: /attendance|check.?in|visit|scan|pattern|who.{0,5}coming/i,
      problem: "No visibility into member visit patterns — can't predict who's at risk",
      goal: "Track attendance patterns to identify at-risk members early",
      systems: ["Attendance Tracking", "Member Management"],
      confidence: 0.6 },
    // Staff scheduling
    { pattern: /staff|trainer|schedule|shift|employee|roster/i,
      problem: "Staff scheduling is manual — double-bookings and no-shows happen regularly",
      goal: "Streamline staff scheduling and trainer assignments",
      systems: ["Staff Management", "Member Management"],
      confidence: 0.6 },
    // Classes
    { pattern: /class|session|workout|group|timetable/i,
      problem: "Class scheduling is disorganized — members can't find or book sessions",
      goal: "Enable easy class booking and schedule management",
      systems: ["Staff Management", "Member Management"],
      confidence: 0.5 },
    // Supplement-specific: authenticity / trust
    { pattern: /authentic|trust|lab.?test|fssai|certif|genuin|quality|clean.?label|transparent/i,
      problem: "Customers don't trust supplement authenticity — lab reports and certifications matter",
      goal: "Build trust through transparent lab testing, FSSAI compliance, and ingredient traceability",
      systems: ["Brand Store", "Goal Based Shopping"],
      confidence: 0.8 },
    // Supplement-specific: repeat / loyalty / retention
    { pattern: /repeat|loyal|retention|subscri|reorder|coming.?back|lifetime.?value|subscription/i,
      problem: "Repeat purchase rate is low — customers buy once and never return",
      goal: "Increase repeat purchases with subscription plans, loyalty rewards, and reorder reminders",
      systems: ["Goal Based Shopping", "Brand Store"],
      confidence: 0.8 },
    // Ecommerce-specific
    { pattern: /order|fulfillment|shipping|delivery/i,
      problem: "Order fulfillment is slow — customers complain about delivery times",
      goal: "Speed up order processing and reduce delivery complaints",
      systems: ["Order Management", "Inventory"],
      confidence: 0.6 },
    { pattern: /inventory|stock|out of stock|restock/i,
      problem: "Inventory visibility is poor — stockouts happen without warning",
      goal: "Prevent stockouts with real-time inventory tracking",
      systems: ["Inventory", "Order Management"],
      confidence: 0.6 },
    // Streaming-specific
    { pattern: /discover|recommend|find|search|browse/i,
      problem: "Content discovery is frustrating — users can't find what to watch",
      goal: "Improve content discovery with personalized recommendations",
      systems: ["Content Management", "User Engagement"],
      confidence: 0.6 },
    { pattern: /subscription|trial|convert|cancel/i,
      problem: "Trial users don't convert — free-to-paid conversion is too low",
      goal: "Increase trial-to-paid conversion rate above 60%",
      systems: ["Subscription Management", "User Engagement"],
      confidence: 0.6 },
  ];

  // Find the best matching rule
  let bestRule: typeof problemRules[0] | null = null;
  let bestConfidence = 0;
  for (const rule of problemRules) {
    if (rule.pattern.test(lower) && rule.confidence > bestConfidence) {
      bestRule = rule;
      bestConfidence = rule.confidence;
    }
  }

  // Build persona list based on prompt context
  const personas: IntentPersona[] = [];
  if (/owner|manager|admin|my gym|our gym/i.test(lower)) {
    personas.push({ role: "Gym Owner", needs: ["see retention metrics", "track revenue", "manage staff"], accessLevel: "admin" });
  }
  if (/staff|trainer|front desk|reception/i.test(lower)) {
    personas.push({ role: "Front Desk Staff", needs: ["quick check-in flow", "member lookup", "payment processing"], accessLevel: "staff" });
  }

  return {
    primaryProblem: bestRule?.problem ?? solutionModel.userProblems[0] ?? "Unspecified",
    primaryGoal: bestRule?.goal ?? solutionModel.businessGoals[0] ?? "Unspecified",
    secondaryGoals: solutionModel.businessGoals.slice(1, 3),
    personas,
    successMetrics: bestRule ? [{ metric: bestRule.goal.split(" ").slice(0, 3).join(" "), direction: "increase" as const }] : [],
    constraints: [],
    prioritizedSystems: bestRule?.systems ?? solutionModel.systems.map(s => s.name),
    source: "fallback-default",
    confidence: bestRule ? 0.6 : 0.3,
  };
}

function genericFallback(prompt: string): IntentProfile {
  return {
    primaryProblem: "Unspecified — no matching solution pack",
    primaryGoal: "Build a functional application matching the request",
    secondaryGoals: [],
    personas: [],
    successMetrics: [],
    constraints: [],
    prioritizedSystems: [],
    source: "fallback-default",
    confidence: 0.1,
  };
}
