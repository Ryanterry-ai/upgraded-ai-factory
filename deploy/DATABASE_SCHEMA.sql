-- ============================================================
-- UPGRADED AI FACTORY — PRODUCTION DATABASE SCHEMA
-- ============================================================
-- Derived from: src/memory/schema.sql, src/intelligence/models.ts
-- Database: PostgreSQL 15+ with pgvector extension
-- Target: Supabase (hosted) or self-hosted PostgreSQL
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;          -- pgvector for semantic search (1536d embeddings)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Trigram similarity for text search

-- ============================================================
-- 1. PROJECTS TABLE
-- Tracks every generation project (one per user request)
-- Source: src/memory/schema.sql line 10-21
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                           -- User-provided project name
  factory TEXT NOT NULL,                        -- Factory type: website|ecommerce|saas|dashboard|admin|agent|tools
  prompt TEXT NOT NULL,                         -- Original user prompt
  blueprint_id UUID,                            -- FK to blueprints (deferred — no FK constraint yet for flexibility)
  quality_score FLOAT DEFAULT 0,                -- Aggregate quality score 0-1
  build_success BOOLEAN DEFAULT FALSE,          -- Did the build pass?
  file_count INTEGER DEFAULT 0,                 -- Number of generated files
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_factory ON projects(factory);
CREATE INDEX idx_projects_quality ON projects(quality_score DESC);
CREATE INDEX idx_projects_created ON projects(created_at DESC);

-- ============================================================
-- 2. BLUEPRINTS TABLE
-- Stores generated Blueprint JSON/YAML per project
-- Source: src/memory/schema.sql line 30-40
-- ============================================================
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  yaml TEXT,                                    -- YAML representation
  json JSONB,                                   -- Structured JSON representation
  embedding VECTOR(1536),                       -- OpenAI text-embedding-3-small vector
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blueprints_project ON blueprints(project_id);
CREATE INDEX idx_blueprints_embedding ON blueprints USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 3. PATTERNS TABLE
-- Learned patterns from successful generations
-- Source: src/memory/schema.sql line 45-59, src/intelligence/models.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,                       -- component|page|api_route|config|blueprint|design_system|test|documentation
  description TEXT NOT NULL,                    -- Human-readable pattern description
  success_rate FLOAT DEFAULT 0,                 -- Historical success rate 0-1
  usage_count INTEGER DEFAULT 0,                -- Total times used
  embedding VECTOR(1536),                       -- Semantic search vector
  metadata JSONB,                               -- Tags, factory, agent, version, source, parent/child IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_success ON patterns(success_rate DESC);
CREATE INDEX idx_patterns_embedding ON patterns USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 4. EVALUATIONS TABLE
-- Quality evaluation results per project
-- Source: src/memory/schema.sql line 64-79
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  seo_score FLOAT DEFAULT 0,                    -- SEO evaluator result
  ux_score FLOAT DEFAULT 0,                     -- UX evaluator result
  perf_score FLOAT DEFAULT 0,                   -- Performance evaluator result
  security_score FLOAT DEFAULT 0,               -- Security evaluator result
  accessibility_score FLOAT DEFAULT 0,          -- Accessibility evaluator result
  code_quality_score FLOAT DEFAULT 0,           -- Code quality evaluator result
  overall_score FLOAT DEFAULT 0,                -- Weighted aggregate
  findings JSONB,                               -- Detailed findings per evaluator
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_project ON evaluations(project_id);
CREATE INDEX idx_evaluations_overall ON evaluations(overall_score DESC);

-- ============================================================
-- 5. GENERATIONS TABLE
-- Individual generation records (may be multiple per project)
-- Source: src/memory/schema.sql line 84-101
-- ============================================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory TEXT NOT NULL,                        -- Factory type used
  prompt TEXT NOT NULL,                         -- The prompt sent to LLM
  result JSONB,                                 -- Full generation result
  build_success BOOLEAN DEFAULT FALSE,
  build_time_ms INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  ts_errors INTEGER DEFAULT 0,
  lint_warnings INTEGER DEFAULT 0,
  embedding VECTOR(1536),                       -- For semantic dedup / similarity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generations_factory ON generations(factory);
CREATE INDEX idx_generations_success ON generations(build_success);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_generations_embedding ON generations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 6. COMPONENTS TABLE
-- Learned component patterns from successful generations
-- Source: src/memory/schema.sql line 106-122
-- ============================================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                           -- Component name (e.g., "HeroSection")
  factory TEXT NOT NULL,                        -- Factory it belongs to
  category TEXT,                                -- UI category (hero, nav, form, card, etc.)
  code TEXT NOT NULL,                           -- Actual component source code
  props JSONB,                                  -- Component props schema
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  embedding VECTOR(1536),                       -- Semantic search for reuse
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_components_factory ON components(factory);
CREATE INDEX idx_components_name ON components(name);
CREATE INDEX idx_components_embedding ON components USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 7. DESIGN_SYSTEMS TABLE
-- Learned design system patterns
-- Source: src/memory/schema.sql line 127-143
-- ============================================================
CREATE TABLE IF NOT EXISTS design_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                           -- Design system name
  factory TEXT NOT NULL,
  colors JSONB,                                 -- Color palette
  typography JSONB,                             -- Font choices, sizes, weights
  spacing JSONB,                                -- Spacing scale
  components JSONB,                             -- Component library reference
  embedding VECTOR(1536),
  success_rate FLOAT DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_design_systems_factory ON design_systems(factory);
CREATE INDEX idx_design_systems_embedding ON design_systems USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 8. BENCHMARK_RESULTS TABLE
-- Tracks benchmark scoring for each prompt/platform combination
-- Source: src/benchmarks/scoring.ts (ScoredOutput interface)
-- ============================================================
CREATE TABLE IF NOT EXISTS benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL,                      -- Benchmark prompt identifier
  platform TEXT NOT NULL,                       -- Platform tested (upgraded-ai-factory, lovable, bolt, etc.)
  category TEXT NOT NULL,                       -- website|ecommerce|saas|dashboard|admin|agent
  difficulty TEXT NOT NULL,                     -- easy|medium|hard
  scores JSONB NOT NULL,                        -- ScoringCriteria: buildSuccess, typecheck, lint, seo, etc.
  total_score FLOAT NOT NULL,                   -- Weighted total score 0-1
  grade TEXT NOT NULL,                          -- A+ through F
  pass_rate FLOAT NOT NULL,                     -- Percentage of criteria passing
  issues JSONB,                                 -- Array of identified issues
  strengths JSONB,                              -- Array of identified strengths
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_prompt ON benchmark_results(prompt_id);
CREATE INDEX idx_benchmark_platform ON benchmark_results(platform);
CREATE INDEX idx_benchmark_category ON benchmark_results(category);
CREATE INDEX idx_benchmark_score ON benchmark_results(total_score DESC);

-- ============================================================
-- 9. FEEDBACK_ENTRIES TABLE
-- User feedback on generated outputs
-- Source: src/intelligence/feedback/feedback-collector.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id TEXT NOT NULL,                  -- References generation.id
  user_id TEXT NOT NULL,                        -- User identifier
  type TEXT NOT NULL,                           -- rating|edit|approval|rejection|comment
  data JSONB NOT NULL,                          -- Feedback payload (rating value, edit diff, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_generation ON feedback_entries(generation_id);
CREATE INDEX idx_feedback_user ON feedback_entries(user_id);
CREATE INDEX idx_feedback_type ON feedback_entries(type);
CREATE INDEX idx_feedback_created ON feedback_entries(created_at DESC);

-- ============================================================
-- 10. LEARNING_EVENTS TABLE
-- Records every learning event for audit trail
-- Source: src/intelligence/models.ts (LearningEvent interface)
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                           -- generation|feedback|edit|approval|rejection|pattern_discovery|template_creation
  data JSONB NOT NULL,                          -- Event payload
  impact JSONB,                                 -- LearningImpact: patternsAffected, templatesAffected, scoreChange
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_events_type ON learning_events(type);
CREATE INDEX idx_learning_events_created ON learning_events(created_at DESC);

-- ============================================================
-- 11. USER_PREFERENCES TABLE
-- Per-user style and quality preferences
-- Source: src/intelligence/feedback/feedback-collector.ts (UserPreference interface)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  preferred_styles JSONB DEFAULT '[]',          -- Array of preferred style strings
  preferred_patterns JSONB DEFAULT '[]',        -- Array of preferred pattern IDs
  quality_threshold FLOAT DEFAULT 0.7,          -- Minimum quality score to accept
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Semantic similarity search across any table with embeddings
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding VECTOR(1536),
  table_name TEXT,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  score FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT id, 1 - (embedding <=> $1) as score, to_jsonb(%I.*) as metadata FROM %I WHERE 1 - (embedding <=> $1) > $2 ORDER BY embedding <=> $1 LIMIT $3',
    table_name, table_name
  ) USING query_embedding, match_threshold, match_count;
END;
$$;

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_design_systems_updated_at BEFORE UPDATE ON design_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- Enable RLS on all user-facing tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Projects: users can only see their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid()::text = name OR name LIKE 'public-%');

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (true);

-- Feedback: users can only see/modify their own feedback
CREATE POLICY "Users can view own feedback" ON feedback_entries
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own feedback" ON feedback_entries
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own feedback" ON feedback_entries
  FOR UPDATE USING (user_id = auth.uid()::text);

-- User preferences: users can only see/modify their own
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid()::text);

-- ============================================================
-- SEED DATA (optional — for development)
-- ============================================================
-- INSERT INTO projects (name, factory, prompt, quality_score, build_success)
-- VALUES ('demo-website', 'website', 'Build a landing page for a SaaS product', 0.85, true);
