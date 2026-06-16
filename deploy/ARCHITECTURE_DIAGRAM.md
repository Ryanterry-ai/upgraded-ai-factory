# Architecture Diagram — Upgraded AI Factory

Production architecture based on actual codebase implementation.

---

## Current Architecture (CLI-Only)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  CLI: studio  │  │ CLI: runtime │  │CLI: benchmark│  ...     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CORE ENGINE                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ StudioEngine (src/core/engine.ts)                    │       │
│  │ - FactoryRegistry                                    │       │
│  │ - FactoryRouter (src/core/factory-router.ts)         │       │
│  │ - RequirementUnderstandingEngine                     │       │
│  └────────────────────────┬────────────────────────────┘       │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────┐       │
│  │         7 FACTORIES (src/factories/)                │       │
│  │                                                     │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │       │
│  │  │ Website  │ │Ecommerce │ │   SaaS   │            │       │
│  │  └──────────┘ └──────────┘ └──────────┘            │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │       │
│  │  │Dashboard │ │  Admin   │ │  Agent   │            │       │
│  │  └──────────┘ └──────────┘ └──────────┘            │       │
│  │  ┌──────────┐                                      │       │
│  │  │  Tools   │                                      │       │
│  │  └──────────┘                                      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ CODE GENERATION (src/generators/)                    │       │
│  │ - codegen.ts (pages, components, configs)            │       │
│  │ - blueprint-gen.ts (Blueprint JSON/YAML)             │       │
│  └────────────────────────┬────────────────────────────┘       │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATED OUTPUT                              │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Blueprint│  │  Next.js │  │ Tailwind │  │ package  │       │
│  │ JSON/YAML│  │  Source  │  │  Config  │  │  .json   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  CLI     │────▶│  Factory │────▶│ Generated│
│  Prompt  │     │  Router  │     │  Engine  │     │  Files   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │                │                │                │
     ▼                ▼                ▼                ▼
 "Build a        Detect type     Generate code     Write to
  landing page"  (website)       (codegen)         disk/tmp
```

### Detailed Flow

1. **User Input** → CLI receives prompt string
2. **Requirement Engine** → Normalizes to canonical schema
3. **Factory Router** → Selects best factory (website/ecommerce/saas/etc.)
4. **Blueprint Generator** → Creates Blueprint JSON/YAML
5. **Code Generator** → Generates Next.js components, pages, configs
6. **Auto-Repair** → Fixes missing components, "use client" directives
7. **Output** → Files written to temp directory

---

## Agent Flow (Phase 7.5)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Workflow │────▶│  Agent   │────▶│   LLM    │────▶│ Artifacts│
│  Nodes   │     │ Executor │     │  Client  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     ▼                ▼                ▼                ▼
 LangGraph-      Build prompt   Call OpenAI/     Parse JSON
 style state     with context   Anthropic/       from LLM
 machine         + artifacts    OpenRouter       response
```

### Agent Execution Pipeline

1. **Workflow Definition** → `getWorkflowNodes(factoryType)` returns node list
2. **For Each Node:**
   a. Get agent definition from `getAgentById()`
   b. Build context from memory + previous artifacts
   c. Retrieve relevant artifacts from `ArtifactRetriever`
   d. Inject artifacts into prompt via `ArtifactInjector`
   e. Build system + user messages via `PromptBuilder`
   f. Call LLM via `LLMClient.generate()`
   g. Parse artifacts from LLM response
   h. Store artifacts in memory
   i. Pass outputs to next agent

### Agent Departments (9)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Executive  │  │   Product   │  │   Research  │
│  (2 agents) │  │  (3 agents) │  │  (2 agents) │
└─────────────┘  └─────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Design    │  │ Engineering │  │   Quality   │
│ (4 agents)  │  │ (6 agents)  │  │ (4 agents)  │
└─────────────┘  └─────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Growth    │  │  Operations │  │  Website    │
│ (4 agents)  │  │  (2 agents) │  │ Intelligence│
└─────────────┘  └─────────────┘  │ (5 agents)  │
                                  └─────────────┘
```

---

## Memory Flow (Phase 6)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Generation│────▶│ Embedding│────▶│ Supabase │────▶│ Semantic │
│  Record   │     │ Service  │     │  Store   │     │ Search   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     ▼                ▼                ▼                ▼
 Store project   OpenAI API     PostgreSQL +      match_embeddings
 + blueprint     text-embedding  pgvector          function
 + patterns      -3-small (1536d)                   (cosine similarity)
```

### Memory Layers

```
┌─────────────────────────────────────────┐
│ Layer 1: Working Memory (In-Memory)     │
│ - Current session state                 │
│ - Agent artifacts                       │
│ - Previous outputs                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Layer 2: Shared Memory (In-Memory)      │
│ - Cross-agent artifact sharing          │
│ - Message bus                           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Layer 3: Persistent Memory (Supabase)   │
│ - Projects, blueprints, patterns        │
│ - Evaluations, generations              │
│ - Components, design systems            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Layer 4: Knowledge Base (Supabase)      │
│ - Embedding vectors (1536d)             │
│ - Semantic search via pgvector          │
│ - Pattern similarity matching           │
└─────────────────────────────────────────┘
```

---

## Storage Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Generated│────▶│  Memory  │────▶│ Supabase │
│  Files   │     │  Store   │     │ Storage  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     ▼                ▼                ▼
 Blueprint       Store to DB      Upload to
 JSON/YAML       (projects,       bucket
 + source        blueprints,      (generated-
 files           patterns)        projects)
```

### Storage Modes

1. **Local Mode** (default, no Supabase)
   - Files written to `os.tmpdir()/factory-output/`
   - In-memory Map stores all data
   - No persistence across restarts

2. **Supabase Mode** (production)
   - Files uploaded to Supabase Storage
   - Data persisted to PostgreSQL
   - Embeddings generated for semantic search

---

## AI Provider Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│   LLM    │────▶│ Provider │
│  Prompt  │     │  Client  │     │   API    │
└──────────┘     └──────────┘     └──────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ OpenAI  │  │Anthropic│  │OpenRouter│
    │  API    │  │  API    │  │   API   │
    └─────────┘  └─────────┘  └─────────┘
```

### Provider Selection

```
LLM_PROVIDER env var
        │
        ├── openai ──────▶ OPENAI_API_KEY
        │                  model: gpt-4o
        │
        ├── anthropic ───▶ ANTHROPIC_API_KEY
        │                  model: claude-sonnet-4-20250514
        │
        └── openrouter ──▶ OPENROUTER_API_KEY
                           model: openai/gpt-4o
                           base: openrouter.ai/api/v1
```

---

## Intelligence Layer (Phase 8)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Generation│────▶│ Pattern  │────▶│ Template │
│  Record   │     │ Learning │     │ Ranking  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     ▼                ▼                ▼
 Record to        Extract         Score and
 analytics        patterns,       rank by
                  detect          success rate,
                  similarity      quality, usage
```

### Intelligence Components

```
┌─────────────────────────────────────────────────────┐
│                INTELLIGENCE LAYER                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Pattern    │  │   Template   │                │
│  │   Learning   │  │   Ranking    │                │
│  └──────────────┘  └──────────────┘                │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Factory    │  │   Feedback   │                │
│  │  Analytics   │  │  Collector   │                │
│  └──────────────┘  └──────────────┘                │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Blueprint   │  │   Quality    │                │
│  │  Optimizer   │  │  Predictor   │                │
│  └──────────────┘  └──────────────┘                │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Component   │  │   Pattern    │                │
│  │   Ranking    │  │  Promoter    │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

---

## Production Target Architecture (Not Yet Built)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN / Vercel                             │
│                    (static assets, edge)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                             │
│                    (Not yet built)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Landing  │  │  Studio  │  │Dashboard │  │ Settings │       │
│  │   Page    │  │   UI     │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Hono/Express)                     │
│                    (Not yet built)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ /api/    │  │ /api/    │  │ /api/    │  │ /api/    │       │
│  │ generate │  │ projects │  │ feedback │  │ health   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ /api/    │  │ /api/    │                                    │
│  │ auth     │  │ benchmarks│                                   │
│  └──────────┘  └──────────┘                                    │
└───────┬──────────────────────────┬──────────────────────────────┘
        │                          │
        ▼                          ▼
┌──────────────┐          ┌──────────────┐
│  Supabase    │          │  LLM APIs    │
│  (Database + │          │  OpenAI      │
│   Storage +  │          │  Anthropic   │
│   Auth)      │          │  OpenRouter  │
└──────────────┘          └──────────────┘
```

---

## Data Flow Summary

| Flow | Source | Destination | Method |
|------|--------|-------------|--------|
| User → System | CLI/Web | API Server | HTTP/CLI args |
| System → LLM | Agent Executor | OpenAI/Anthropic | REST API |
| LLM → System | LLM Response | Artifacts | JSON parsing |
| System → Database | Memory Store | Supabase | REST API |
| Database → System | Supabase | Memory Store | REST API |
| Embeddings → Database | Embedding Service | pgvector | SQL |
| Search → Database | Retrieval System | pgvector | match_embeddings() |
| Files → Storage | Code Generator | Supabase Storage | REST API |
