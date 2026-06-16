# Supabase Setup Guide — Upgraded AI Factory

Step-by-step guide to configure Supabase for production deployment.

---

## Prerequisites

1. A Supabase project (https://supabase.com — free tier works for development)
2. PostgreSQL client (psql) or Supabase SQL Editor access
3. Environment variables ready (see `VERCEL_ENV_EXAMPLE.env`)

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Set:
   - **Organization**: Your org
   - **Project name**: `upgraded-ai-factory`
   - **Database password**: Generate a strong password (save it)
   - **Region**: Closest to your users
4. Wait for project to initialize (~2 minutes)
5. Note your:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

---

## Step 2: Enable Required Extensions

Go to **Database → Extensions** and enable:

| Extension | Purpose |
|-----------|---------|
| `vector` | pgvector for semantic search (1536-dim embeddings) |
| `uuid-ossp` | UUID generation |
| `pg_trgm` | Trigram text similarity |

Run in SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Step 3: Run Database Schema

1. Go to **SQL Editor**
2. Copy the entire contents of `deploy/DATABASE_SCHEMA.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Verify: Go to **Database → Tables** and confirm 11 tables exist:
   - `projects`
   - `blueprints`
   - `patterns`
   - `evaluations`
   - `generations`
   - `components`
   - `design_systems`
   - `benchmark_results`
   - `feedback_entries`
   - `learning_events`
   - `user_preferences`

---

## Step 4: Verify Extensions

Run in SQL Editor:

```sql
SELECT * FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp', 'pg_trgm');
```

Should return 3 rows.

---

## Step 5: Verify Functions

Run in SQL Editor:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('match_embeddings', 'update_updated_at');
```

Should return 2 rows.

---

## Step 6: Verify Indexes

Run in SQL Editor:

```sql
SELECT indexname, tablename FROM pg_indexes
WHERE tablename IN ('projects', 'blueprints', 'patterns', 'generations', 'components', 'design_systems')
ORDER BY tablename, indexname;
```

Should return ~20 indexes.

---

## Step 7: Configure RLS Policies

RLS is enabled via the schema SQL. Verify:

```sql
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';
```

Should show policies on `projects`, `feedback_entries`, `user_preferences`.

### Adjust RLS for Your Auth Setup

The default policies use `auth.uid()::text`. If you use a different auth provider:

```sql
-- Example: Custom auth with user_id column
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id = auth.uid()::text);
```

---

## Step 8: Create Storage Buckets (Optional)

If you want to store generated project files in Supabase Storage:

1. Go to **Storage**
2. Create buckets:

| Bucket Name | Purpose | Public |
|-------------|---------|--------|
| `generated-projects` | Stored project artifacts | No |
| `blueprints` | Blueprint JSON/YAML files | No |
| `user-uploads` | User-provided reference files | No |

3. Set bucket policies:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Step 9: Set Up Authentication (Optional)

If you want user authentication:

1. Go to **Authentication → Providers**
2. Enable desired providers:
   - **Email/Password** (default — enabled)
   - **GitHub** (recommended for developer tool)
   - **Google** (for broader access)
3. Configure redirect URLs:
   - Production: `https://your-domain.com/auth/callback`
   - Development: `http://localhost:3000/auth/callback`

---

## Step 10: Configure Environment Variables

Set these in your deployment platform (Vercel, etc.):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Step 11: Verify Connection

Test with a simple query:

```bash
# Using curl
curl "https://your-project.supabase.co/rest/v1/projects?select=id,name,factory&limit=5" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

Or use the SQL Editor to run:

```sql
SELECT count(*) FROM projects;
```

---

## Step 12: Set Up Backups

1. Go to **Database → Backups**
2. Enable **Point-in-time Recovery** (Pro plan) or **Daily Backups** (free plan)
3. Verify backup schedule

---

## Verification Checklist

- [ ] 11 tables created
- [ ] 3 extensions enabled (vector, uuid-ossp, pg_trgm)
- [ ] 2 functions created (match_embeddings, update_updated_at)
- [ ] ~20 indexes created
- [ ] RLS enabled on user-facing tables
- [ ] Storage buckets created (if using storage)
- [ ] Auth providers configured (if using auth)
- [ ] Environment variables set in deployment platform
- [ ] Connection tested from application

---

## Troubleshooting

### "relation does not exist" error
→ Run the full schema SQL again. Tables may not have been created.

### "function match_embeddings does not exist" error
→ Ensure `vector` extension is enabled before running schema.

### "permission denied for table" error
→ Check RLS policies. Ensure the service role key is used for server-side operations.

### Embedding search returns no results
→ Ensure you have data in the table AND embeddings are generated (1536-dim vectors).

### pgvector "<=>" operator not found
→ Ensure `vector` extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
