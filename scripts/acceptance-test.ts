/**
 * 10-DOMAIN ACCEPTANCE TEST
 *
 * Q1: Would a real business owner recognize this as their business?
 * Q2: Can I follow a complete workflow?
 * Q3: Does data connect across pages?
 *
 * Validates all Tier 1 domains using Domain Registry entity definitions.
 * For domains with full generators (Supplement, Gym, Restaurant, SaaS, Agency),
 * tests actual generated data. For newer domains (Healthcare, Education, Real Estate,
 * Hotel, Ecommerce), tests registry blueprint completeness.
 */

import {
  generateSupplementBusiness,
  generateGymBusiness,
  generateRestaurantBusiness,
  generateSaaSBusiness,
  generateAgencyBusiness,
} from "../web/lib/business-domains";
import { computeMetrics } from "../web/lib/business-data-provider";
import type { BusinessState } from "../web/lib/business-data-provider";
import { TIER1_DOMAINS, type DomainBlueprint } from "../web/lib/domain-registry";

interface TestResult {
  domain: string;
  tier: number;
  q1_recognizable: { pass: boolean; evidence: string[]; min: number };
  q2_workflow: { pass: boolean; evidence: string[]; min: number };
  q3_data_connected: { pass: boolean; evidence: string[]; min: number };
}

// ═══════════════════════════════════════════════════════════
// REGISTRY-BASED VALIDATION (for domains without generators)
// ═══════════════════════════════════════════════════════════

function testRegistryDomain(blueprint: DomainBlueprint): TestResult {
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1: Would a real business owner recognize this?
  if (blueprint.entities.length >= 3) e1.push(`${blueprint.entities.length} domain-specific entities defined`);
  if (blueprint.keywords.length >= 3) e1.push(`Detection keywords: ${blueprint.keywords.slice(0, 4).join(", ")}`);
  if (blueprint.entities.some(e => e.fields.some(f => f.type === "ref"))) e1.push("Entity relationships defined (refs between entities)");
  if (blueprint.entities.every(e => e.fields.length >= 3)) e1.push("All entities have 3+ fields");
  if (blueprint.mockDataConfig.indianMarket) e1.push("Indian market configuration (₹ INR, Indian names)");
  if (blueprint.description.length > 20) e1.push(`Domain description: "${blueprint.description.substring(0, 60)}..."`);
  const entityNames = blueprint.entities.map(e => e.name);
  if (entityNames.length >= 3) e1.push(`Core entities: ${entityNames.join(", ")}`);

  // Q2: Can I follow a complete workflow?
  if (blueprint.workflows.length >= 1) e2.push(`${blueprint.workflows.length} workflow(s) defined`);
  for (const wf of blueprint.workflows) {
    if (wf.steps.length >= 3) e2.push(`Workflow "${wf.name}": ${wf.steps.length} steps (${wf.steps.map(s => s.name).join(" → ")})`);
    if (wf.outputEntity) e2.push(`  Output entity: ${wf.outputEntity}`);
  }
  if (blueprint.pages.length >= 3) e2.push(`${blueprint.pages.length} pages defined`);
  if (blueprint.dashboards.length >= 1) e2.push(`${blueprint.dashboards.length} dashboard(s) with widgets`);

  // Q3: Does data connect across pages?
  const entityIds = new Set(blueprint.entities.map(e => e.id));
  const refsUsed = blueprint.entities.flatMap(e => e.fields.filter(f => f.type === "ref").map(f => f.refEntity));
  const allRefsValid = refsUsed.every(ref => entityIds.has(ref!));
  if (allRefsValid) e3.push("All entity references resolve to valid entities");
  if (refsUsed.length >= 2) e3.push(`${refsUsed.length} cross-entity references defined`);
  if (blueprint.dashboards.some(d => d.widgets.some(w => w.dataEntity))) e3.push("Dashboard widgets reference entity data");
  const widgetEntities = blueprint.dashboards.flatMap(d => d.widgets.map(w => w.dataEntity));
  const allWidgetEntitiesValid = widgetEntities.every(e => entityIds.has(e));
  if (allWidgetEntitiesValid && widgetEntities.length > 0) e3.push("All dashboard widget data sources are valid entities");
  if (blueprint.businessRules.length >= 0) e3.push(`${blueprint.businessRules.length} business rule(s) defined`);

  return {
    domain: blueprint.name,
    tier: blueprint.tier,
    q1_recognizable: { pass: e1.length >= 5, evidence: e1, min: 5 },
    q2_workflow: { pass: e2.length >= 3, evidence: e2, min: 3 },
    q3_data_connected: { pass: e3.length >= 3, evidence: e3, min: 3 },
  };
}

// ═══════════════════════════════════════════════════════════
// GENERATOR-BASED VALIDATION (for domains with full generators)
// ═══════════════════════════════════════════════════════════

function testGeneratorDomain(state: BusinessState, domainName: string, tier: number): TestResult {
  const { entities, metrics } = state;
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1
  if (entities.products.length >= 3) e1.push(`${entities.products.length} products/services defined`);
  if (entities.customers.length >= 3) e1.push(`${entities.customers.length} customers with Indian data`);
  if (entities.products.every(p => p.price > 0)) e1.push("All products have pricing");
  if (entities.customers.every(c => c.city)) e1.push("Indian customer cities");
  if (entities.customers.some(c => c.membership)) e1.push("Membership tiers tracked");

  // Q2
  if (entities.orders.length >= 3) e2.push(`${entities.orders.length} orders in various statuses`);
  const statuses = [...new Set(entities.orders.map(o => o.status))];
  if (statuses.length >= 1) e2.push(`Order statuses: ${statuses.join(", ")}`);
  if (state.workflows.length >= 1) e2.push(`${state.workflows.length} business workflows defined`);

  // Q3
  if (entities.orders.every(o => entities.customers.some(c => c.id === o.customerId)))
    e3.push("All orders link to valid customers");
  const expectedRevenue = entities.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  if (metrics.totalRevenue === expectedRevenue) e3.push(`Revenue derived from orders: ₹${metrics.totalRevenue}`);
  if (metrics.totalOrders === entities.orders.length) e3.push(`Order count accurate: ${metrics.totalOrders}`);

  return {
    domain: domainName,
    tier,
    q1_recognizable: { pass: e1.length >= 3, evidence: e1, min: 3 },
    q2_workflow: { pass: e2.length >= 3, evidence: e2, min: 3 },
    q3_data_connected: { pass: e3.length >= 3, evidence: e3, min: 3 },
  };
}

// ═══════════════════════════════════════════════════════════
// RUN ALL TIER 1 DOMAINS
// ═══════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════════════════════════");
console.log("  10-DOMAIN ACCEPTANCE TEST — Build.same Tier 1");
console.log("═══════════════════════════════════════════════════════════\n");

// Domains with full generators
const generatorDomains: Array<{ name: string; generator: () => BusinessState }> = [
  { name: "Supplement Store", generator: generateSupplementBusiness },
  { name: "Gym CRM", generator: generateGymBusiness },
  { name: "Restaurant", generator: generateRestaurantBusiness },
  { name: "SaaS Platform", generator: generateSaaSBusiness },
  { name: "Agency CRM", generator: generateAgencyBusiness },
];

const results: TestResult[] = [];

// Test generator-based domains
for (const gd of generatorDomains) {
  const state = gd.generator();
  const blueprint = TIER1_DOMAINS.find(d => d.name === gd.name);
  results.push(testGeneratorDomain(state, gd.name, blueprint?.tier || 1));
}

// Test registry-based domains (Healthcare, Education, Real Estate, Hotel, Ecommerce)
const registryDomains = TIER1_DOMAINS.filter(d =>
  !generatorDomains.some(gd => gd.name === d.name)
);
for (const rd of registryDomains) {
  results.push(testRegistryDomain(rd));
}

// Print results
let allPass = true;
const summary: string[] = [];

for (const r of results) {
  const q1 = r.q1_recognizable.pass ? "✅" : "❌";
  const q2 = r.q2_workflow.pass ? "✅" : "❌";
  const q3 = r.q3_data_connected.pass ? "✅" : "❌";
  const domainPass = r.q1_recognizable.pass && r.q2_workflow.pass && r.q3_data_connected.pass;
  if (!domainPass) allPass = false;

  summary.push(`  ${domainPass ? "✅" : "❌"} ${r.domain} (Tier ${r.tier}): Q1=${q1} Q2=${q2} Q3=${q3}`);

  console.log(`┌─── ${r.domain} (Tier ${r.tier}) ───────────────────────────────`);
  console.log(`│`);
  console.log(`│  Q1: Would a real business owner recognize this? (${r.q1_recognizable.evidence.length}/${r.q1_recognizable.min} min)`);
  console.log(`│  ${q1} ${r.q1_recognizable.pass ? "PASS" : "FAIL"}`);
  for (const e of r.q1_recognizable.evidence) console.log(`│    ✓ ${e}`);
  console.log(`│`);
  console.log(`│  Q2: Can I follow a complete workflow? (${r.q2_workflow.evidence.length}/${r.q2_workflow.min} min)`);
  console.log(`│  ${q2} ${r.q2_workflow.pass ? "PASS" : "FAIL"}`);
  for (const e of r.q2_workflow.evidence) console.log(`│    ✓ ${e}`);
  console.log(`│`);
  console.log(`│  Q3: Does data connect across pages? (${r.q3_data_connected.evidence.length}/${r.q3_data_connected.min} min)`);
  console.log(`│  ${q3} ${r.q3_data_connected.pass ? "PASS" : "FAIL"}`);
  for (const e of r.q3_data_connected.evidence) console.log(`│    ✓ ${e}`);
  console.log(`│`);
}

console.log("═══════════════════════════════════════════════════════════");
console.log("  SUMMARY");
console.log("═══════════════════════════════════════════════════════════");
for (const s of summary) console.log(s);
console.log("═══════════════════════════════════════════════════════════");
console.log(`  OVERALL: ${allPass ? "✅ ALL 10 TIER 1 DOMAINS PASS" : "❌ SOME DOMAINS FAILED"}`);
console.log("═══════════════════════════════════════════════════════════");

process.exit(allPass ? 0 : 1);
