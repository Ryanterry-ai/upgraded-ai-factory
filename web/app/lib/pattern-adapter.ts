import { getSupabase } from "./supabase";

export interface Pattern {
  id: string;
  type: string;
  name: string;
  factory: string;
  successRate: number;
  usageCount: number;
  qualityScore: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  metadata: Record<string, unknown>;
}

export interface QualityPrediction {
  predictedScore: number;
  confidence: number;
  factors: string[];
  recommendedPatterns: Pattern[];
}

function calculateTier(score: number): "bronze" | "silver" | "gold" | "platinum" {
  if (score >= 0.9) return "platinum";
  if (score >= 0.75) return "gold";
  if (score >= 0.5) return "silver";
  return "bronze";
}

export async function predictQuality(
  prompt: string,
  factory: string
): Promise<QualityPrediction> {
  const supabase = getSupabase();
  const factors: string[] = [];

  const { data: history } = await supabase
    .from("projects")
    .select("quality_score, build_success, file_count")
    .eq("factory", factory)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!history || history.length === 0) {
    return {
      predictedScore: 0.5,
      confidence: 0.3,
      factors: ["No historical data for this factory"],
      recommendedPatterns: [],
    };
  }

  const successRate =
    history.filter((h) => h.build_success).length / history.length;
  const avgQuality =
    history.reduce((sum, h) => sum + (h.quality_score || 0), 0) /
    history.length;
  const avgFiles =
    history.reduce((sum, h) => sum + (h.file_count || 0), 0) / history.length;

  factors.push(
    `Historical success rate: ${(successRate * 100).toFixed(0)}%`
  );
  factors.push(
    `Average quality: ${(avgQuality * 100).toFixed(0)}%`
  );
  factors.push(`Average files: ${avgFiles.toFixed(0)}`);

  const promptLength = prompt.length;
  if (promptLength > 500) {
    factors.push("Detailed prompt (likely better output)");
  } else if (promptLength < 100) {
    factors.push("Short prompt (may need more detail)");
  }

  const predictedScore = avgQuality * 0.6 + successRate * 0.3 + 0.1;
  const confidence = Math.min(1, history.length / 20);

  const { data: topPatterns } = await supabase
    .from("patterns")
    .select("*")
    .eq("factory", factory)
    .order("success_rate", { ascending: false })
    .limit(5);

  const recommendedPatterns: Pattern[] = (topPatterns || []).map((p) => ({
    id: p.id,
    type: p.category,
    name: p.description,
    factory: p.factory || factory,
    successRate: p.success_rate,
    usageCount: p.usage_count,
    qualityScore: p.success_rate,
    tier: calculateTier(p.success_rate),
    metadata: p.metadata || {},
  }));

  return {
    predictedScore: Math.min(1, predictedScore),
    confidence,
    factors,
    recommendedPatterns,
  };
}

export interface ExtractedPattern {
  type: string;
  name: string;
  description: string;
  factory: string;
  successRate: number;
  metadata: Record<string, unknown>;
}

export function extractPatterns(
  files: Array<{ path: string; content: string; type: string }>,
  factory: string,
  buildSuccess: boolean,
  qualityScore: number
): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];

  const componentFiles = files.filter((f) => f.type === "component");
  const pageFiles = files.filter((f) => f.type === "page");

  patterns.push({
    type: "structure",
    name: `${pageFiles.length}-page-${factory}`,
    description: `${pageFiles.length}-page ${factory} project with ${componentFiles.length} components`,
    factory,
    successRate: buildSuccess ? 1 : 0,
    metadata: {
      pageCount: pageFiles.length,
      componentCount: componentFiles.length,
      qualityScore,
    },
  });

  const componentNames = componentFiles.map((f) => {
    const match = f.path.match(/components\/(.+)\.tsx$/);
    return match?.[1] || "unknown";
  });

  if (componentNames.includes("Header")) {
    patterns.push({
      type: "component",
      name: "header-pattern",
      description: "Standard header component with navigation",
      factory,
      successRate: buildSuccess ? 1 : 0,
      metadata: { component: "Header" },
    });
  }

  if (componentNames.includes("Footer")) {
    patterns.push({
      type: "component",
      name: "footer-pattern",
      description: "Standard footer component",
      factory,
      successRate: buildSuccess ? 1 : 0,
      metadata: { component: "Footer" },
    });
  }

  if (factory === "ecommerce") {
    patterns.push({
      type: "factory_pattern",
      name: "ecommerce-pattern",
      description: "Ecommerce project with product grid and cart",
      factory,
      successRate: buildSuccess ? 1 : 0,
      metadata: { hasProducts: componentNames.includes("ProductGrid"), hasCart: componentNames.includes("CartItems") },
    });
  }

  if (factory === "saas") {
    patterns.push({
      type: "factory_pattern",
      name: "saas-pattern",
      description: "SaaS project with auth and dashboard",
      factory,
      successRate: buildSuccess ? 1 : 0,
      metadata: { hasAuth: componentNames.includes("LoginForm"), hasDashboard: componentNames.includes("DashboardContent") },
    });
  }

  return patterns;
}

export async function recordPatterns(
  patterns: ExtractedPattern[]
): Promise<number> {
  const supabase = getSupabase();
  let recorded = 0;

  for (const pattern of patterns) {
    const { error } = await supabase.from("patterns").upsert(
      {
        category: pattern.type,
        description: pattern.description,
        success_rate: pattern.successRate,
        usage_count: 1,
        metadata: {
          ...pattern.metadata,
          factory: pattern.factory,
          name: pattern.name,
        },
      },
      { onConflict: "category,description" }
    );

    if (!error) recorded++;
  }

  return recorded;
}

export async function getTopPatterns(
  factory: string,
  limit: number = 10
): Promise<Pattern[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("patterns")
    .select("*")
    .eq("metadata->>factory", factory)
    .order("success_rate", { ascending: false })
    .limit(limit);

  return (data || []).map((p) => ({
    id: p.id,
    type: p.category,
    name: p.metadata?.name || p.description,
    factory: p.metadata?.factory || factory,
    successRate: p.success_rate,
    usageCount: p.usage_count,
    qualityScore: p.success_rate,
    tier: calculateTier(p.success_rate),
    metadata: p.metadata || {},
  }));
}
