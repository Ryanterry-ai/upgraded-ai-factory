import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getSupabase } from "@/lib/supabase";

const app = new Hono().basePath("/api");

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/projects", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ projects: data });
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
  return c.json(data);
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
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

app.get("/generate", (c) => {
  return c.json({ error: "Use POST method" }, 405);
});

app.post("/generate", async (c) => {
  const body = await c.req.json();
  const { prompt, factory, name } = body;

  if (!prompt) return c.json({ error: "Prompt is required" }, 400);

  const supabase = getSupabase();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: name || `project-${Date.now()}`,
      factory: factory || "website",
      prompt,
      quality_score: 0,
      build_success: false,
      file_count: 0,
    })
    .select()
    .single();

  if (projectError) return c.json({ error: projectError.message }, 500);

  return c.json({
    projectId: project.id,
    status: "generating",
    message: "Project generation started",
  });
});

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
