CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS learning_events CASCADE;
DROP TABLE IF EXISTS feedback_entries CASCADE;
DROP TABLE IF EXISTS benchmark_results CASCADE;
DROP TABLE IF EXISTS design_systems CASCADE;
DROP TABLE IF EXISTS components CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS patterns CASCADE;
DROP TABLE IF EXISTS blueprints CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
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

CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  yaml TEXT,
  json JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_blueprints_project ON blueprints(project_id);

CREATE TABLE patterns (
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

CREATE TABLE evaluations (
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

CREATE TABLE generations (
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

CREATE TABLE components (
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

CREATE TABLE design_systems (
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

CREATE TABLE benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  scores JSONB NOT NULL,
  total_score FLOAT NOT NULL,
  grade TEXT NOT NULL,
  pass_rate FLOAT NOT NULL,
  issues JSONB,
  strengths JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_benchmark_platform ON benchmark_results(platform);

CREATE TABLE feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feedback_user ON feedback_entries(user_id);

CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  impact JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  preferred_styles JSONB DEFAULT '[]',
  preferred_patterns JSONB DEFAULT '[]',
  quality_threshold FLOAT DEFAULT 0.7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public feedback" ON feedback_entries FOR SELECT USING (true);
CREATE POLICY "Insert feedback" ON feedback_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public preferences" ON user_preferences FOR SELECT USING (true);
CREATE POLICY "Insert preferences" ON user_preferences FOR INSERT WITH CHECK (true);
