-- Phase 11: pgvector semantic retrieval
-- Run this in Supabase SQL Editor to enable vector similarity search

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to projects table (1536 dimensions for text-embedding-3-small)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to generations table
ALTER TABLE generations ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search on projects
CREATE INDEX IF NOT EXISTS idx_projects_embedding
  ON projects USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- Create index for fast similarity search on generations
CREATE INDEX IF NOT EXISTS idx_generations_embedding
  ON generations USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- Create function for semantic search on projects
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

-- Create function for semantic search on generations
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
