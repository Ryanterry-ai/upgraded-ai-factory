import { createEngine } from '../core/factory-setup.js';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = 'C:\\Users\\viren\\AppData\\Local\\Temp\\quick-fail-test';

function runCmd(cmd: string, cwd: string, timeout = 90000): { ok: boolean; output: string } {
  try {
    const out = execSync(cmd, { cwd, timeout, encoding: 'utf-8', stdio: 'pipe' });
    return { ok: true, output: out };
  } catch (e: any) {
    return { ok: false, output: (e.stdout || '') + (e.stderr || '') + (e.message || '') };
  }
}

function getAllFiles(dir: string, base: string = dir): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getAllFiles(fp, base));
    else files.push(fp.replace(base, '').replace(/\\/g, '/').replace(/^\//, ''));
  }
  return files;
}

async function testFactory(factory: string, prompt: string, id: string) {
  const testDir = join(TEST_DIR, id);
  if (existsSync(testDir)) rmSync(testDir, { recursive: true });
  mkdirSync(testDir, { recursive: true });

  const engine = createEngine();
  console.log(`\n=== ${factory}/${id} ===`);
  console.log(`Prompt: ${prompt}`);

  const gen = await engine.generate({ prompt, outputDir: testDir, factory, dryRun: false });
  if (!gen.success || gen.results.length === 0) {
    console.log('GENERATION FAILED');
    return;
  }
  const projectName = gen.results[0].blueprint.project.name;
  const outDir = join(testDir, projectName);
  const files = getAllFiles(outDir);
  console.log(`Files (${files.length}):`, files.filter(f => !f.includes('blueprint')).join(', '));

  // Install
  console.log('\nInstalling...');
  const inst = runCmd('npm install --legacy-peer-deps 2>&1', outDir, 90000);
  if (!inst.ok) {
    console.log('INSTALL FAILED:');
    console.log(inst.output.substring(0, 500));
    return;
  }
  console.log('Install OK');

  // Build
  console.log('\nBuilding...');
  const build = runCmd('npm run build 2>&1', outDir, 90000);
  if (build.ok) {
    console.log('BUILD OK');
  } else {
    console.log('BUILD FAILED:');
    // Extract meaningful errors
    const lines = build.output.split('\n');
    const errorLines = lines.filter(l => l.includes('Error') || l.includes('error') || l.includes('Cannot') || l.includes('Module not found') || l.includes('Type'));
    console.log(errorLines.slice(0, 20).join('\n'));
    if (errorLines.length === 0) console.log(build.output.substring(0, 800));
  }
}

// Test the known-failing factories
async function main() {
  await testFactory('tools', 'Internal user management tool with CRUD and role assignment', 't01');
  await testFactory('website', 'Corporate website with about, services, team, and contact pages', 'w06');
  await testFactory('ecommerce', 'Online store for handmade candles with product grid and cart', 'e01');
  await testFactory('dashboard', 'Customer support dashboard with tickets, response time, and satisfaction', 'd06');
  await testFactory('agent', 'Fitness coach bot with workout plans, tracking, and motivation', 'g05');
}

main().catch(console.error);
