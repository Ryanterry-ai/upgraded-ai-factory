/**
 * DOMAIN DIFFERENTIATION AUDIT
 *
 * Ensures domains are distinct — no template leakage.
 * If two domains produce identical components/pages/workflows, the system is using
 * the same template for everything (template leakage).
 *
 * DDS = 1 - averageSimilarityAcrossDomains
 * Target: DDS ≥ 0.6
 */

import { detectDomain, getDomainCount, type DomainBlueprint } from "../web/lib/domain-registry";

// ═══════════════════════════════════════════════════════════
// SIMILARITY CALCULATION
// ═══════════════════════════════════════════════════════════

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const intersection = [...setA].filter(x => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}

function extractEntityNames(bp: DomainBlueprint): string[] {
  return bp.entities.map(e => e.name);
}

function extractWorkflowNames(bp: DomainBlueprint): string[] {
  return bp.workflows.map(w => w.name);
}

function extractPageNames(bp: DomainBlueprint): string[] {
  return bp.pages.map(p => p.name);
}

function extractPageRoutes(bp: DomainBlueprint): string[] {
  return bp.pages.map(p => p.route);
}

function extractDashboardWidgets(bp: DomainBlueprint): string[] {
  return bp.dashboards.flatMap(d => d.widgets.map(w => w.name));
}

function extractBusinessRules(bp: DomainBlueprint): string[] {
  return bp.businessRules.map(r => r.name);
}

// ═══════════════════════════════════════════════════════════
// COMPOSITE SIMILARITY
// ═══════════════════════════════════════════════════════════

interface SimilarityResult {
  domainA: string;
  domainB: string;
  entitySim: number;
  workflowSim: number;
  pageSim: number;
  widgetSim: number;
  ruleSim: number;
  compositeSim: number;
}

function computeSimilarity(bpA: DomainBlueprint, bpB: DomainBlueprint): SimilarityResult {
  const entitySim = jaccardSimilarity(extractEntityNames(bpA), extractEntityNames(bpB));
  const workflowSim = jaccardSimilarity(extractWorkflowNames(bpA), extractWorkflowNames(bpB));
  const pageSim = jaccardSimilarity(extractPageNames(bpA), extractPageNames(bpB));
  const widgetSim = jaccardSimilarity(extractDashboardWidgets(bpA), extractDashboardWidgets(bpB));
  const ruleSim = jaccardSimilarity(extractBusinessRules(bpA), extractBusinessRules(bpB));

  // Weighted composite
  const compositeSim = (
    entitySim * 0.30 +
    workflowSim * 0.25 +
    pageSim * 0.25 +
    widgetSim * 0.10 +
    ruleSim * 0.10
  );

  return {
    domainA: bpA.id,
    domainB: bpB.id,
    entitySim,
    workflowSim,
    pageSim,
    widgetSim,
    ruleSim,
    compositeSim,
  };
}

// ═══════════════════════════════════════════════════════════
// RUN AUDIT
// ═══════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════════════════════════");
console.log("  DOMAIN DIFFERENTIATION AUDIT");
console.log("═══════════════════════════════════════════════════════════\n");

// Get all Tier 1 domains for the audit
const TIER1_IDS = [
  "supplement-store", "ecommerce-store", "gym-crm", "saas-platform",
  "agency-crm", "restaurant", "healthcare-clinic", "education-platform",
  "real-estate-crm", "hotel-booking",
];

const blueprintMap = new Map<string, DomainBlueprint>();
for (const id of TIER1_IDS) {
  const bp = detectDomain(id);
  if (bp && !blueprintMap.has(bp.id)) {
    blueprintMap.set(bp.id, bp);
  }
}
const blueprints = Array.from(blueprintMap.values());

console.log(`Loaded ${blueprints.length} Tier 1 blueprints\n`);

// Compute pairwise similarities
const similarities: SimilarityResult[] = [];
let maxSimilarity = 0;
let maxSimilarPair = "";

for (let i = 0; i < blueprints.length; i++) {
  for (let j = i + 1; j < blueprints.length; j++) {
    const sim = computeSimilarity(blueprints[i], blueprints[j]);
    similarities.push(sim);

    if (sim.compositeSim > maxSimilarity) {
      maxSimilarity = sim.compositeSim;
      maxSimilarPair = `${sim.domainA} ↔ ${sim.domainB}`;
    }
  }
}

// Display top 5 most similar pairs
similarities.sort((a, b) => b.compositeSim - a.compositeSim);

console.log("TOP 5 MOST SIMILAR PAIRS:");
console.log("─".repeat(60));
for (const sim of similarities.slice(0, 5)) {
  const bar = "█".repeat(Math.round(sim.compositeSim * 30));
  console.log(`${sim.domainA} ↔ ${sim.domainB}`);
  console.log(`  Composite: ${(sim.compositeSim * 100).toFixed(1)}%  ${bar}`);
  console.log(`  Entity: ${(sim.entitySim * 100).toFixed(0)}%  Workflow: ${(sim.workflowSim * 100).toFixed(0)}%  Page: ${(sim.pageSim * 100).toFixed(0)}%  Widget: ${(sim.widgetSim * 100).toFixed(0)}%  Rule: ${(sim.ruleSim * 100).toFixed(0)}%`);
  console.log();
}

// Compute Domain Differentiation Score
const avgSimilarity = similarities.reduce((s, sim) => s + sim.compositeSim, 0) / similarities.length;
const dds = 1 - avgSimilarity;

console.log("═".repeat(60));
console.log(`  AVERAGE SIMILARITY: ${(avgSimilarity * 100).toFixed(1)}%`);
console.log(`  DOMAIN DIFFERENTIATION SCORE (DDS): ${(dds * 100).toFixed(1)}%`);
console.log(`  THRESHOLD: ≥ 60%`);
console.log("═".repeat(60) + "\n");

// Check for template leakage (any pair > 40% similar)
const leaked = similarities.filter(s => s.compositeSim > 0.40);

if (leaked.length > 0) {
  console.log("❌ TEMPLATE LEAKAGE DETECTED — pairs with >40% similarity:");
  for (const l of leaked) {
    console.log(`   ${l.domainA} ↔ ${l.domainB}: ${(l.compositeSim * 100).toFixed(1)}%`);
  }
  process.exit(1);
}

if (dds < 0.60) {
  console.log(`❌ DOMAIN DIFFERENTIATION FAILED — DDS=${(dds * 100).toFixed(1)}% < 60%`);
  process.exit(1);
}

console.log("✅ DOMAIN DIFFERENTIATION PASSED — no template leakage, DDS ≥ 60%");
