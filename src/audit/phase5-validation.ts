import { createEngine } from '../core/factory-setup.js';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_DIR = 'C:\\Users\\viren\\AppData\\Local\\Temp\\phase5-fast';

const SAMPLES: Array<{ factory: string; idx: number; prompt: string }> = [
  { factory: 'website', idx: 0, prompt: 'Landing page for a mobile app with hero, features, and download button' },
  { factory: 'website', idx: 5, prompt: 'Corporate website with about, services, team, and contact pages' },
  { factory: 'ecommerce', idx: 0, prompt: 'Online store for handmade candles with product grid and cart' },
  { factory: 'ecommerce', idx: 5, prompt: 'Coffee subscription store with plans, past boxes, and checkout' },
  { factory: 'saas', idx: 0, prompt: 'Project management tool with login, dashboard, and settings' },
  { factory: 'saas', idx: 5, prompt: 'Appointment scheduling tool with calendar, bookings, and reminders' },
  { factory: 'admin', idx: 0, prompt: 'Admin panel with user table, search, and CRUD operations' },
  { factory: 'admin', idx: 5, prompt: 'Customer admin with profiles, orders, and support history' },
  { factory: 'dashboard', idx: 0, prompt: 'Sales dashboard with revenue chart, top products, and recent orders' },
  { factory: 'dashboard', idx: 5, prompt: 'Customer support dashboard with tickets, response time, and satisfaction' },
  { factory: 'agent', idx: 0, prompt: 'Customer support chatbot with FAQ responses and ticket creation' },
  { factory: 'agent', idx: 5, prompt: 'Fitness coach bot with workout plans, tracking, and motivation' },
  { factory: 'tools', idx: 0, prompt: 'Internal user management tool with CRUD and role assignment' },
  { factory: 'tools', idx: 5, prompt: 'Password generator with strength meter and save feature' },
];

interface Result {
  factory: string;
  idx: number;
  prompt: string;
  projectName: string;
  fileCount: number;
  built: boolean;
  buildTimeMs: number;
  errors: string[];
}

function runCmd(cmd: string, cwd: string, timeout = 120000): { ok: boolean; output: string } {
  try {
    const out = execSync(cmd, { cwd, timeout, encoding: 'utf-8', stdio: 'pipe' });
    return { ok: true, output: out };
  } catch (e: any) {
    return { ok: false, output: e.stdout || e.message || '' };
  }
}

async function main() {
  console.log('Phase 5 Validation - Final Run\n');
  const engine = createEngine();
  const results: Result[] = [];

  for (const sample of SAMPLES) {
    const testDir = join(BASE_DIR, sample.factory, `test-${sample.idx + 1}`);
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });

    const r: Result = {
      factory: sample.factory,
      idx: sample.idx,
      prompt: sample.prompt,
      projectName: '',
      fileCount: 0,
      built: false,
      buildTimeMs: 0,
      errors: [],
    };

    // Generate
    process.stdout.write(`${sample.factory}[${sample.idx}] generate... `);
    try {
      const gen = await engine.generate({ prompt: sample.prompt, outputDir: testDir, factory: sample.factory, dryRun: false });
      if (!gen.success || gen.results.length === 0) { console.log('FAIL'); r.errors.push('gen failed'); results.push(r); continue; }
      r.projectName = gen.results[0].blueprint.project.name;
      const outDir = join(testDir, r.projectName);
      if (existsSync(outDir)) {
        r.fileCount = readdirSync(outDir, { recursive: true }).filter(f => typeof f === 'string').length;
      }
      console.log('ok');
    } catch (e: any) { console.log('FAIL'); r.errors.push(e.message); results.push(r); continue; }

    // Install
    const outDir = join(testDir, r.projectName);
    process.stdout.write(`  install... `);
    const inst = runCmd('npm install --legacy-peer-deps 2>&1', outDir, 120000);
    if (!inst.ok) { console.log('FAIL'); r.errors.push('install failed'); results.push(r); continue; }
    console.log('ok');

    // Build
    process.stdout.write(`  build... `);
    const t0 = Date.now();
    const build = runCmd('npm run build 2>&1', outDir, 120000);
    r.buildTimeMs = Date.now() - t0;
    if (build.ok) {
      r.built = true;
      console.log(`ok (${r.buildTimeMs}ms)`);
    } else {
      const out = build.output;
      if (out.includes('Module not found')) {
        const mods = out.match(/Can't resolve '([^']+)'/g) || [];
        r.errors.push(`Missing: ${mods.join(', ')}`);
      } else if (out.includes('Type error')) {
        const errs = out.match(/Type error: .+/g) || [];
        r.errors.push(`Type: ${errs.slice(0, 2).join('; ')}`);
      } else {
        r.errors.push(out.substring(0, 200));
      }
      console.log('FAIL');
    }
    results.push(r);
  }

  // Report
  const built = results.filter(r => r.built).length;
  const total = results.length;
  const sorted = [...results].sort((a, b) => (b.built ? 1 : 0) - (a.built ? 1 : 0) || a.factory.localeCompare(b.factory));

  let md = `# Phase 5 Validation Report

**Date:** ${new Date().toLocaleDateString()}
**Version:** v0.2.0
**Methodology:** Generate + install + build per factory (2 samples each, 14 total)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Factories Tested | 7 |
| Samples per Factory | 2 |
| Total Projects Built | ${built}/${total} (${Math.round(built/total*100)}%) |

---

## Results

| Factory | Sample | Built | Build Time | Files | Errors |
|---------|--------|-------|------------|-------|--------|
`;

  for (const r of sorted) {
    md += `| ${r.factory} | #${r.idx + 1} | ${r.built ? '✅' : '❌'} | ${r.buildTimeMs}ms | ${r.fileCount} | ${r.errors.length > 0 ? r.errors[0].substring(0, 50) : 'None'} |\n`;
  }

  md += `\n---

## Build Success by Factory

`;
  const byFactory: Record<string, { total: number; built: number }> = {};
  for (const r of results) {
    if (!byFactory[r.factory]) byFactory[r.factory] = { total: 0, built: 0 };
    byFactory[r.factory].total++;
    if (r.built) byFactory[r.factory].built++;
  }
  for (const [f, s] of Object.entries(byFactory).sort((a, b) => b[1].built - a[1].built)) {
    md += `- **${f}**: ${s.built}/${s.total} built ${s.built === s.total ? '✅' : '⚠️'}\n`;
  }

  md += `\n---

## Common Error Patterns

`;
  const allErrors = results.flatMap(r => r.errors);
  if (allErrors.length === 0) {
    md += 'No errors encountered.\n';
  } else {
    const patterns: Record<string, number> = {};
    for (const e of allErrors) {
      if (e.includes('Missing')) patterns['Missing modules'] = (patterns['Missing modules'] || 0) + 1;
      else if (e.includes('Type')) patterns['Type errors'] = (patterns['Type errors'] || 0) + 1;
      else if (e.includes('install')) patterns['Install failures'] = (patterns['Install failures'] || 0) + 1;
      else patterns['Other'] = (patterns['Other'] || 0) + 1;
    }
    for (const [p, c] of Object.entries(patterns).sort((a, b) => b[1] - a[1])) {
      md += `- **${p}**: ${c}\n`;
    }
  }

  md += `\n---

## Next Steps

1. **Phase 6** — Memory & Learning Layer (Supabase, pgvector, RAG)
2. **Phase 7** — Real Multi-Agent Runtime (LangGraph)
3. **Phase 8** — Self-Improving Factory

---

*Generated by phase5-validation.ts*
`;

  writeFileSync('C:\\Users\\viren\\OneDrive\\Desktop\\corechamps-v1\\upgraded-ai-factory\\docs\\phase5-validation-report.md', md);
  console.log(`\n\n📊 Done: ${built}/${total} built. Report saved.`);
}

main().catch(console.error);
