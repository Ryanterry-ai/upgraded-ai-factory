import { createEngine } from '../core/factory-setup.js';
import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = 'C:\\Users\\viren\\AppData\\Local\\Temp\\factory-test';

interface TestResult {
  factory: string;
  prompt: string;
  generated: boolean;
  fileCount: number;
  installed: boolean;
  built: boolean;
  linted: boolean;
  typeChecked: boolean;
  buildErrors: string[];
  lintErrors: string[];
  tsErrors: string[];
}

const PROMPTS: Record<string, string[]> = {
  website: [
    'Landing page for a mobile app with hero section and features',
    'Portfolio website for a photographer with gallery',
    'Blog homepage with article cards and newsletter signup',
    'Restaurant website with menu and contact form',
    'Agency website with services and team section',
    'SaaS landing page with pricing table and testimonials',
    'Personal blog with dark mode support',
    'Corporate website with about and contact pages',
    'Event conference website with speakers and schedule',
    'Fitness studio website with class schedule',
  ],
  ecommerce: [
    'Online store for handmade candles with product grid and cart',
    'Sneaker store with product categories and filters',
    'Organic food store with product listings and checkout',
    'Jewelry store with product detail pages and cart',
    'Bookstore with categories and shopping cart',
    'Coffee subscription store with plans and checkout',
    'Plant nursery store with product grid and cart',
    'Art prints store with gallery and checkout',
    'Pet supplies store with categories and cart',
    'Skincare store with routines and product cards',
  ],
  saas: [
    'Project management tool with login and dashboard',
    'CRM platform with contacts and pipeline view',
    'Email marketing tool with campaigns and subscribers',
    'Invoicing app with invoice creation and reports',
    'Appointment scheduling tool with calendar and bookings',
    'Survey builder with form editor and responses',
    'Habit tracker with streaks and daily check-ins',
    'Bookmark manager with tags and search',
    'Kanban board with drag-drop and cards',
    'Time tracking tool with timers and reports',
  ],
  admin: [
    'Admin panel with user table and CRUD operations',
    'Content management admin with posts and categories',
    'Blog admin with posts editor and comments',
    'Settings admin with general and notification settings',
    'Customer admin with profiles and order history',
    'Employee directory admin with profiles and departments',
    'Order management admin with orders and shipping',
    'Pricing admin with plans and coupon management',
    'Email template admin with editor and preview',
    'Inventory management admin with stock levels and alerts',
  ],
  dashboard: [
    'Sales dashboard with revenue chart and top products',
    'Marketing dashboard with campaign metrics and ROI',
    'Ecommerce dashboard with orders and conversion rate',
    'HR dashboard with headcount and hiring pipeline',
    'Project dashboard with tasks and team workload',
    'Customer support dashboard with tickets and satisfaction',
    'Social media dashboard with followers and engagement',
    'Website analytics dashboard with visitors and pageviews',
    'Inventory dashboard with stock levels and alerts',
    'SEO dashboard with rankings and organic traffic',
  ],
  agent: [
    'Customer support chatbot with FAQ responses',
    'Personal AI assistant with chat and reminders',
    'Language learning bot with exercises and vocabulary',
    'Recipe recommendation bot with meal planning',
    'Fitness coach bot with workout plans and tracking',
    'Financial advisor bot with budget tips and alerts',
    'Study companion bot with quizzes and flashcards',
    'Book recommendation bot with reading lists',
    'Pet care bot with feeding schedules and tips',
    'Career coach bot with resume tips and job search',
  ],
  tools: [
    'Internal user management tool with CRUD and roles',
    'JSON formatter with syntax highlighting and validation',
    'Markdown to HTML converter with live preview',
    'Password generator with strength meter',
    'Regex tester with pattern matching and explanation',
    'Color palette generator with accessibility checks',
    'CSV editor with sorting and filtering',
    'Webhook tester with request history and replay',
    'Bulk text replacement tool with regex support',
    'Config file editor with syntax validation',
  ],
};

async function testFactory(factoryName: string, prompt: string, index: number): Promise<TestResult> {
  const projectDir = join(TEST_DIR, factoryName, `test-${index}`);
  const result: TestResult = {
    factory: factoryName,
    prompt,
    generated: false,
    fileCount: 0,
    installed: false,
    built: false,
    linted: false,
    typeChecked: false,
    buildErrors: [],
    lintErrors: [],
    tsErrors: [],
  };

  try {
    // Clean and create directory
    if (existsSync(projectDir)) rmSync(projectDir, { recursive: true });
    mkdirSync(projectDir, { recursive: true });

    // Generate
    const engine = createEngine();
    const genResult = await engine.generate({
      prompt,
      outputDir: projectDir,
      factory: factoryName,
      dryRun: false,
    });

    if (!genResult.success || genResult.results.length === 0) {
      result.buildErrors.push('Generation failed');
      return result;
    }

    const outDir = join(projectDir, genResult.results[0].blueprint.project.name);
    if (!existsSync(outDir)) {
      result.buildErrors.push('Output directory not found');
      return result;
    }

    result.generated = true;
    result.fileCount = readdirSync(outDir, { recursive: true }).length;

    // npm install
    try {
      execSync('npm install --legacy-peer-deps 2>&1', { cwd: outDir, timeout: 120000, encoding: 'utf-8', stdio: 'pipe' });
      result.installed = true;
    } catch (e: any) {
      result.buildErrors.push(`npm install failed: ${(e.stdout || e.message).substring(0, 500)}`);
      return result;
    }

    // npm run build
    try {
      execSync('npm run build 2>&1', { cwd: outDir, timeout: 120000, encoding: 'utf-8', stdio: 'pipe' });
      result.built = true;
    } catch (e: any) {
      const output = e.stdout || e.message || '';
      result.buildErrors.push(output.substring(0, 1000));
    }

    // npm run lint
    try {
      execSync('npm run lint 2>&1', { cwd: outDir, timeout: 60000, encoding: 'utf-8', stdio: 'pipe' });
      result.linted = true;
    } catch (e: any) {
      result.lintErrors.push((e.stdout || e.message || '').substring(0, 500));
    }

    // npx tsc --noEmit (typecheck)
    try {
      execSync('npx tsc --noEmit 2>&1', { cwd: outDir, timeout: 60000, encoding: 'utf-8', stdio: 'pipe' });
      result.typeChecked = true;
    } catch (e: any) {
      const output = e.stdout || e.message || '';
      const errorLines = output.split('\n').filter((l: string) => l.includes('error TS'));
      result.tsErrors = errorLines.slice(0, 10);
    }

  } catch (e: any) {
    result.buildErrors.push(`Unexpected error: ${e.message}`);
  }

  return result;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     CODE GENERATION READINESS REPORT                        ║');
  console.log('║     Testing all 7 factories × 10 prompts each              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const allResults: TestResult[] = [];
  const factories = Object.keys(PROMPTS);

  for (const factory of factories) {
    console.log(`\n🏭 Testing ${factory.toUpperCase()} factory...`);
    console.log('─'.repeat(60));

    const prompts = PROMPTS[factory];
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      process.stdout.write(`  [${i + 1}/10] ${prompt.substring(0, 50)}... `);
      
      const result = await testFactory(factory, prompt, i);
      allResults.push(result);

      const status = result.built ? '✅ BUILD' : result.installed ? '❌ BUILD' : '❌ GEN';
      console.log(status);
    }
  }

  // Generate report
  console.log('\n\n' + '═'.repeat(70));
  console.log('CODE GENERATION READINESS REPORT');
  console.log('═'.repeat(70));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Total Projects Tested: ${allResults.length}`);
  console.log();

  // Summary by factory
  console.log('FACTORY SUMMARY');
  console.log('─'.repeat(70));
  console.log('Factory'.padEnd(15) + 'Generated'.padEnd(12) + 'Installed'.padEnd(12) + 'Built'.padEnd(10) + 'Linted'.padEnd(10) + 'TypeSafe'.padEnd(10));
  console.log('─'.repeat(70));

  for (const factory of factories) {
    const factoryResults = allResults.filter(r => r.factory === factory);
    const generated = factoryResults.filter(r => r.generated).length;
    const installed = factoryResults.filter(r => r.installed).length;
    const built = factoryResults.filter(r => r.built).length;
    const linted = factoryResults.filter(r => r.linted).length;
    const typeChecked = factoryResults.filter(r => r.typeChecked).length;

    console.log(
      factory.padEnd(15) +
      `${generated}/10`.padEnd(12) +
      `${installed}/10`.padEnd(12) +
      `${built}/10`.padEnd(10) +
      `${linted}/10`.padEnd(10) +
      `${typeChecked}/10`.padEnd(10)
    );
  }

  console.log('─'.repeat(70));

  // Overall stats
  const totalGenerated = allResults.filter(r => r.generated).length;
  const totalInstalled = allResults.filter(r => r.installed).length;
  const totalBuilt = allResults.filter(r => r.built).length;
  const totalLinted = allResults.filter(r => r.linted).length;
  const totalTypeChecked = allResults.filter(r => r.typeChecked).length;

  console.log('\nOVERALL STATS');
  console.log('─'.repeat(70));
  console.log(`Generated:   ${totalGenerated}/70 (${Math.round(totalGenerated/70*100)}%)`);
  console.log(`Installed:   ${totalInstalled}/70 (${Math.round(totalInstalled/70*100)}%)`);
  console.log(`Built:       ${totalBuilt}/70 (${Math.round(totalBuilt/70*100)}%)`);
  console.log(`Linted:      ${totalLinted}/70 (${Math.round(totalLinted/70*100)}%)`);
  console.log(`TypeSafe:    ${totalTypeChecked}/70 (${Math.round(totalTypeChecked/70*100)}%)`);

  // Common errors
  console.log('\n\nCOMMON BUILD ERRORS');
  console.log('─'.repeat(70));
  const errorTypes: Record<string, number> = {};
  for (const r of allResults) {
    for (const err of r.buildErrors) {
      if (err.includes('Cannot find module')) errorTypes['Missing module'] = (errorTypes['Missing module'] || 0) + 1;
      else if (err.includes('TS')) errorTypes['TypeScript error'] = (errorTypes['TypeScript error'] || 0) + 1;
      else if (err.includes('is not a module')) errorTypes['Module import error'] = (errorTypes['Module import error'] || 0) + 1;
      else if (err.includes('react-dom')) errorTypes['React DOM error'] = (errorTypes['React DOM error'] || 0) + 1;
      else errorTypes['Other'] = (errorTypes['Other'] || 0) + 1;
    }
  }
  for (const [type, count] of Object.entries(errorTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  // Sample errors
  console.log('\nSAMPLE BUILD ERRORS (first 5)');
  console.log('─'.repeat(70));
  const failedResults = allResults.filter(r => !r.built && r.buildErrors.length > 0);
  for (const r of failedResults.slice(0, 5)) {
    console.log(`\n[${r.factory}] ${r.prompt.substring(0, 50)}...`);
    console.log(r.buildErrors[0].substring(0, 300));
  }

  // Sample TS errors
  console.log('\nSAMPLE TYPESCRIPT ERRORS (first 5)');
  console.log('─'.repeat(70));
  const tsFailedResults = allResults.filter(r => !r.typeChecked && r.tsErrors.length > 0);
  for (const r of tsFailedResults.slice(0, 5)) {
    console.log(`\n[${r.factory}] ${r.prompt.substring(0, 50)}...`);
    for (const err of r.tsErrors.slice(0, 3)) {
      console.log(`  ${err}`);
    }
  }

  // Save JSON report
  const report = {
    timestamp: new Date().toISOString(),
    totalProjects: allResults.length,
    overallStats: {
      generated: totalGenerated,
      installed: totalInstalled,
      built: totalBuilt,
      linted: totalLinted,
      typeChecked: totalTypeChecked,
    },
    factoryResults: factories.map(f => {
      const fr = allResults.filter(r => r.factory === f);
      return {
        factory: f,
        generated: fr.filter(r => r.generated).length,
        installed: fr.filter(r => r.installed).length,
        built: fr.filter(r => r.built).length,
        linted: fr.filter(r => r.linted).length,
        typeChecked: fr.filter(r => r.typeChecked).length,
        results: fr,
      };
    }),
  };

  const { writeFileSync } = await import('fs');
  writeFileSync(join(TEST_DIR, 'readiness-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n\n📊 Full report saved to: ${join(TEST_DIR, 'readiness-report.json')}`);
}

main().catch(console.error);
