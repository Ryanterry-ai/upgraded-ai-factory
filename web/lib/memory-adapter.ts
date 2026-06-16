import { getSupabase } from "./supabase";

export interface MemoryContext {
  recentProjects: Array<{
    name: string;
    factory: string;
    prompt: string;
    quality_score: number;
    file_count: number;
  }>;
  successfulPatterns: Array<{
    factory: string;
    file_count: number;
    quality_score: number;
  }>;
  factoryStats: {
    totalGenerations: number;
    successRate: number;
    avgQuality: number;
  };
}

export interface GenerationRecord {
  projectId: string;
  factory: string;
  prompt: string;
  fileCount: number;
  qualityScore: number;
  buildSuccess: boolean;
  llmUsed: boolean;
  agentCount: number;
  durationMs: number;
}

export async function retrieveMemory(
  prompt: string,
  factory: string
): Promise<MemoryContext> {
  const supabase = getSupabase();

  const [recentResult, patternsResult, statsResult] = await Promise.allSettled([
    supabase
      .from("projects")
      .select("name, factory, prompt, quality_score, file_count")
      .eq("factory", factory)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("factory, file_count, quality_score")
      .eq("factory", factory)
      .eq("build_success", true)
      .order("quality_score", { ascending: false })
      .limit(10),
    supabase
      .from("projects")
      .select("build_success, quality_score")
      .eq("factory", factory),
  ]);

  const recentProjects =
    recentResult.status === "fulfilled" ? recentResult.value.data || [] : [];

  const successfulPatterns =
    patternsResult.status === "fulfilled" ? patternsResult.value.data || [] : [];

  const allProjects =
    statsResult.status === "fulfilled" ? statsResult.value.data || [] : [];

  const totalGenerations = allProjects.length;
  const successfulCount = allProjects.filter(
    (p: { build_success: boolean }) => p.build_success
  ).length;
  const avgQuality =
    totalGenerations > 0
      ? allProjects.reduce(
          (sum: number, p: { quality_score: number }) => sum + (p.quality_score || 0),
          0
        ) / totalGenerations
      : 0;

  return {
    recentProjects: recentProjects.map(
      (p: {
        name: string;
        factory: string;
        prompt: string;
        quality_score: number;
        file_count: number;
      }) => ({
        name: p.name,
        factory: p.factory,
        prompt: p.prompt,
        quality_score: p.quality_score,
        file_count: p.file_count,
      })
    ),
    successfulPatterns: successfulPatterns.map(
      (p: { factory: string; file_count: number; quality_score: number }) => ({
        factory: p.factory,
        file_count: p.file_count,
        quality_score: p.quality_score,
      })
    ),
    factoryStats: {
      totalGenerations,
      successRate: totalGenerations > 0 ? successfulCount / totalGenerations : 0,
      avgQuality,
    },
  };
}

export function formatMemoryContext(memory: MemoryContext): string {
  const sections: string[] = [];

  if (memory.recentProjects.length > 0) {
    sections.push("## Recent Similar Projects");
    for (const p of memory.recentProjects.slice(0, 3)) {
      sections.push(
        `- "${p.name}" (${p.factory}): ${p.file_count} files, quality ${(p.quality_score * 100).toFixed(0)}%`
      );
      sections.push(`  Prompt: "${p.prompt.slice(0, 80)}..."`);
    }
  }

  if (memory.factoryStats.totalGenerations > 0) {
    sections.push(
      `\n## Factory Stats: ${memory.factoryStats.totalGenerations} past generations, ${(memory.factoryStats.successRate * 100).toFixed(0)}% success, ${(memory.factoryStats.avgQuality * 100).toFixed(0)}% avg quality`
    );
  }

  if (memory.successfulPatterns.length > 0) {
    const avgFiles =
      memory.successfulPatterns.reduce((sum, p) => sum + p.file_count, 0) /
      memory.successfulPatterns.length;
    sections.push(
      `\n## Benchmark: Successful projects average ${avgFiles.toFixed(0)} files`
    );
  }

  return sections.join("\n");
}

export async function recordGeneration(record: GenerationRecord): Promise<void> {
  const supabase = getSupabase();

  await supabase.from("generations").insert({
    factory: record.factory,
    prompt: record.prompt,
    result: {
      projectId: record.projectId,
      fileCount: record.fileCount,
      qualityScore: record.qualityScore,
      llmUsed: record.llmUsed,
      agentCount: record.agentCount,
      durationMs: record.durationMs,
    },
    build_success: record.buildSuccess,
    file_count: record.fileCount,
    ts_errors: 0,
    lint_warnings: 0,
    build_time_ms: record.durationMs,
  });
}

export async function getFactoryStats(
  factory: string
): Promise<{ total: number; successRate: number; avgQuality: number }> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("projects")
    .select("build_success, quality_score")
    .eq("factory", factory);

  if (!data || data.length === 0) {
    return { total: 0, successRate: 0, avgQuality: 0 };
  }

  const successful = data.filter(
    (p: { build_success: boolean }) => p.build_success
  ).length;
  const avgQuality =
    data.reduce(
      (sum: number, p: { quality_score: number }) => sum + (p.quality_score || 0),
      0
    ) / data.length;

  return {
    total: data.length,
    successRate: successful / data.length,
    avgQuality,
  };
}
