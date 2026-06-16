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
    .select("build_success, quality_score");

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
    const factory = (p as Record<string, unknown>).factory as string;
    factoryStats[factory] = (factoryStats[factory] || 0) + 1;
  });

  return c.json({
    totalProjects: total,
    totalGenerations: totalGenerations || 0,
    successRate: total > 0 ? successful / total : 0,
    avgQuality,
    recentProjects: recentProjects || [],
    factoryDistribution: factoryStats,
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

  return c.json({
    ...data,
    blueprint: blueprints?.[0]?.json || null,
    evaluation: evaluations?.[0] || null,
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

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ── Generation Pipeline ────────────────────────────────────

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
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("feedback_entries")
    .insert(body)
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

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
