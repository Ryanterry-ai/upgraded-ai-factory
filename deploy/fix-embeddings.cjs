const { Client } = require("pg");
async function fix() {
  const client = new Client({
    connectionString: "postgresql://postgres:Upgradedhealth@1401@db.ctrcrcgfkwexkjwbwwvh.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  await client.query("DROP INDEX IF EXISTS idx_projects_embedding");
  await client.query("DROP INDEX IF EXISTS idx_generations_embedding");

  await client.query("ALTER TABLE projects ALTER COLUMN embedding TYPE vector(128)");
  await client.query("ALTER TABLE generations ALTER COLUMN embedding TYPE vector(128)");
  await client.query("ALTER TABLE blueprints ALTER COLUMN embedding TYPE vector(128)");
  await client.query("ALTER TABLE patterns ALTER COLUMN embedding TYPE vector(128)");
  await client.query("ALTER TABLE components ALTER COLUMN embedding TYPE vector(128)");
  await client.query("ALTER TABLE design_systems ALTER COLUMN embedding TYPE vector(128)");

  await client.query("CREATE INDEX idx_projects_embedding ON projects USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)");
  await client.query("CREATE INDEX idx_generations_embedding ON generations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)");

  await client.query("DROP FUNCTION IF EXISTS search_projects(vector(1536), int, float)");
  await client.query("DROP FUNCTION IF EXISTS search_generations(vector(1536), int, float)");
  await client.query("DROP FUNCTION IF EXISTS search_projects(vector(128), int, float)");
  await client.query("DROP FUNCTION IF EXISTS search_generations(vector(128), int, float)");

  await client.query(`
    CREATE OR REPLACE FUNCTION search_projects(
      query_embedding vector(128),
      match_count int DEFAULT 5,
      match_threshold float DEFAULT 0.3
    )
    RETURNS TABLE (id uuid, name text, factory text, prompt text, quality_score float, build_success boolean, file_count int, similarity float)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT p.id, p.name, p.factory, p.prompt, p.quality_score, p.build_success, p.file_count,
        1 - (p.embedding <=> query_embedding) AS similarity
      FROM projects p
      WHERE p.embedding IS NOT NULL AND 1 - (p.embedding <=> query_embedding) > match_threshold
      ORDER BY p.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `);

  await client.query(`
    CREATE OR REPLACE FUNCTION search_generations(
      query_embedding vector(128),
      match_count int DEFAULT 5,
      match_threshold float DEFAULT 0.3
    )
    RETURNS TABLE (id uuid, factory text, prompt text, build_success boolean, file_count int, similarity float)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT g.id, g.factory, g.prompt, g.build_success, g.file_count,
        1 - (g.embedding <=> query_embedding) AS similarity
      FROM generations g
      WHERE g.embedding IS NOT NULL AND 1 - (g.embedding <=> query_embedding) > match_threshold
      ORDER BY g.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `);

  console.log("Fixed: all embedding columns now vector(128), RPC functions recreated");
  await client.end();
}
fix().catch(e => console.error(e.message));
