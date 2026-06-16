import { createEngine } from '../core/factory-setup.js';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getAllFiles, type ValidationFinding, type ValidationReport } from './validators.js';
import { validateArtifactCompleteness } from './artifact-validator.js';
import { validateImports } from './import-validator.js';
import { validateComponents } from './component-validator.js';
import { validateTypes } from './type-validator.js';
import { validateClientComponents } from './client-validator.js';
import { validateBuild } from './build-validator.js';
import { autoRepair, type RepairAction } from './auto-repair-agent.js';

interface BenchmarkProject {
  id: string;
  factory: string;
  prompt: string;
  generated: boolean;
  projectName: string;
  fileCount: number;
  preRepairFindings: ValidationFinding[];
  postRepairFindings: ValidationFinding[];
  repairActions: RepairAction[];
  installed: boolean;
  built: boolean;
  typeChecked: boolean;
  linted: boolean;
  buildTimeMs: number;
  buildErrors: string[];
  score: number;
  passed: boolean;
}

const PROMPTS: Array<{ factory: string; id: string; prompt: string }> = [
  { factory: 'website', id: 'w01', prompt: 'Landing page for a mobile app with hero, features, and download button' },
  { factory: 'website', id: 'w02', prompt: 'Portfolio website for a photographer with gallery and contact form' },
  { factory: 'website', id: 'w03', prompt: 'Blog homepage with article cards, sidebar, and newsletter signup' },
  { factory: 'website', id: 'w04', prompt: 'Restaurant website with menu, reservations, and location map' },
  { factory: 'website', id: 'w05', prompt: 'SaaS landing page with pricing table, testimonials, and FAQ' },
  { factory: 'website', id: 'w06', prompt: 'Corporate website with about, services, team, and contact pages' },
  { factory: 'website', id: 'w07', prompt: 'Event conference website with speakers, schedule, and registration' },
  { factory: 'website', id: 'w08', prompt: 'Fitness studio website with class schedule, trainers, and membership' },
  { factory: 'website', id: 'w09', prompt: 'Agency website with portfolio showcase and case studies' },
  { factory: 'website', id: 'w10', prompt: 'Personal blog with dark mode, reading time, and tags' },
  { factory: 'website', id: 'w11', prompt: 'Real estate website with property listings, search, and agent profiles' },
  { factory: 'website', id: 'w12', prompt: 'Nonprofit website with donation, volunteer signup, and impact stats' },
  { factory: 'website', id: 'w13', prompt: 'Education platform with courses, instructors, and enrollment' },
  { factory: 'website', id: 'w14', prompt: 'Music artist website with tracks, tour dates, and merch store' },
  { factory: 'website', id: 'w15', prompt: 'Healthcare clinic website with services, doctors, and appointment booking' },
  { factory: 'website', id: 'w16', prompt: 'Travel agency website with destinations, packages, and booking form' },
  { factory: 'website', id: 'w17', prompt: 'Dental clinic website with services, team, and online booking' },
  { factory: 'website', id: 'w18', prompt: 'Photography studio website with portfolio, pricing, and contact' },
  { factory: 'website', id: 'w19', prompt: 'Coaching business website with programs, testimonials, and booking' },
  { factory: 'website', id: 'w20', prompt: 'Architecture firm website with projects, team, and inquiry form' },
  { factory: 'ecommerce', id: 'e01', prompt: 'Online store for handmade candles with product grid and cart' },
  { factory: 'ecommerce', id: 'e02', prompt: 'Sneaker store with product categories, filters, and wishlist' },
  { factory: 'ecommerce', id: 'e03', prompt: 'Organic food store with product listings, cart, and checkout' },
  { factory: 'ecommerce', id: 'e04', prompt: 'Jewelry store with product detail pages, size guide, and checkout' },
  { factory: 'ecommerce', id: 'e05', prompt: 'Bookstore with categories, search, and shopping cart' },
  { factory: 'ecommerce', id: 'e06', prompt: 'Coffee subscription store with plans, past boxes, and checkout' },
  { factory: 'ecommerce', id: 'e07', prompt: 'Plant nursery store with care guides, product grid, and cart' },
  { factory: 'ecommerce', id: 'e08', prompt: 'Art prints store with gallery view, framing options, and checkout' },
  { factory: 'ecommerce', id: 'e09', prompt: 'Pet supplies store with categories, reviews, and cart' },
  { factory: 'ecommerce', id: 'e10', prompt: 'Skincare store with routines builder, product cards, and cart' },
  { factory: 'ecommerce', id: 'e11', prompt: 'Electronics store with product comparison, specs, and cart' },
  { factory: 'ecommerce', id: 'e12', prompt: 'Fashion boutique with lookbook, size guide, and shopping cart' },
  { factory: 'ecommerce', id: 'e13', prompt: 'Home decor store with room collections, product grid, and cart' },
  { factory: 'ecommerce', id: 'e14', prompt: 'Gourmet food marketplace with vendor profiles, cart, and checkout' },
  { factory: 'ecommerce', id: 'e15', prompt: 'Outdoor gear store with category filters, wishlist, and cart' },
  { factory: 'ecommerce', id: 'e16', prompt: 'Toy store with age filters, gift registry, and shopping cart' },
  { factory: 'ecommerce', id: 'e17', prompt: 'Wine shop with tasting notes, collections, and cart' },
  { factory: 'ecommerce', id: 'e18', prompt: 'Stationery store with categories, gift wrapping, and cart' },
  { factory: 'ecommerce', id: 'e19', prompt: 'Sports equipment store with size guide, reviews, and cart' },
  { factory: 'ecommerce', id: 'e20', prompt: 'Vintage clothing store with condition ratings, cart, and checkout' },
  { factory: 'saas', id: 's01', prompt: 'Project management tool with login, dashboard, and settings' },
  { factory: 'saas', id: 's02', prompt: 'CRM platform with contacts, deals, pipeline, and analytics' },
  { factory: 'saas', id: 's03', prompt: 'Email marketing tool with campaigns, templates, and subscribers' },
  { factory: 'saas', id: 's04', prompt: 'Invoicing app with invoice creation, client management, and reports' },
  { factory: 'saas', id: 's05', prompt: 'Appointment scheduling tool with calendar, bookings, and reminders' },
  { factory: 'saas', id: 's06', prompt: 'Survey builder with form editor, responses, and analytics' },
  { factory: 'saas', id: 's07', prompt: 'Habit tracker with streaks, stats, and daily check-ins' },
  { factory: 'saas', id: 's08', prompt: 'Bookmark manager with tags, search, and collections' },
  { factory: 'saas', id: 's09', prompt: 'Kanban board with drag-drop, cards, and team collaboration' },
  { factory: 'saas', id: 's10', prompt: 'Time tracking tool with timers, projects, and reports' },
  { factory: 'saas', id: 's11', prompt: 'Note taking app with notebooks, tags, and full-text search' },
  { factory: 'saas', id: 's12', prompt: 'Team chat app with channels, direct messages, and file sharing' },
  { factory: 'saas', id: 's13', prompt: 'Document editor with real-time collaboration and version history' },
  { factory: 'saas', id: 's14', prompt: 'Bug tracker with issues, milestones, and team assignments' },
  { factory: 'saas', id: 's15', prompt: 'Social media scheduler with calendar, analytics, and post editor' },
  { factory: 'saas', id: 's16', prompt: 'Customer feedback portal with feature requests and voting' },
  { factory: 'saas', id: 's17', prompt: 'Team workspace with documents, wikis, and task boards' },
  { factory: 'saas', id: 's18', prompt: 'Onboarding platform with checklists, progress, and team management' },
  { factory: 'saas', id: 's19', prompt: 'Subscription billing dashboard with plans, invoices, and usage' },
  { factory: 'saas', id: 's20', prompt: 'Video conferencing app with rooms, chat, and screen sharing' },
  { factory: 'admin', id: 'a01', prompt: 'Admin panel with user table, search, and CRUD operations' },
  { factory: 'admin', id: 'a02', prompt: 'Content management admin with posts, categories, and media library' },
  { factory: 'admin', id: 'a03', prompt: 'Blog admin with posts editor, comments, and categories' },
  { factory: 'admin', id: 'a04', prompt: 'Settings admin with general, billing, and notification settings' },
  { factory: 'admin', id: 'a05', prompt: 'Customer admin with profiles, orders, and support history' },
  { factory: 'admin', id: 'a06', prompt: 'Order management admin with orders, shipping, and returns' },
  { factory: 'admin', id: 'a07', prompt: 'Pricing admin with plans, discounts, and coupon management' },
  { factory: 'admin', id: 'a08', prompt: 'Employee directory admin with profiles, departments, and org chart' },
  { factory: 'admin', id: 'a09', prompt: 'Inventory management admin with stock levels, alerts, and reports' },
  { factory: 'admin', id: 'a10', prompt: 'Email template admin with template editor and preview' },
  { factory: 'admin', id: 'a11', prompt: 'Role-based admin with permissions, users, and audit log' },
  { factory: 'admin', id: 'a12', prompt: 'Support ticket admin with tickets, priorities, and agent assignment' },
  { factory: 'admin', id: 'a13', prompt: 'Analytics admin with reports, charts, and data export' },
  { factory: 'admin', id: 'a14', prompt: 'Product admin with variants, pricing, and inventory tracking' },
  { factory: 'admin', id: 'a15', prompt: 'Payment admin with transactions, refunds, and payout reports' },
  { factory: 'admin', id: 'a16', prompt: 'School admin with students, classes, and grade management' },
  { factory: 'admin', id: 'a17', prompt: 'Restaurant admin with menu, orders, and reservation management' },
  { factory: 'admin', id: 'a18', prompt: 'Gym admin with members, classes, and equipment tracking' },
  { factory: 'admin', id: 'a19', prompt: 'Clinic admin with patients, appointments, and medical records' },
  { factory: 'admin', id: 'a20', prompt: 'Event admin with attendees, speakers, and venue management' },
  { factory: 'dashboard', id: 'd01', prompt: 'Sales dashboard with revenue chart, top products, and recent orders' },
  { factory: 'dashboard', id: 'd02', prompt: 'Marketing dashboard with campaign metrics, traffic sources, and ROI' },
  { factory: 'dashboard', id: 'd03', prompt: 'Ecommerce dashboard with orders, conversion rate, and inventory' },
  { factory: 'dashboard', id: 'd04', prompt: 'HR dashboard with headcount, turnover, and hiring pipeline' },
  { factory: 'dashboard', id: 'd05', prompt: 'Project dashboard with tasks, timelines, and team workload' },
  { factory: 'dashboard', id: 'd06', prompt: 'Customer support dashboard with tickets, response time, and satisfaction' },
  { factory: 'dashboard', id: 'd07', prompt: 'Social media dashboard with followers, engagement, and top posts' },
  { factory: 'dashboard', id: 'd08', prompt: 'Website analytics dashboard with visitors, pageviews, and bounce rate' },
  { factory: 'dashboard', id: 'd09', prompt: 'Inventory dashboard with stock levels, alerts, and turnover' },
  { factory: 'dashboard', id: 'd10', prompt: 'Executive dashboard with KPIs, trends, and department metrics' },
  { factory: 'dashboard', id: 'd11', prompt: 'Finance dashboard with profit loss, cash flow, and budget tracking' },
  { factory: 'dashboard', id: 'd12', prompt: 'Healthcare dashboard with patient stats, appointments, and wait times' },
  { factory: 'dashboard', id: 'd13', prompt: 'Fitness dashboard with workout stats, goals, and progress charts' },
  { factory: 'dashboard', id: 'd14', prompt: 'Real estate dashboard with listings, inquiries, and market trends' },
  { factory: 'dashboard', id: 'd15', prompt: 'SaaS metrics dashboard with MRR, churn, and customer lifetime value' },
  { factory: 'dashboard', id: 'd16', prompt: 'School dashboard with enrollment, grades, and attendance tracking' },
  { factory: 'dashboard', id: 'd17', prompt: 'Restaurant dashboard with reservations, orders, and revenue' },
  { factory: 'dashboard', id: 'd18', prompt: 'Gym dashboard with member stats, class attendance, and revenue' },
  { factory: 'dashboard', id: 'd19', prompt: 'Fleet dashboard with vehicles, routes, and delivery tracking' },
  { factory: 'dashboard', id: 'd20', prompt: 'IoT dashboard with device status, alerts, and sensor data' },
  { factory: 'agent', id: 'g01', prompt: 'Customer support chatbot with FAQ responses and ticket creation' },
  { factory: 'agent', id: 'g02', prompt: 'Personal AI assistant with chat, reminders, and task management' },
  { factory: 'agent', id: 'g03', prompt: 'Language learning bot with exercises, vocabulary, and progress tracking' },
  { factory: 'agent', id: 'g04', prompt: 'Recipe recommendation bot with dietary preferences and meal planning' },
  { factory: 'agent', id: 'g05', prompt: 'Fitness coach bot with workout plans, tracking, and motivation' },
  { factory: 'agent', id: 'g06', prompt: 'Financial advisor bot with budget tips, alerts, and insights' },
  { factory: 'agent', id: 'g07', prompt: 'Study companion bot with quizzes, notes, and flashcards' },
  { factory: 'agent', id: 'g08', prompt: 'Book recommendation bot with reading lists and reviews' },
  { factory: 'agent', id: 'g09', prompt: 'Pet care bot with feeding schedules, health tips, and vet finder' },
  { factory: 'agent', id: 'g10', prompt: 'Career coach bot with resume tips, interview prep, and job search' },
  { factory: 'agent', id: 'g11', prompt: 'Travel planner bot with itinerary builder, tips, and budget tracker' },
  { factory: 'agent', id: 'g12', prompt: 'Gardening assistant bot with plant care, season tips, and scheduling' },
  { factory: 'agent', id: 'g13', prompt: 'Meditation guide bot with sessions, tracking, and relaxation tips' },
  { factory: 'agent', id: 'g14', prompt: 'Parenting assistant bot with milestones, tips, and activity suggestions' },
  { factory: 'agent', id: 'g15', prompt: 'Music teacher bot with lessons, practice tracking, and feedback' },
  { factory: 'agent', id: 'g16', prompt: 'Cooking assistant bot with recipes, substitutions, and meal prep' },
  { factory: 'agent', id: 'g17', prompt: 'Home improvement bot with project guides, tools, and material lists' },
  { factory: 'agent', id: 'g18', prompt: 'Fashion stylist bot with outfit suggestions, trends, and wardrobe audit' },
  { factory: 'agent', id: 'g19', prompt: 'Sleep coach bot with sleep tracking, tips, and relaxation exercises' },
  { factory: 'agent', id: 'g20', prompt: 'Tax advisor bot with deductions, deadlines, and filing guidance' },
  { factory: 'tools', id: 't01', prompt: 'Internal user management tool with CRUD and role assignment' },
  { factory: 'tools', id: 't02', prompt: 'JSON formatter with syntax highlighting and validation' },
  { factory: 'tools', id: 't03', prompt: 'Markdown to HTML converter with live preview' },
  { factory: 'tools', id: 't04', prompt: 'Password generator with strength meter and save feature' },
  { factory: 'tools', id: 't05', prompt: 'Regex tester with pattern matching and explanation' },
  { factory: 'tools', id: 't06', prompt: 'Color palette generator with accessibility checks and export' },
  { factory: 'tools', id: 't07', prompt: 'CSV editor with sorting, filtering, and chart visualization' },
  { factory: 'tools', id: 't08', prompt: 'Webhook tester with request history and replay' },
  { factory: 'tools', id: 't09', prompt: 'Bulk text replacement tool with regex support and preview' },
  { factory: 'tools', id: 't10', prompt: 'Config file editor with syntax validation and diff view' },
  { factory: 'tools', id: 't11', prompt: 'Image resizer tool with batch processing and format conversion' },
  { factory: 'tools', id: 't12', prompt: 'Base64 encoder decoder with file upload and batch conversion' },
  { factory: 'tools', id: 't13', prompt: 'URL shortener admin with analytics, links, and QR codes' },
  { factory: 'tools', id: 't14', prompt: 'Database query viewer with table browser and export' },
  { factory: 'tools', id: 't15', prompt: 'API endpoint tester with request builder and response viewer' },
  { factory: 'tools', id: 't16', prompt: 'QR code generator with batch creation and logo embedding' },
  { factory: 'tools', id: 't17', prompt: 'Diff viewer with side-by-side comparison and syntax highlighting' },
  { factory: 'tools', id: 't18', prompt: 'Cron job manager with schedule editor and execution history' },
  { factory: 'tools', id: 't19', prompt: 'Environment variable manager with .env editor and validation' },
  { factory: 'tools', id: 't20', prompt: 'Docker compose editor with YAML validation and service manager' },
];

const BASE_DIR = 'C:\\Users\\viren\\AppData\\Local\\Temp\\reliability-bench';
const SAMPLES_PER_FACTORY = 2;
const SAMPLE_INDICES = [0, 10];

function calcScore(r: BenchmarkProject): number {
  let s = 0;
  if (r.generated) s += 20;
  if (r.fileCount >= 10) s += 10; else if (r.fileCount >= 5) s += 5;
  if (r.preRepairFindings.filter(f => f.severity === 'critical').length === 0) s += 10;
  if (r.postRepairFindings.filter(f => f.severity === 'critical').length === 0) s += 10;
  if (r.installed) s += 10;
  if (r.built) s += 20;
  if (r.typeChecked) s += 10;
  if (r.linted) s += 5;
  if (r.buildTimeMs > 0 && r.buildTimeMs < 60000) s += 5;
  return Math.min(100, s);
}

async function main() {
  console.log(`Phase 5.5 Reliability Benchmark — ${PROMPTS.length} projects\n`);
  const engine = createEngine();
  const results: BenchmarkProject[] = [];
  const total = PROMPTS.length;

  // Phase 1: Generate all projects
  console.log('=== Phase 1: Generate ===\n');
  for (let i = 0; i < total; i++) {
    const { factory, id, prompt } = PROMPTS[i];
    const testDir = join(BASE_DIR, factory, id);
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });

    const r: BenchmarkProject = {
      id, factory, prompt, generated: false, projectName: '', fileCount: 0,
      preRepairFindings: [], postRepairFindings: [], repairActions: [],
      installed: false, built: false, typeChecked: false, linted: false,
      buildTimeMs: 0, buildErrors: [], score: 0, passed: false,
    };

    process.stdout.write(`[${i + 1}/${total}] ${factory}/${id} `);
    try {
      const gen = await engine.generate({ prompt, outputDir: testDir, factory, dryRun: false });
      if (!gen.success || gen.results.length === 0) {
        console.log('GEN FAIL');
        r.preRepairFindings.push({ severity: 'critical', category: 'generation', file: '', message: 'Generation returned no results' });
        results.push(r);
        continue;
      }
      r.generated = true;
      r.projectName = gen.results[0].blueprint.project.name;
      const outDir = join(testDir, r.projectName);
      if (existsSync(outDir)) {
        r.fileCount = getAllFiles(outDir).length;
      }
      console.log(`ok (${r.fileCount}f)`);
    } catch (e: any) {
      console.log(`ERR: ${e.message?.substring(0, 40)}`);
      r.preRepairFindings.push({ severity: 'critical', category: 'generation', file: '', message: e.message });
    }
    results.push(r);
  }

  const genRate = results.filter(r => r.generated).length;
  console.log(`\nGenerated: ${genRate}/${total} (${Math.round(genRate / total * 100)}%)`);

  // Phase 2: Validate + Repair + Build (2 samples per factory)
  console.log('\n=== Phase 2: Validate + Repair + Build ===\n');
  const factories = [...new Set(PROMPTS.map(p => p.factory))];

  for (const factory of factories) {
    const factoryResults = results.filter(r => r.factory === factory && r.generated);
    for (const idx of SAMPLE_INDICES) {
      if (idx >= factoryResults.length) continue;
      const r = factoryResults[idx];
      const outDir = join(BASE_DIR, r.factory, r.id, r.projectName);
      if (!existsSync(outDir)) continue;

      console.log(`\n--- ${r.factory}/${r.id} ---`);

      // Pre-repair validation
      console.log('  validating...');
      r.preRepairFindings.push(...validateArtifactCompleteness(outDir));
      r.preRepairFindings.push(...validateImports(outDir));
      r.preRepairFindings.push(...validateComponents(outDir));
      r.preRepairFindings.push(...validateTypes(outDir));
      r.preRepairFindings.push(...validateClientComponents(outDir));
      const preCritical = r.preRepairFindings.filter(f => f.severity === 'critical').length;
      console.log(`  pre-repair: ${r.preRepairFindings.length} findings (${preCritical} critical)`);

      // Auto-repair
      r.repairActions = autoRepair(outDir, r.preRepairFindings);
      if (r.repairActions.length > 0) {
        console.log(`  repaired: ${r.repairActions.length} fixes`);
      }

      // Post-repair validation
      r.postRepairFindings.push(...validateArtifactCompleteness(outDir));
      r.postRepairFindings.push(...validateImports(outDir));
      r.postRepairFindings.push(...validateComponents(outDir));
      r.postRepairFindings.push(...validateTypes(outDir));
      r.postRepairFindings.push(...validateClientComponents(outDir));
      const postCritical = r.postRepairFindings.filter(f => f.severity === 'critical').length;
      console.log(`  post-repair: ${r.postRepairFindings.length} findings (${postCritical} critical)`);

      // Build
      console.log('  building...');
      const { findings: buildFindings, buildTimeMs } = validateBuild(outDir);
      r.buildTimeMs = buildTimeMs;
      r.postRepairFindings.push(...buildFindings);
      r.installed = !buildFindings.some(f => f.message.includes('npm install'));
      r.built = !buildFindings.some(f => f.category === 'build' && !f.message.includes('lint'));
      r.typeChecked = !buildFindings.some(f => f.message.includes('tsc'));
      r.linted = !buildFindings.some(f => f.message.includes('lint'));
      r.buildErrors = buildFindings.filter(f => f.severity === 'critical').map(f => f.message);
      console.log(`  build: ${r.built ? 'ok' : 'FAIL'} (${buildTimeMs}ms) typecheck: ${r.typeChecked ? 'ok' : 'FAIL'} lint: ${r.linted ? 'ok' : 'FAIL'}`);

      r.score = calcScore(r);
      r.passed = r.built && postCritical === 0;
    }
  }

  // Save results
  mkdirSync('reliability', { recursive: true });
  writeFileSync('reliability/failure-database.json', JSON.stringify(results, null, 2));

  // Generate fix-patterns.json
  const fixPatterns = generateFixPatterns(results);
  writeFileSync('reliability/fix-patterns.json', JSON.stringify(fixPatterns, null, 2));

  // Generate report
  const report = generateReport(results);
  writeFileSync('reliability/reliability-report.md', report);

  // Summary
  const tested = results.filter(r => r.installed || r.built);
  const built = results.filter(r => r.built);
  const typeChecked = results.filter(r => r.typeChecked);
  const linted = results.filter(r => r.linted);
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Generated: ${genRate}/${total} (${Math.round(genRate / total * 100)}%)`);
  console.log(`Built: ${built.length}/${tested.length} (${tested.length > 0 ? Math.round(built.length / tested.length * 100) : 0}%)`);
  console.log(`TypeChecked: ${typeChecked.length}/${tested.length}`);
  console.log(`Linted: ${linted.length}/${tested.length}`);
  console.log(`Report: reliability/reliability-report.md`);
}

function generateFixPatterns(results: BenchmarkProject[]) {
  const patterns: Record<string, { count: number; fix: string; description: string }> = {};
  for (const r of results) {
    for (const action of r.repairActions) {
      const key = action.action;
      if (!patterns[key]) patterns[key] = { count: 0, fix: action.description, description: '' };
      patterns[key].count++;
    }
    for (const f of r.preRepairFindings) {
      const key = f.category + ':' + f.message.split(':')[0];
      if (!patterns[key]) patterns[key] = { count: 0, fix: 'auto-repair', description: f.message };
      patterns[key].count++;
    }
  }
  return patterns;
}

function generateReport(results: BenchmarkProject[]): string {
  const total = results.length;
  const generated = results.filter(r => r.generated).length;
  const tested = results.filter(r => r.installed || r.built);
  const built = results.filter(r => r.built);
  const typeChecked = results.filter(r => r.typeChecked);
  const linted = results.filter(r => r.linted);
  const passed = results.filter(r => r.passed);

  const factories = [...new Set(results.map(r => r.factory))];
  const byFactory = factories.map(f => {
    const fr = results.filter(r => r.factory === f);
    const fTested = fr.filter(r => r.installed || r.built);
    const fBuilt = fr.filter(r => r.built);
    const fPassed = fr.filter(r => r.passed);
    return { factory: f, total: fr.length, tested: fTested.length, built: fBuilt.length, passed: fPassed.length };
  });

  let md = `# Phase 5.5 Reliability Report

**Date:** ${new Date().toLocaleDateString()}
**Version:** v0.5.5-reliability
**Projects Tested:** ${total}
**Samples Per Factory:** Build-tested ${SAMPLES_PER_FACTORY} projects per factory

---

## Executive Summary

| Metric | Value | Target |
|--------|-------|--------|
| Generation Rate | ${Math.round(generated / total * 100)}% (${generated}/${total}) | 100% |
| Build Success Rate | ${tested.length > 0 ? Math.round(built.length / tested.length * 100) : 0}% (${built.length}/${tested.length}) | ≥95% |
| Typecheck Success | ${tested.length > 0 ? Math.round(typeChecked.length / tested.length * 100) : 0}% (${typeChecked.length}/${tested.length}) | ≥95% |
| Lint Success | ${tested.length > 0 ? Math.round(linted.length / tested.length * 100) : 0}% (${linted.length}/${tested.length}) | ≥95% |
| Validation Pass Rate | ${tested.length > 0 ? Math.round(passed.length / tested.length * 100) : 0}% (${passed.length}/${tested.length}) | ≥95% |

---

## Results by Factory

| Factory | Generated | Tested | Built | Passed | Status |
|---------|-----------|--------|-------|--------|--------|
`;

  const sorted = [...byFactory].sort((a, b) => b.passed - a.passed || b.built - a.built);
  for (const f of sorted) {
    const status = f.tested > 0 && f.built === f.tested ? '✅' : f.built > 0 ? '⚠️' : '❌';
    md += `| ${f.factory} | ${f.total} | ${f.tested} | ${f.built}/${f.tested} | ${f.passed}/${f.tested} | ${status} |\n`;
  }

  md += `\n---\n\n## Detailed Results\n\n`;

  for (const r of results.filter(r => r.installed || r.built)) {
    md += `### ${r.factory}/${r.id}\n\n`;
    md += `- **Prompt:** ${r.prompt}\n`;
    md += `- **Generated:** ${r.generated ? '✅' : '❌'} (${r.fileCount} files)\n`;
    md += `- **Pre-repair findings:** ${r.preRepairFindings.length} (${r.preRepairFindings.filter(f => f.severity === 'critical').length} critical)\n`;
    md += `- **Repair actions:** ${r.repairActions.length}\n`;
    md += `- **Post-repair findings:** ${r.postRepairFindings.length} (${r.postRepairFindings.filter(f => f.severity === 'critical').length} critical)\n`;
    md += `- **Build:** ${r.built ? '✅' : '❌'} (${r.buildTimeMs}ms)\n`;
    md += `- **TypeCheck:** ${r.typeChecked ? '✅' : '❌'}\n`;
    md += `- **Lint:** ${r.linted ? '✅' : '❌'}\n`;
    md += `- **Score:** ${r.score}/100\n`;
    if (r.buildErrors.length > 0) {
      md += `- **Errors:**\n`;
      for (const e of r.buildErrors.slice(0, 3)) md += `  - ${e.substring(0, 100)}\n`;
    }
    md += '\n';
  }

  md += `---\n\n## Repair Summary\n\n`;
  const allActions = results.flatMap(r => r.repairActions);
  const actionCounts: Record<string, number> = {};
  for (const a of allActions) actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
  md += `| Action | Count |\n|--------|-------|\n`;
  for (const [action, count] of Object.entries(actionCounts).sort((a, b) => b[1] - a[1])) {
    md += `| ${action} | ${count} |\n`;
  }

  md += `\n---\n\n## Next Steps\n\n`;
  if (built.length / (tested.length || 1) < 0.95) {
    md += '1. Investigate remaining build failures\n';
    md += '2. Add more auto-repair rules\n';
    md += '3. Fix factory code generation\n';
  } else {
    md += '1. ✅ Build success rate meets 95% target\n';
    md += '2. Proceed to Phase 6 (Memory & Learning Layer)\n';
  }

  return md;
}

main().catch(console.error);
