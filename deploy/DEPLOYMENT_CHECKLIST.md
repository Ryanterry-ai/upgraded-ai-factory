# Deployment Checklist — Upgraded AI Factory

Complete checklist for production deployment.

---

## Pre-Deployment

- [ ] All environment variables sourced and documented
- [ ] Supabase project created and schema applied
- [ ] OpenAI API key obtained and tested
- [ ] Domain name configured (if applicable)
- [ ] SSL certificate configured (Vercel: automatic)
- [ ] Repository pushed to GitHub
- [ ] `npm run build` passes with zero errors
- [ ] TypeScript compiles clean (`tsc --noEmit`)
- [ ] No hardcoded secrets in codebase
- [ ] No `console.log` with sensitive data
- [ ] `.env.local` in `.gitignore`

---

## Database Checklist

- [ ] PostgreSQL 15+ available (Supabase or self-hosted)
- [ ] `vector` extension enabled
- [ ] `uuid-ossp` extension enabled
- [ ] `pg_trgm` extension enabled
- [ ] All 11 tables created:
  - [ ] `projects`
  - [ ] `blueprints`
  - [ ] `patterns`
  - [ ] `evaluations`
  - [ ] `generations`
  - [ ] `components`
  - [ ] `design_systems`
  - [ ] `benchmark_results`
  - [ ] `feedback_entries`
  - [ ] `learning_events`
  - [ ] `user_preferences`
- [ ] `match_embeddings` function created
- [ ] `update_updated_at` function created
- [ ] All indexes created (~20)
- [ ] RLS enabled on user-facing tables
- [ ] Backup schedule configured
- [ ] Connection tested from application

---

## Storage Checklist

- [ ] Supabase Storage buckets created (if using):
  - [ ] `generated-projects`
  - [ ] `blueprints`
  - [ ] `user-uploads`
- [ ] Bucket policies configured
- [ ] File size limits set
- [ ] CORS configured for storage

---

## Auth Checklist (Optional)

- [ ] Auth providers configured:
  - [ ] Email/Password
  - [ ] GitHub OAuth
  - [ ] Google OAuth
- [ ] Redirect URLs set
- [ ] JWT secret configured
- [ ] Session timeout configured
- [ ] Password policy configured

---

## AI Provider Checklist

- [ ] OpenAI API key obtained
- [ ] API key tested with simple request
- [ ] Rate limits understood
- [ ] Billing configured (if using paid tier)
- [ ] Fallback provider configured (optional):
  - [ ] Anthropic API key
  - [ ] OpenRouter API key
- [ ] Model preferences set:
  - [ ] `OPENAI_MODEL` (default: gpt-4o)
  - [ ] `ANTHROPIC_MODEL` (default: claude-sonnet-4-20250514)
  - [ ] `OPENROUTER_MODEL` (default: openai/gpt-4o)

---

## Build Checklist

- [ ] `npm install` — no errors
- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — no critical warnings
- [ ] Output directory `dist/` populated
- [ ] All CLI entry points compiled:
  - [ ] `dist/cli/studio.js`
  - [ ] `dist/cli/memory.js`
  - [ ] `dist/cli/runtime.js`
  - [ ] `dist/cli/agent-activate.js`
  - [ ] `dist/cli/intelligence.js`
  - [ ] `dist/cli/benchmark.js`
- [ ] `dist/index.js` (main entry) exists

---

## Security Checklist

- [ ] No secrets committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] Service role key server-side only
- [ ] RLS enabled on all user-facing tables
- [ ] Rate limiting configured
- [ ] CORS configured with specific origins (not `*`)
- [ ] No `eval()` or `new Function()` with user input
- [ ] Input validation on all user-facing endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (escaped output)
- [ ] CSRF protection (if web UI exposed)

---

## Monitoring Checklist

- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Application logging configured
- [ ] Database connection monitoring
- [ ] API rate limit monitoring
- [ ] LLM API cost tracking
- [ ] Build/deploy notifications configured

---

## Performance Checklist

- [ ] Database indexes verified
- [ ] Connection pooling configured (Supabase: built-in)
- [ ] CDN configured for static assets (Vercel: automatic)
- [ ] Gzip/Brotli compression enabled (Vercel: automatic)
- [ ] Image optimization configured (if applicable)
- [ ] API response time < 200ms (excluding LLM calls)

---

## Production Launch Checklist

- [ ] All checklist items above completed
- [ ] Staging environment tested
- [ ] Load testing performed (optional)
- [ ] Rollback plan documented
- [ ] Team notified of launch
- [ ] Documentation updated
- [ ] README updated with setup instructions
- [ ] Post-launch monitoring active
- [ ] First generation tested end-to-end
- [ ] Memory system tested (store + retrieve)
- [ ] Agent activation tested with real LLM call
