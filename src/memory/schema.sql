-- Phase 6: Memory & Learning Layer
-- Supabase/PostgreSQL Schema with pgvector

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  factory TEXT NOT NULL,
  prompt TEXT NOT NULL,
  blueprint_id UUID,
  quality_score FLOAT DEFAULT 0,
  build_success BOOLEAN DEFAULT FALSE,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_factory ON projects(factory);
CREATE INDEX idx_projects_quality ON projects(quality_score DESC);
CREATE INDEX idx_projects_created ON projects(created_at DESC);

-- ============================================================
-- 2. BLUEPRINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  yaml TEXT,
  json JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blueprints_project ON blueprints(project_id);
CREATE INDEX idx_blueprints_embedding ON blueprints USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 3. PATTERNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  success_rate FLOAT DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_success ON patterns(success_rate DESC);
CREATE INDEX idx_patterns_embedding ON patterns USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 4. EVALUATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  seo_score FLOAT DEFAULT 0,
  ux_score FLOAT DEFAULT 0,
  perf_score FLOAT DEFAULT 0,
  security_score FLOAT DEFAULT 0,
  accessibility_score FLOAT DEFAULT 0,
  code_quality_score FLOAT DEFAULT 0,
  overall_score FLOAT DEFAULT 0,
  findings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_project ON evaluations(project_id);
CREATE INDEX idx_evaluations_overall ON evaluations(overall_score DESC);

-- ============================================================
-- 5. GENERATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result JSONB,
  build_success BOOLEAN DEFAULT FALSE,
  build_time_ms INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  ts_errors INTEGER DEFAULT 0,
  lint_warnings INTEGER DEFAULT 0,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generations_factory ON generations(factory);
CREATE INDEX idx_generations_success ON generations(build_success);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_generations_embedding ON generations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 6. COMPONENTS TABLE (learned component patterns)
-- ============================================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  factory TEXT NOT NULL,
  category TEXT,
  code TEXT NOT NULL,
  props JSONB,
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_components_factory ON components(factory);
CREATE INDEX idx_components_name ON components(name);
CREATE INDEX idx_components_embedding ON components USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 7. DESIGN_SYSTEMS TABLE (learned design patterns)
-- ============================================================
CREATE TABLE IF NOT EXISTS design_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  factory TEXT NOT NULL,
  colors JSONB,
  typography JSONB,
  spacing JSONB,
  components JSONB,
  embedding VECTOR(1536),
  success_rate FLOAT DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_design_systems_factory ON design_systems(factory);
CREATE INDEX idx_design_systems_embedding ON design_systems USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to match similar embeddings
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_design_systems_updated_at BEFORE UPDATE ON design_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at();
