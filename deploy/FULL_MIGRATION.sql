-- COMPLETE SUPABASE MIGRATION
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ctrcrcgfkwexkjwbwwvh/sql/new
-- This fixes schema mismatches, adds RLS, enables pgvector, and creates search functions.

-- ============================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 2. FIX feedback_entries TABLE
--    Production code expects: project_id, rating, comment, category
--    Original schema had: generation_id, user_id, type, data (WRONG)
-- ============================================================
DROP TABLE IF EXISTS feedback_entries CASCADE;

CREATE TABLE feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'quality', 'design', 'content', 'performance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feedback_project ON feedback_entries(project_id);
CREATE INDEX idx_feedback_category ON feedback_entries(category);

-- ============================================================
-- 3. ADD MISSING COLUMNS TO projects TABLE
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ============================================================
-- 4. ADD MISSING COLUMNS TO generations TABLE
-- ============================================================
ALTER TABLE generations ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ============================================================
-- 5. CREATE INDEXES FOR VECTOR SEARCH
-- ============================================================
-- Drop existing indexes if they exist (to recreate with correct params)
DROP INDEX IF EXISTS idx_projects_embedding;
DROP INDEX IF EXISTS idx_generations_embedding;

-- Only create ivfflat indexes if we have enough rows (need at least lists*2)
-- Using a simpler approach: create indexes that work with any row count
CREATE INDEX idx_projects_embedding ON projects USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX idx_generations_embedding ON generations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- 6. RLS POLICIES — FULL ACCESS FOR ALL TABLES
--    Since API routes use service role key, RLS is bypassed.
--    But we enable RLS and add permissive policies for safety.
-- ============================================================

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public projects" ON projects;
DROP POLICY IF EXISTS "Insert projects" ON projects;
DROP POLICY IF EXISTS "Update projects" ON projects;
DROP POLICY IF EXISTS "Delete projects" ON projects;
CREATE POLICY "Public projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Delete projects" ON projects FOR DELETE USING (true);

-- Blueprints
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public blueprints" ON blueprints;
DROP POLICY IF EXISTS "Insert blueprints" ON blueprints;
DROP POLICY IF EXISTS "Delete blueprints" ON blueprints;
CREATE POLICY "Public blueprints" ON blueprints FOR SELECT USING (true);
CREATE POLICY "Insert blueprints" ON blueprints FOR INSERT WITH CHECK (true);
CREATE POLICY "Delete blueprints" ON blueprints FOR DELETE USING (true);

-- Generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public generations" ON generations;
DROP POLICY IF EXISTS "Insert generations" ON generations;
CREATE POLICY "Public generations" ON generations FOR SELECT USING (true);
CREATE POLICY "Insert generations" ON generations FOR INSERT WITH CHECK (true);

-- Evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public evaluations" ON evaluations;
DROP POLICY IF EXISTS "Insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Delete evaluations" ON evaluations;
CREATE POLICY "Public evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Insert evaluations" ON evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Delete evaluations" ON evaluations FOR DELETE USING (true);

-- Patterns
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public patterns" ON patterns;
DROP POLICY IF EXISTS "Insert patterns" ON patterns;
CREATE POLICY "Public patterns" ON patterns FOR SELECT USING (true);
CREATE POLICY "Insert patterns" ON patterns FOR INSERT WITH CHECK (true);

-- Feedback
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public feedback" ON feedback_entries;
DROP POLICY IF EXISTS "Insert feedback" ON feedback_entries;
DROP POLICY IF EXISTS "Delete feedback" ON feedback_entries;
CREATE POLICY "Public feedback" ON feedback_entries FOR SELECT USING (true);
CREATE POLICY "Insert feedback" ON feedback_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Delete feedback" ON feedback_entries FOR DELETE USING (true);

-- Benchmark Results
ALTER TABLE benchmark_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public benchmarks" ON benchmark_results;
DROP POLICY IF EXISTS "Insert benchmarks" ON benchmark_results;
CREATE POLICY "Public benchmarks" ON benchmark_results FOR SELECT USING (true);
CREATE POLICY "Insert benchmarks" ON benchmark_results FOR INSERT WITH CHECK (true);

-- Components
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public components" ON components;
DROP POLICY IF EXISTS "Insert components" ON components;
CREATE POLICY "Public components" ON components FOR SELECT USING (true);
CREATE POLICY "Insert components" ON components FOR INSERT WITH CHECK (true);

-- Design Systems
ALTER TABLE design_systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public design_systems" ON design_systems;
DROP POLICY IF EXISTS "Insert design_systems" ON design_systems;
CREATE POLICY "Public design_systems" ON design_systems FOR SELECT USING (true);
CREATE POLICY "Insert design_systems" ON design_systems FOR INSERT WITH CHECK (true);

-- ============================================================
-- 7. SEMANTIC SEARCH RPC FUNCTIONS
-- ============================================================

-- Search projects by embedding similarity
CREATE OR REPLACE FUNCTION search_projects(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  name text,
  factory text,
  prompt text,
  quality_score float,
  build_success boolean,
  file_count int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.factory,
    p.prompt,
    p.quality_score,
    p.build_success,
    p.file_count,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM projects p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search generations by embedding similarity
CREATE OR REPLACE FUNCTION search_generations(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  factory text,
  prompt text,
  build_success boolean,
  file_count int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.factory,
    g.prompt,
    g.build_success,
    g.file_count,
    1 - (g.embedding <=> query_embedding) AS similarity
  FROM generations g
  WHERE g.embedding IS NOT NULL
    AND 1 - (g.embedding <=> query_embedding) > match_threshold
  ORDER BY g.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
