import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getSupabase } from "@/lib/supabase";
import { runGeneration } from "@/lib/generation-pipeline";
import { generatePreviewHtml } from "@/lib/preview-renderer";
import { createMultiPagePreview } from "@/lib/multipage-preview";
import {
  createProject,
  startDevServer,
  stopDevServer,
  getRuntime,
  updateProjectFile,
  getProjectFile,
  listProjectFiles,
} from "@/lib/project-runtime";

const app = new Hono().basePath("/api");

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Project Runtime ────────────────────────────────────────

app.post("/projects/:id/runtime/start", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const files = body.files as { path: string; content: string; type: string }[] | undefined;

  try {
    // Create project with files if provided
    if (files && files.length > 0) {
      createProject(projectId, files);
    }

    // Start dev server
    const runtime = await startDevServer(projectId);
    return c.json({ status: "ok", url: runtime.url, port: runtime.port });
  } catch (err) {
    return c.json({ status: "error", message: err instanceof Error ? err.message : "Failed to start runtime" }, 500);
  }
});

app.post("/projects/:id/runtime/stop", async (c) => {
  const projectId = c.req.param("id");
  try {
    await stopDevServer(projectId);
    return c.json({ status: "ok" });
  } catch (err) {
    return c.json({ status: "error", message: err instanceof Error ? err.message : "Failed to stop runtime" }, 500);
  }
});

app.get("/projects/:id/runtime", (c) => {
  const projectId = c.req.param("id");
  const runtime = getRuntime(projectId);
  if (!runtime) {
    return c.json({ status: "not_found" }, 404);
  }
  return c.json({
    status: "ok",
    runtime: {
      port: runtime.port,
      url: runtime.url,
      status: runtime.status,
      startedAt: runtime.startedAt,
    },
  });
});

app.post("/projects/:id/files", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const { path: filePath, content } = body;

  if (!filePath || content === undefined) {
    return c.json({ status: "error", message: "path and content required" }, 400);
  }

  const success = updateProjectFile(projectId, filePath, content);
  return c.json({ status: success ? "ok" : "error" });
});

app.get("/projects/:id/files", (c) => {
  const projectId = c.req.param("id");
  const files = listProjectFiles(projectId);
  return c.json({ status: "ok", files });
});

app.get("/projects/:id/files/:path{.+}", (c) => {
  const projectId = c.req.param("id");
  const filePath = c.req.param("path");
  const content = getProjectFile(projectId, filePath);
  if (content === null) {
    return c.json({ status: "error", message: "File not found" }, 404);
  }
  return c.json({ status: "ok", content });
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
        const send = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: event, ...data })}\n\n`)
          );
        };

        try {
          // Step 1: Analyze input
          send("thinking", { message: `I need to build: ${prompt.trim().slice(0, 100)}${prompt.length > 100 ? "..." : ""}` });
          await new Promise((r) => setTimeout(r, 200));

          // Step 2: Detect if URL — plan the approach
          const isUrl = /https?:\/\//i.test(prompt.trim());
          if (isUrl) {
            const url = prompt.trim().match(/(https?:\/\/[^\s]+)/i)?.[1];
            send("thinking", { message: `I'll clone the website at ${url}. Let me start by crawling all pages and downloading assets.` });
            send("agent_start", { agent: "Web Crawler", action: `Scraping ${url}` });
            send("thinking", { message: "Discovering all internal links, navigation, and asset URLs..." });
          } else {
            send("thinking", { message: "Let me analyze what you want and plan the project structure." });
            send("agent_start", { agent: "Router", action: "Detecting project type" });
            await new Promise((r) => setTimeout(r, 300));
            send("agent_complete", { agent: "Router", detail: "Project type identified" });
          }

          // Step 3: Run the actual generation
          const startTime = Date.now();

          send("agent_start", { agent: "Product Manager", action: "Analyzing requirements" });
          send("thinking", { message: "I'm analyzing the requirements and planning the architecture..." });

          const result = await runGeneration({
            prompt: prompt.trim(),
            factory,
            name: name?.trim(),
          }, (event, data) => {
            // Forward progress events from the pipeline as SSE
            send(event, data);
          });

          const totalMs = Date.now() - startTime;

          // Step 4: Report results based on what was generated
          if (isUrl && result.scraped) {
            const pageCount = result.scraped.pages.length;
            const assetCount = (result.scraped.assets || []).length;
            send("agent_complete", { agent: "Web Crawler", detail: `Found ${pageCount} pages, ${assetCount} assets` });
            send("thinking", { message: `Crawled ${pageCount} pages and downloaded ${assetCount} assets. Now building the clone...` });
          } else {
            send("agent_complete", { agent: "Product Manager", detail: "Requirements analyzed" });
          }

          send("agent_start", { agent: "Frontend Engineer", action: "Generating components" });
          send("thinking", { message: `Generating ${result.files?.length || 0} files...` });

          await new Promise((r) => setTimeout(r, 200));
          send("agent_complete", { agent: "Frontend Engineer", detail: `${result.files?.length || 0} files generated` });
          send("agent_start", { agent: "QA Engineer", action: "Validating build" });
          send("thinking", { message: "Validating the build and checking for errors..." });

          await new Promise((r) => setTimeout(r, 200));
          const quality = Math.round(result.qualityScore * 100);
          send("agent_complete", { agent: "QA Engineer", detail: `Quality: ${quality}%` });

          if (result.errors && result.errors.length > 0) {
            send("thinking", { message: `Build completed with ${result.errors.length} warning(s). Quality score: ${quality}%` });
          } else {
            send("thinking", { message: `Build passed with quality score: ${quality}%. Everything looks good!` });
          }

          // Send files
          if (result.files && result.files.length > 0) {
            send("files", { files: result.files });
          }

          // Generate and send preview URL
          if (result.files && result.files.length > 0) {
            try {
              const scraped = result.scraped;
              const homePage = scraped?.pages?.find(p => p.path === "/") || scraped?.pages?.[0];

              if (homePage?.fullHtml) {
                // Embed homepage HTML directly as data URL — works everywhere
                const previewUrl = `data:text/html;charset=utf-8,${encodeURIComponent(homePage.fullHtml)}`;
                send("preview_url", { url: previewUrl });
              } else {
                // Fallback to reconstructed preview
                const previewHtml = generatePreviewHtml(scraped || null, name?.trim() || "Project");
                const previewUrl = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
                send("preview_url", { url: previewUrl });
              }
            } catch (previewErr) {
              console.error("Preview generation failed:", previewErr);
            }
          }

          // Send preview URL if project exists
          if (result.projectId) {
            send("project_id", { projectId: result.projectId });
          }

          send("progress", { progress: 100, message: "Generation complete" });

          send("complete", {
            projectId: result.projectId,
            summary: `Generated ${result.files.length} files in ${totalMs}ms. Quality: ${Math.round(result.qualityScore * 100)}%`,
            totalMs,
          });

          controller.close();
        } catch (err) {
          send("error", {
            message: err instanceof Error ? err.message : "Generation failed",
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

// ── Iterative Editing (SSE) ────────────────────────────────

app.post("/projects/:id/edit", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const { instruction } = body;

  if (!instruction || typeof instruction !== "string") {
    return c.json({ error: "Instruction is required" }, 400);
  }

  const accept = c.req.header("accept") || "";
  const wantsSSE = accept.includes("text/event-stream");

  if (wantsSSE) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: event, ...data })}\n\n`)
          );
        };

        try {
          send("progress", { progress: 10, message: "Analyzing edit request..." });
          send("agent_start", { agent: "Router", action: "Understanding edit intent" });

          const { callLLMWithFallback } = await import("@/lib/llm-adapter");
          const { getSupabase } = await import("@/lib/supabase");

          const supabase = getSupabase();

          // Get existing project
          const { data: project } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

          if (!project) {
            send("error", { message: "Project not found" });
            controller.close();
            return;
          }

          send("agent_complete", { agent: "Router", detail: `Editing project: ${project.name}` });
          send("progress", { progress: 30, message: "Generating code modifications..." });
          send("agent_start", { agent: "Frontend Engineer", action: "Applying changes" });

          // Use LLM to generate code modifications
          const systemPrompt = `You are a frontend engineer. Given an existing project and an edit instruction, generate the modified files.
Return ONLY valid JSON array of files to update:
[{"path": "src/components/Hero.tsx", "content": "full updated file content"}]
Only include files that need to change. Do not include unchanged files.`;

          const messages = [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: `Project: ${project.name}\nFactory: ${project.factory}\nOriginal prompt: ${project.prompt}\n\nEdit instruction: ${instruction}\n\nReturn the modified files as JSON.` },
          ];

          const { content } = await callLLMWithFallback(messages, {
            model: "gpt-4o-mini",
            temperature: 0.3,
            maxTokens: 4000,
          });

          if (content) {
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            try {
              const files = JSON.parse(cleaned);
              if (Array.isArray(files)) {
                send("files", { files });
              }
            } catch {
              send("error", { message: "Failed to parse edit response" });
            }
          }

          send("agent_complete", { agent: "Frontend Engineer", detail: "Changes applied" });
          send("progress", { progress: 100, message: "Edit complete" });
          send("complete", { projectId, summary: `Applied edit: ${instruction.slice(0, 100)}` });

          controller.close();
        } catch (err) {
          send("error", { message: err instanceof Error ? err.message : "Edit failed" });
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

  return c.json({ error: "Use SSE for real-time updates" }, 400);
});

app.get("/projects/:id/download", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabase();

  // Try to download the static site clone first (actual HTML + assets)
  const { data: cloneData, error: cloneError } = await supabase.storage
    .from("generated-projects")
    .download(`${id}/clone.zip`);

  if (!cloneError && cloneData) {
    const arrayBuffer = await cloneData.arrayBuffer();
    return new Response(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="cloned-site-${id}.zip"`,
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });
  }

  // Fallback: download generated Next.js project
  const { data, error } = await supabase.storage
    .from("generated-projects")
    .download(`${id}/project.zip`);

  if (error) {
    return c.json({ error: "Download not available" }, 404);
  }

  const arrayBuffer = await data.arrayBuffer();

  return new Response(new Uint8Array(arrayBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="project-${id}.zip"`,
      "Content-Length": arrayBuffer.byteLength.toString(),
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

// ── Clone Preview & Download ─────────────────────────────

import { listPages, getPageHtml, getSite } from "@/lib/clone-store";

// List all pages for a cloned site
app.get("/clone/pages/:projectId", (c) => {
  const projectId = c.req.param("projectId");
  const pages = listPages(projectId);
  if (pages.length === 0) {
    return c.json({ error: "No pages found for this project" }, 404);
  }
  return c.json({ pages, count: pages.length });
});

// Get HTML for a specific page
app.get("/clone/page/:projectId", (c) => {
  const projectId = c.req.param("projectId");
  const path = c.req.query("path") || "/";
  const html = getPageHtml(projectId, path);
  if (!html) {
    return c.json({ error: "Page not found" }, 404);
  }
  return c.html(html);
});

// Download entire cloned site as JSON
app.get("/clone/download/:projectId", (c) => {
  const projectId = c.req.param("projectId");
  const site = getSite(projectId);
  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }
  const pages: Record<string, { title: string; html: string }> = {};
  for (const [path, page] of site.pages) {
    pages[path] = { title: page.title, html: page.fullHtml };
  }
  return c.json({
    baseUrl: site.baseUrl,
    rootDomain: site.rootDomain,
    pages,
    pageCount: site.pages.size,
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
