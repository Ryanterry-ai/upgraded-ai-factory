import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { StudioEngine } from '../core/engine.js';
import { allFactories } from '../factories/index.js';
import type { FactoryType, StudioInput } from '../core/types.js';
import { blueprintToJson, blueprintToYaml } from '../generators/blueprint-gen.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

function createEngine(): StudioEngine {
  const engine = new StudioEngine({ outputDir: './output', verbose: false, dryRun: true });
  for (const FactoryClass of allFactories) {
    engine.registerFactory(new FactoryClass());
  }
  return engine;
}

function detectFactory(prompt: string): FactoryType {
  const lower = prompt.toLowerCase();
  if (/shop|store|product|cart|checkout|ecommerce|buy|purchase/i.test(lower)) return 'ecommerce';
  if (/agent|chatbot|chat|ai|assistant|bot/i.test(lower)) return 'agent';
  if (/admin|panel|crud|manage|backoffice/i.test(lower)) return 'admin';
  if (/dashboard|analytics|chart|graph|metric/i.test(lower)) return 'dashboard';
  if (/tool|internal|utility|builder|viewer/i.test(lower)) return 'tools';
  if (/saas|subscription|billing|tenant/i.test(lower)) return 'saas';
  return 'website';
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url === '/' && req.method === 'GET') {
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(htmlPath, 'utf-8'));
    } else {
      res.writeHead(404);
      res.end('HTML not found');
    }
    return;
  }

  if (req.url === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { input, inputType, factory: forcedFactory } = JSON.parse(body);
        const startTime = Date.now();

        const studioInput: StudioInput = {
          type: inputType || 'prompt',
          prompt: inputType === 'prompt' ? input : undefined,
          url: inputType === 'url' ? input : undefined,
          screenshotPath: inputType === 'screenshot' ? input : undefined,
          figmaUrl: inputType === 'figma' ? input : undefined,
          pdfPath: inputType === 'pdf' ? input : undefined,
          codebasePath: inputType === 'codebase' ? input : undefined,
        };

        const engine = createEngine();
        const factoryType = (forcedFactory && forcedFactory !== 'auto') ? forcedFactory as FactoryType : detectFactory(input);
        const result = await engine.execute(studioInput, factoryType);

        if (result.success && result.results[0]) {
          const r = result.results[0];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            factory: r.factory,
            blueprint: r.blueprint,
            json: blueprintToJson(r.blueprint),
            yaml: blueprintToYaml(r.blueprint),
            files: r.files.length,
            duration: Date.now() - startTime,
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Generation failed' }));
        }
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n🚀 Upgraded AI Factory Studio`);
  console.log(`   http://localhost:${PORT}\n`);
});
