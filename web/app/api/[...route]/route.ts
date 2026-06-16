import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getSupabase } from "@/lib/supabase";
import { runGeneration } from "@/lib/generation-pipeline";

const app = new Hono().basePath("/api");

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Stats ──────────────────────────────────────────────────

app.get("/stats", async (c) => {
  const supabase = getSupabase();

  const { count: totalProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  const { count: totalGenerations } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true });

  const { data: projects } = await supabase
    .from("projects")
    .select("build_success, quality_score, factory");

  const successful = projects?.filter((p) => p.build_success).length || 0;
  const total = projects?.length || 0;
  const avgQuality = total > 0
    ? (projects?.reduce((sum, p) => sum + (p.quality_score || 0), 0) || 0) / total
    : 0;

  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, name, factory, quality_score, build_success, file_count, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const factoryStats: Record<string, number> = {};
  projects?.forEach((p) => {
    const factory = p.factory as string;
    factoryStats[factory] = (factoryStats[factory] || 0) + 1;
  });

  // Analytics: generation latency
  const { data: genData } = await supabase
    .from("generations")
    .select("build_time_ms, file_count, factory, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const avgLatency = genData && genData.length > 0
    ? genData.reduce((sum, g) => sum + (g.build_time_ms || 0), 0) / genData.length
    : 0;

  const latencyByFactory: Record<string, number> = {};
  const latencyCounts: Record<string, number> = {};
  genData?.forEach((g) => {
    const f = g.factory;
    latencyByFactory[f] = (latencyByFactory[f] || 0) + (g.build_time_ms || 0);
    latencyCounts[f] = (latencyCounts[f] || 0) + 1;
  });
  for (const f of Object.keys(latencyByFactory)) {
    latencyByFactory[f] = Math.round(latencyByFactory[f] / (latencyCounts[f] || 1));
  }

  // Analytics: daily generations (last 7 days)
  const dailyGenerations: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyGenerations[key] = 0;
  }
  genData?.forEach((g) => {
    if (g.created_at) {
      const key = g.created_at.split("T")[0];
      if (key in dailyGenerations) {
        dailyGenerations[key]++;
      }
    }
  });

  return c.json({
    totalProjects: total,
    totalGenerations: totalGenerations || 0,
    successRate: total > 0 ? successful / total : 0,
    avgQuality,
    avgLatency: Math.round(avgLatency),
    recentProjects: recentProjects || [],
    factoryDistribution: factoryStats,
    latencyByFactory,
    dailyGenerations,
  });
});

// ── Projects CRUD ──────────────────────────────────────────

app.get("/projects", async (c) => {
  const supabase = getSupabase();
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("projects")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ projects: data, total: count, page, limit });
});

app.get("/projects/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return c.json({ error: error.message }, 404);

  const { data: blueprints } = await supabase
    .from("blueprints")
    .select("id, json, created_at")
    .eq("project_id", id)
    .limit(1);

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("project_id", id)
    .limit(1);

  const { data: feedback } = await supabase
    .from("feedback_entries")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return c.json({
    ...data,
    blueprint: blueprints?.[0]?.json || null,
    evaluation: evaluations?.[0] || null,
    feedback: feedback || [],
  });
});

app.post("/projects", async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .insert(body)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

app.delete("/projects/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabase();

  await supabase.storage.from("generated-projects").remove([`${id}/project.zip`]);
  await supabase.from("blueprints").delete().eq("project_id", id);
  await supabase.from("evaluations").delete().eq("project_id", id);
  await supabase.from("feedback_entries").delete().eq("project_id", id);

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ── Generation Pipeline (SSE) ─────────────────────────────

app.get("/generate", (c) => {
  return c.json({ error: "Use POST method" }, 405);
});

app.post("/generate", async (c) => {
  const body = await c.req.json();
  const { prompt, factory, name } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return c.json({ error: "Prompt is required" }, 400);
  }

  if (prompt.length > 10000) {
    return c.json({ error: "Prompt too long (max 10000 chars)" }, 400);
  }

  const accept = c.req.header("accept") || "";
  const wantsSSE = accept.includes("text/event-stream");

  if (wantsSSE) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send("progress", { step: "routing", label: "Analyzing input..." });

          const startTime = Date.now();

          send("progress", { step: "routing", label: "Detecting factory type..." });

          const result = await runGeneration({
            prompt: prompt.trim(),
            factory,
            name: name?.trim(),
          });

          const totalMs = Date.now() - startTime;

          send("complete", {
            ...result,
            totalMs,
          });

          controller.close();
        } catch (err) {
          send("error", {
            error: err instanceof Error ? err.message : "Generation failed",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-SSE fallback
  try {
    const result = await runGeneration({
      prompt: prompt.trim(),
      factory,
      name: name?.trim(),
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return c.json({ error: message }, 500);
  }
});

// ── Project Files & Download ───────────────────────────────

app.get("/projects/:id/files", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabase();

  const { data: blueprints } = await supabase
    .from("blueprints")
    .select("json")
    .eq("project_id", id)
    .limit(1);

  if (!blueprints?.[0]?.json) {
    return c.json({ files: [] });
  }

  const blueprint = blueprints[0].json as Record<string, unknown>;
  const files: { path: string; type: string }[] = [];

  const components = (blueprint.components as Array<Record<string, unknown>>) || [];
  for (const comp of components) {
    files.push({
      path: `src/components/${comp.name}.tsx`,
      type: "component",
    });
  }

  const pages = (blueprint.pages as Array<Record<string, unknown>>) || [];
  for (const page of pages) {
    const pagePath = (page.path as string) === "/" ? "page.tsx" : `${page.path}/page.tsx`;
    files.push({ path: `src/app/${pagePath}`, type: "page" });
  }

  return c.json({ files });
});

app.get("/projects/:id/download", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from("generated-projects")
    .download(`${id}/project.zip`);

  if (error) {
    return c.json({ error: "Download not available" }, 404);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="project-${id}.zip"`,
      "Content-Length": buffer.length.toString(),
    },
  });
});

// ── Generation History ─────────────────────────────────────

app.get("/generations", async (c) => {
  const supabase = getSupabase();
  const factory = c.req.query("factory");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (factory) {
    query = query.eq("factory", factory);
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ generations: data });
});

// ── Evaluations ────────────────────────────────────────────

app.get("/projects/:id/evaluations", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ evaluations: data });
});

// ── Feedback ───────────────────────────────────────────────

app.get("/feedback", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("feedback_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ feedback: data });
});

app.post("/feedback", async (c) => {
  const body = await c.req.json();
  const { project_id, rating, comment, category } = body;

  if (!project_id || !rating) {
    return c.json({ error: "project_id and rating are required" }, 400);
  }

  if (rating < 1 || rating > 5) {
    return c.json({ error: "rating must be 1-5" }, 400);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("feedback_entries")
    .insert({
      project_id,
      rating,
      comment: comment || "",
      category: category || "general",
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// ── Benchmarks ─────────────────────────────────────────────

app.get("/benchmarks", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("benchmark_results")
    .select("*")
    .order("total_score", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ benchmarks: data });
});

app.post("/benchmarks", async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("benchmark_results")
    .insert(body)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// ── Analytics ──────────────────────────────────────────────

app.get("/analytics/overview", async (c) => {
  const supabase = getSupabase();

  const [projectsRes, generationsRes, feedbackRes] = await Promise.all([
    supabase.from("projects").select("factory, quality_score, build_success, created_at"),
    supabase.from("generations").select("factory, build_time_ms, file_count, created_at"),
    supabase.from("feedback_entries").select("rating, category, created_at"),
  ]);

  const projects = projectsRes.data || [];
  const generations = generationsRes.data || [];
  const feedback = feedbackRes.data || [];

  // Factory performance
  const factoryPerf: Record<string, { total: number; success: number; avgQuality: number; avgLatency: number }> = {};
  for (const p of projects) {
    const f = p.factory;
    if (!factoryPerf[f]) factoryPerf[f] = { total: 0, success: 0, avgQuality: 0, avgLatency: 0 };
    factoryPerf[f].total++;
    if (p.build_success) factoryPerf[f].success++;
    factoryPerf[f].avgQuality += p.quality_score || 0;
  }
  for (const g of generations) {
    const f = g.factory;
    if (factoryPerf[f]) {
      factoryPerf[f].avgLatency += g.build_time_ms || 0;
    }
  }
  for (const f of Object.keys(factoryPerf)) {
    const perf = factoryPerf[f];
    perf.avgQuality = perf.total > 0 ? perf.avgQuality / perf.total : 0;
    perf.avgLatency = perf.total > 0 ? Math.round(perf.avgLatency / perf.total) : 0;
  }

  // Feedback summary
  const feedbackSummary = {
    total: feedback.length,
    avgRating: feedback.length > 0
      ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
      : 0,
    byCategory: {} as Record<string, number>,
  };
  for (const f of feedback) {
    const cat = f.category || "general";
    feedbackSummary.byCategory[cat] = (feedbackSummary.byCategory[cat] || 0) + 1;
  }

  // Daily trend (last 30 days)
  const dailyTrend: Record<string, { generations: number; avgQuality: number }> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyTrend[key] = { generations: 0, avgQuality: 0 };
  }
  for (const g of generations) {
    if (g.created_at) {
      const key = g.created_at.split("T")[0];
      if (key in dailyTrend) {
        dailyTrend[key].generations++;
      }
    }
  }

  return c.json({
    factoryPerformance: factoryPerf,
    feedbackSummary,
    dailyTrend,
    totalProjects: projects.length,
    totalGenerations: generations.length,
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
