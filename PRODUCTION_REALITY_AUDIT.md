# PRODUCTION_REALITY_AUDIT.md

**Date:** 2026-06-16
**Scope:** What actually executes in production today — no assumptions, no planned features.

---

## 1. SSE Streaming

**Status: Partially Active**

### Endpoint
`POST /api/generate` — `web/app/api/[...route]/route.ts:188-264`

### Client
`web/app/(dashboard)/projects/new/page.tsx:98-109` — `fetch("/api/generate", { headers: { Accept: "text/event-stream" } })`

### Execution Path
1. Server reads `Accept` header (line 200): `const wantsSSE = accept.includes("text/event-stream")`
2. If SSE: creates `ReadableStream` with `Content-Type: text/event-stream` (lines 203-249)
3. Sends 2 `progress` events (lines 214, 218): `{ step: "routing", label: "Analyzing input..." }`, `{ step: "routing", label: "Detecting factory type..." }`
4. Calls `await runGeneration()` (line 220) — **blocks until complete**
5. Sends 1 `complete` event (line 228) with full result
6. Client parses `event:` / `data:` lines (lines 128-158)

### What Actually Works
- Transport layer: functional — events stream correctly
- Client parser: handles `progress`, `agent`, `complete`, `error` event types

### What Does NOT Work
- **Only 2 progress events are sent**, both with `step: "routing"`
- **`agent` event is never emitted** from server — client handler (line 145) is dead code
- **5-step progress indicator never advances** — stuck on "routing" until `complete`
- **No incremental progress** during LLM calls, agent execution, or ZIP creation — `runGeneration()` is a single blocking `await`
- Effectively a deferred JSON response with 2 preflight events, not true streaming

### Database Tables
None directly (delegates to `runGeneration()`)

### Storage Buckets
None directly

### External APIs
None directly

---

## 2. Auth

**Status: Not Used (Bypassed)**

### Endpoint
`web/middleware.ts:4-8` — middleware handler
`web/lib/supabase/middleware.ts:4-42` — `updateSession()`

### Execution Path
1. Middleware runs for all non-static routes (line 12 matcher)
2. For `/api/*` routes: **early return** — skips `updateSession()` entirely (line 5-6)
3. For page routes: calls `updateSession()` which creates a Supabase client and calls `NextResponse.next()`
4. **No `getUser()` call.** **No session check.** **No redirect to `/login`**

### What Executes Today
- `updateSession()` creates a Supabase server client and propagates cookies
- `getUser()` and `getSession()` exist in `web/lib/supabase/server.ts:5-33` but are **never imported or called anywhere** — dead code
- Sidebar (`web/components/dashboard/sidebar.tsx`) calls `supabase.auth.getUser()` client-side to display email if available, but does not redirect if not
- Login page (`web/app/(auth)/login/page.tsx`) calls `signInWithPassword()` — functional but user must voluntarily log in
- OAuth callback (`web/app/api/auth/callback/route.ts`) exchanges code for session — functional
- Signout route (`web/app/api/auth/signout/route.ts`) clears cookies — functional

### Security Reality
- **Unauthenticated user visiting `/dashboard` sees full dashboard with all data**
- **All API routes are public** — middleware skips `/api/*`
- **API routes use service role key** (`web/lib/supabase.ts:6`: `env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY`) — bypasses all RLS

### Database Tables
None directly (cookie propagation only)

### Storage Buckets
None

### External APIs
Supabase Auth (cookie management)

---

## 3. Generation

**Status: Active**

### Endpoint
`POST /api/generate` — `web/app/api/[...route]/route.ts:188-264`

### Execution Path
1. Parse request body: `prompt`, `factory`, `name` (line 196-198)
2. Call `runGeneration()` from `web/lib/generation-pipeline.ts:915-1084`
3. `runGeneration()` executes:

| Step | Line | Operation |
|------|------|-----------|
| 1 | 916 | `getSupabase()` — create client with service role key |
| 2 | 917 | `detectFactory(prompt, factory)` — regex keyword matching |
| 3 | 918 | `extractProjectName(prompt, name)` — regex extraction + sanitize |
| 4 | 922-933 | **INSERT** `projects` table — `{ name, factory, prompt, quality_score: 0, build_success: false, file_count: 0 }` |
| 5 | 939-944 | **Parallel fan-out** (4 concurrent): `generateLLMContent()`, `runAgentWorkflow()`, `retrieveMemory()`, `predictQuality()` |
| 6 | 945 | `generateFiles(prompt, factory, name, llmContent)` — template-based file generation |
| 7 | 946 | `buildBlueprint(prompt, factory, name)` — blueprint JSON construction |
| 8 | 947 | `calculateQualityScore(files)` — heuristic scoring (file count, required files, structure) |
| 9 | 948 | `validateBuild(files)` — 7-category static analysis |
| 10 | 951-954 | `getOptimizedBlueprintForFactory(factory, blueprint)` — feedback optimization |
| 11 | 956-964 | **INSERT** `blueprints` table — `{ project_id, json: blueprint }` |
| 12 | 966-977 | **INSERT** `generations` table — `{ factory, prompt, result, build_success: false, file_count }` |
| 13 | 979-990 | Create ZIP (jszip), **UPLOAD** to `generated-projects` storage bucket at `${projectId}/project.zip` |
| 14 | 992-1005 | **UPDATE** `projects` table — `{ quality_score, build_success, file_count, updated_at }` |
| 15 | 1020-1032 | **INSERT** `generations` table again (via `recordGeneration()`) with embedding |
| 16 | 1035-1043 | **UPSERT** `patterns` table (via `recordPatterns()`) |

### File Generation Details
`generateFiles()` at lines 812-886:
- Config files: `package.json`, `tsconfig.json`, `tailwind.config.mjs`, `postcss.config.mjs`, `next.config.mjs`
- App files: `src/app/layout.tsx`, `src/app/globals.css`
- Pages: generated from blueprint pages array
- Components: generated from blueprint components array using factory-specific generators
- If LLM content available: uses `genHeroLLM`, `genFeaturesLLM`, `genAboutLLM`, `genCTALLM`

### Database Tables
| Table | Operation |
|-------|-----------|
| `projects` | INSERT (line 922), UPDATE (line 992) |
| `blueprints` | INSERT (line 956) |
| `generations` | INSERT (line 966), INSERT (line 1020 via recordGeneration) |
| `patterns` | UPSERT (line 1041 via recordPatterns) |

### Storage Buckets
| Bucket | Operation | Path |
|--------|-----------|------|
| `generated-projects` | Upload | `${projectId}/project.zip` |

### External APIs
| API | Purpose |
|-----|---------|
| OpenAI Chat Completions (gpt-4o-mini) | Content generation (1 call) + 6 agent calls |
| OpenAI Embeddings (text-embedding-3-small) | Prompt embedding for memory |
| OpenAI Embeddings (text-embedding-3-small) | Embedding for recordGeneration (1 call) |

---

## 4. Agent Runtime

**Status: Active**

### Endpoint
Called from `runGeneration()` at `web/lib/generation-pipeline.ts:941`

### Code
`web/lib/agent-executor-adapter.ts` — 243 lines

### Execution Path
1. `runAgentWorkflow(prompt, factory, projectName)` called from pipeline (line 941)
2. Builds context object (lines 163-173)
3. Runs 6 agents **in parallel** via `Promise.allSettled` (line 187):
   - `product-manager` (lines 24-36)
   - `frontend-engineer` (lines 37-48)
   - `seo-specialist` (lines 49-61)
   - `qa-engineer` (lines 62-73)
   - `security-agent` (lines 74-85)
   - `performance-agent` (lines 86-97)
4. Each agent builds a prompt, calls `callLLMWithFallback()` with model `gpt-4o-mini`, temperature `0.5`, maxTokens `500`
5. Each agent has **10-second timeout** (`AGENT_TIMEOUT_MS = 10000`, line 100) via `Promise.race`
6. On timeout or error: returns `{ success: false, output: "", tokens: 0 }` — **silently absorbed**
7. Aggregates results: `successCount`, `failCount`, `totalTokens`, `totalDuration`
8. Extracts insights from agent outputs (lines 192-230): scope, features, seoTitle, securityIssues, performanceScore, testCoverage

### What Actually Executes
- If `OPENAI_API_KEY` is set: 6 parallel OpenAI API calls, each ~2-5 seconds, with 10s timeout
- If `OPENAI_API_KEY` is not set: `isLLMAvailable()` returns false, all agents return immediately with `success: false`

### Database Tables
None

### Storage Buckets
None

### External APIs
| API | Calls | Model |
|-----|-------|-------|
| OpenAI Chat Completions | 6 (parallel) | gpt-4o-mini |

---

## 5. Memory Retrieval

**Status: Active**

### Endpoint
Called from `runGeneration()` at `web/lib/generation-pipeline.ts:942`

### Code
`web/lib/memory-adapter.ts` — 255 lines

### Execution Path
1. `retrieveMemory(prompt, factory)` called from pipeline (line 942)
2. **4 parallel Supabase queries** via `Promise.allSettled` (lines 50-74):

| # | Table | Query | Lines |
|---|-------|-------|-------|
| 1 | `projects` | SELECT `name, factory, prompt, quality_score, file_count` WHERE `factory = X` ORDER BY `created_at DESC` LIMIT 5 | 52-57 |
| 2 | `projects` | SELECT `factory, file_count, quality_score` WHERE `factory = X AND build_success = true` ORDER BY `quality_score DESC` LIMIT 10 | 58-64 |
| 3 | `projects` | SELECT `build_success, quality_score` WHERE `factory = X` (stats) | 65-68 |
| 4 | `projects` | SELECT `name, factory, prompt, quality_score, file_count` ORDER BY `created_at DESC` LIMIT 50 | 69-73 |

3. Computes `factoryStats`: `totalGenerations`, `successRate`, `avgQuality` (lines 76-86)
4. **Semantic similarity search** (lines 88-110):
   - Generates embedding for prompt via `generateEmbedding(prompt)`
   - Iterates over ALL 50 projects from query #4
   - For each: generates embedding for `project.prompt`, computes `cosineSimilarity()`
   - Filters by `similarity > 0.3`, takes top 5
5. Returns `MemoryContext` with `recentProjects`, `similarProjects`, `successfulPatterns`, `factoryStats`

### Database Tables
| Table | Operation |
|-------|-----------|
| `projects` | SELECT × 4 |

### Storage Buckets
None

### External APIs
| API | Purpose |
|-----|---------|
| OpenAI Embeddings (text-embedding-3-small) | Generate embeddings for prompt + up to 50 projects (brute-force) |

### Known Issues
- **pgvector is NOT used server-side** — all similarity search is brute-force in JavaScript
- Embedding column in `generations` table stores JSON-serialized vector but is never queried back
- Without `OPENAI_API_KEY`: falls back to hash-based embeddings (low quality)

---

## 6. pgvector Retrieval

**Status: Not Used (Fallback Only)**

### Code
`web/lib/embedding-service.ts` — 90 lines
`deploy/PGVECTOR_MIGRATION.sql` — migration file (not run)

### What Actually Executes
1. `generateEmbedding(text)` is called from `memory-adapter.ts:91`
2. Checks for `OPENAI_API_KEY` (lines 9-14)
3. If key exists: calls `POST https://api.openai.com/v1/embeddings` with model `text-embedding-3-small` (lines 17-27)
4. If key missing or call fails: falls back to `generateFallbackEmbedding()` (lines 47-65) — deterministic 128-dim hash-based pseudo-embedding
5. Result is used for brute-force cosine similarity in `memory-adapter.ts` (lines 94-108)

### What Does NOT Execute
- **`deploy/PGVECTOR_MIGRATION.sql` has NOT been run in Supabase** — no `vector` extension, no `embedding` columns, no `ivfflat` indexes, no `search_projects()` or `search_generations()` RPC functions
- **No SQL-level vector search** — the `<=>` operator is never used
- **`embedding` column in `generations` table** stores JSON.stringify(embedding) but is never queried back for similarity

### Database Tables
| Table | Operation |
|-------|-----------|
| `generations` | INSERT with embedding (write-only, never read back) |

### Storage Buckets
None

### External APIs
| API | Purpose |
|-----|---------|
| OpenAI Embeddings (text-embedding-3-small) | Embedding generation (when key available) |

---

## 7. Feedback

**Status: Active**

### Endpoints
- `POST /api/feedback` — `web/app/api/[...route]/route.ts:377-403`
- `GET /api/feedback` — `web/app/api/[...route]/route.ts:366-375`

### Client
`web/app/(dashboard)/projects/[id]/page.tsx:74-109` — feedback form submission

### Execution Path
1. User fills form: rating (1-5), category (general|quality|design|content|performance), comment (optional)
2. Form submits to `POST /api/feedback` with body `{ project_id, rating, comment, category }`
3. Server validates (lines 382-391):
   - `project_id` is required
   - `rating` is required, must be 1-5
   - `category` must be in allowed list
4. **INSERT** `feedback_entries` table (line 390): `{ project_id, rating, comment, category }`
5. Returns inserted feedback object
6. Client prepends to local `project.feedback` array (line 91)

### Database Tables
| Table | Operation |
|-------|-----------|
| `feedback_entries` | INSERT (POST), SELECT (GET) |

### Storage Buckets
None

### External APIs
None

---

## 8. Analytics

**Status: Active**

### Endpoints
- `GET /api/stats` — `web/app/api/[...route]/route.ts:14-98`
- `GET /api/analytics/overview` — `web/app/api/[...route]/route.ts:433-505`

### Client
`web/app/(dashboard)/dashboard/page.tsx:46-54` — parallel fetch of both endpoints

### Execution Path — `/api/stats`
1. **SELECT** `projects` — count all (line 21)
2. **SELECT** `generations` — count all (line 28)
3. **SELECT** `projects` — count where `build_success = true` (line 35)
4. **SELECT** `projects` — avg `quality_score` (line 42)
5. **SELECT** `generations` — avg latency from `result` JSON field (line 49)
6. **SELECT** `projects` — last 5 ordered by `created_at DESC` (line 57)
7. **SELECT** `projects` — group by `factory` (line 67)
8. **SELECT** `generations` — group by `factory`, avg latency (line 77)
9. **SELECT** `projects` — group by `created_at::date` (line 87)

### Execution Path — `/api/analytics/overview`
1. **SELECT** `projects` — group by `factory` with stats (lines 440-447)
2. **SELECT** `feedback_entries` — all (line 450)
3. **SELECT** `feedback_entries` — group by category, avg rating (line 456)
4. **SELECT** `projects` — group by `created_at::date` for last 30 days (line 470)
5. **SELECT** `generations` — group by `created_at::date` for last 30 days (line 480)

### Database Tables
| Table | Operation |
|-------|-----------|
| `projects` | SELECT × 7 |
| `generations` | SELECT × 3 |
| `feedback_entries` | SELECT × 2 |

### Storage Buckets
None

### External APIs
None

---

## 9. Blueprint Optimization

**Status: Active (Low Impact)**

### Endpoint
Called from `runGeneration()` at `web/lib/generation-pipeline.ts:951-954`

### Code
`web/lib/blueprint-optimizer.ts` — 179 lines

### Execution Path
1. `getOptimizedBlueprintForFactory(factory, blueprint)` called from pipeline
2. Calls `getFeedbackInsights(factory)` (lines 17-90):
   - **SELECT** `projects` — IDs where `factory = X` (lines 22-25)
   - **SELECT** `feedback_entries` — ratings where `project_id IN (ids)` (lines 39-42)
   - Computes average rating per category
3. Calls `optimizeBlueprint(baseBlueprint, insights)` (lines 92-168):
   - If `avgRating > 0 && avgRating < 3`: adds `Features`, `Testimonials` components (lines 110-120)
   - If design category avg < 3: adds `CTA`, `Newsletter` components (lines 132-139)
   - If content category avg < 3: adds `AboutContent` to `/about` page (lines 151-154)
4. Returns modified blueprint with `optimizations` array

### What Actually Happens
- First generation for any factory: **no feedback exists** → `avgRating = 0` → no optimizations applied
- After feedback is submitted: blueprint gets 2-4 extra components injected
- Optimization is **advisory only** — the pipeline still generates files based on the original `buildBlueprint()` call, not the optimized blueprint

### Database Tables
| Table | Operation |
|-------|-----------|
| `projects` | SELECT (get project IDs by factory) |
| `feedback_entries` | SELECT (get ratings by project IDs) |

### Storage Buckets
None

### External APIs
None

---

## 10. ZIP Generation

**Status: Active**

### Endpoint
Created inside `runGeneration()` at `web/lib/generation-pipeline.ts:979-990`

### Execution Path
1. Dynamic import of `jszip` (line 907): `const JSZip = (await import("jszip")).default`
2. Create new zip instance (line 908)
3. Loop over all generated files, add each to zip (lines 909-911)
4. Generate buffer: `await zip.generateAsync({ type: "nodebuffer" })` (line 912)
5. Upload to Supabase Storage (lines 980-985):
   ```ts
   supabase.storage
     .from("generated-projects")
     .upload(`${projectId}/project.zip`, zipBuffer, {
       contentType: "application/zip",
       upsert: true,
     })
   ```
6. On error: pushed to `errors` array, not fatal

### Database Tables
None (ZIP is binary, stored in Storage)

### Storage Buckets
| Bucket | Operation | Path |
|--------|-----------|------|
| `generated-projects` | Upload | `${projectId}/project.zip` |

### External APIs
None

---

## 11. Storage

**Status: Active**

### Buckets Used
| Bucket | Operations | Endpoints |
|--------|-----------|-----------|
| `generated-projects` | Upload, Download, Delete | `generation-pipeline.ts:980` (upload), `route.ts:306` (download), `route.ts:172` (delete) |

### Execution Path — Upload
`generation-pipeline.ts:979-990` — during generation, ZIP uploaded to `${projectId}/project.zip`

### Execution Path — Download
`route.ts:302-324` — `GET /api/projects/:id/download`:
1. Supabase client downloads from `generated-projects/${id}/project.zip`
2. Returns as `application/zip` response

### Execution Path — Delete
`route.ts:168-180` — `DELETE /api/projects/:id`:
1. Removes from `generated-projects/${id}/project.zip` (line 172)
2. Deletes from `blueprints`, `evaluations`, `feedback_entries`, `projects` tables

### Other Buckets (Created But Unused)
| Bucket | Status |
|--------|--------|
| `blueprints` | Created in setup, never used — blueprints stored as JSON in `blueprints` table |
| `screenshots` | Created in setup, never used |
| `documents` | Created in setup, never used |
| `figma` | Created in setup, never used |

### Database Tables
None

### Storage Buckets
`generated-projects` only

### External APIs
None

---

## 12. Dashboard

**Status: Active**

### Endpoints
- `GET /api/stats` — `web/app/api/[...route]/route.ts:14-98`
- `GET /api/analytics/overview` — `web/app/api/[...route]/route.ts:433-505`

### Client
`web/app/(dashboard)/dashboard/page.tsx` — fetches both endpoints in parallel

### Execution Path
1. On mount, fires `Promise.all([fetch("/api/stats"), fetch("/api/analytics/overview")])`
2. Renders:
   - KPI cards: Total Projects, Generations, Success Rate, Avg Latency
   - Recent Projects list (last 5)
   - Factory Distribution bar chart
   - Daily Generations bar chart (last 7 days)
   - Factory Performance table (success rate, quality, latency per factory)
   - Feedback Summary (total reviews, avg rating, by-category breakdown)
   - Quick Start link

### Database Tables
| Table | Operation |
|-------|-----------|
| `projects` | SELECT × 7 |
| `generations` | SELECT × 3 |
| `feedback_entries` | SELECT × 2 |

### Storage Buckets
None

### External APIs
None

---

## Complete API Endpoint Reference

| Method | Endpoint | Status | Auth | Supabase Tables | Storage | External APIs |
|--------|----------|--------|------|-----------------|---------|---------------|
| `GET` | `/api/health` | Active | No | None | None | None |
| `GET` | `/api/stats` | Active | No | `projects`, `generations` | None | None |
| `GET` | `/api/projects` | Active | No | `projects` | None | None |
| `GET` | `/api/projects/:id` | Active | No | `projects`, `blueprints`, `evaluations`, `feedback_entries` | None | None |
| `POST` | `/api/projects` | Active | No | `projects` | None | None |
| `DELETE` | `/api/projects/:id` | Active | No | `blueprints`, `evaluations`, `feedback_entries`, `projects` | `generated-projects` | None |
| `GET` | `/api/generate` | Active | No | None | None | None |
| `POST` | `/api/generate` | Active | No | `projects`, `blueprints`, `generations`, `patterns` | `generated-projects` | OpenAI × 8 |
| `GET` | `/api/projects/:id/files` | Active | No | `blueprints` | None | None |
| `GET` | `/api/projects/:id/download` | Active | No | None | `generated-projects` | None |
| `GET` | `/api/generations` | Active | No | `generations` | None | None |
| `GET` | `/api/projects/:id/evaluations` | Active | No | `evaluations` | None | None |
| `GET` | `/api/feedback` | Active | No | `feedback_entries` | None | None |
| `POST` | `/api/feedback` | Active | No | `feedback_entries` | None | None |
| `GET` | `/api/benchmarks` | Active | No | `benchmark_results` | None | None |
| `POST` | `/api/benchmarks` | Active | No | `benchmark_results` | None | None |
| `GET` | `/api/analytics/overview` | Active | No | `projects`, `generations`, `feedback_entries` | None | None |

---

## Complete Supabase Table Reference

| Table | Reads | Writes | Deletes |
|-------|-------|--------|---------|
| `projects` | stats, projects list, projects detail, analytics, memory (×4), pattern prediction, feedback insights | generate (INSERT + UPDATE), create project | DELETE /api/projects/:id |
| `blueprints` | projects detail, files | generate (INSERT) | DELETE /api/projects/:id |
| `generations` | stats, analytics | generate (INSERT ×2), memory (INSERT) | None |
| `feedback_entries` | projects detail, analytics, blueprint optimization | POST /api/feedback | DELETE /api/projects/:id |
| `evaluations` | projects detail | None in production | DELETE /api/projects/:id |
| `patterns` | quality prediction | generate (UPSERT via recordPatterns) | None |
| `benchmark_results` | GET /api/benchmarks | POST /api/benchmarks | None |

## Complete Storage Reference

| Bucket | Reads | Writes | Deletes |
|--------|-------|--------|---------|
| `generated-projects` | GET /api/projects/:id/download | POST /api/generate (ZIP upload) | DELETE /api/projects/:id |
| `blueprints` | None | None | None |
| `screenshots` | None | None | None |
| `documents` | None | None | None |
| `figma` | None | None | None |

## Complete External API Reference

| API | Endpoint | Calls Per Generation | Purpose |
|-----|----------|---------------------|---------|
| OpenAI Chat Completions | `POST https://api.openai.com/v1/chat/completions` | 7 (1 content + 6 agents) | LLM content + agent analysis |
| OpenAI Embeddings | `POST https://api.openai.com/v1/embeddings` | 1-52 (1 query + up to 50 brute-force + 1 record) | Semantic similarity search |
| Supabase REST | Implicit via `@supabase/supabase-js` | ~15-20 queries | Database + Storage |

## Score Summary

| Feature | Status | Score |
|---------|--------|-------|
| SSE Streaming | Partially Active | 4/10 |
| Auth | Not Used | 0/10 |
| Generation | Active | 9/10 |
| Agent Runtime | Active | 8/10 |
| Memory Retrieval | Active (brute-force) | 5/10 |
| pgvector Retrieval | Not Used (fallback) | 1/10 |
| Feedback | Active | 8/10 |
| Analytics | Active | 8/10 |
| Blueprint Optimization | Active (low impact) | 4/10 |
| ZIP Generation | Active | 9/10 |
| Storage | Active (1/5 buckets) | 5/10 |
| Dashboard | Active | 8/10 |

**Overall Production Readiness: 67/120 (56%)**
