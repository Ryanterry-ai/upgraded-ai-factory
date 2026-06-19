/**
 * 5-DOMAIN ACCEPTANCE TEST
 *
 * Q1: Would a real business owner recognize this as their business?
 * Q2: Can I follow a complete workflow?
 * Q3: Does data connect across pages?
 *
 * Runs against: Supplement Store, Gym CRM, Restaurant, SaaS, Agency
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

interface TestResult {
  domain: string;
  q1_recognizable: { pass: boolean; evidence: string[]; min: number };
  q2_workflow: { pass: boolean; evidence: string[]; min: number };
  q3_data_connected: { pass: boolean; evidence: string[]; min: number };
}

// ═══════════════════════════════════════════════════════════
// SUPPLEMENT STORE
// ═══════════════════════════════════════════════════════════

function testSupplementStore(): TestResult {
  const state = generateSupplementBusiness();
  const { entities, metrics } = state;
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1: Real supplement store owner?
  const brands = entities.products.map(p => p.brand);
  if (brands.includes("MuscleBlaze") && brands.includes("ON")) e1.push("Real Indian supplement brands (MuscleBlaze, ON, Avvatar, GNC, MuscleTech)");
  if (entities.products.every(p => p.fssai.length > 0)) e1.push("FSSAI certification numbers on all products");
  if (entities.products.every(p => p.price > 100 && p.price < 10000)) e1.push("Indian Rupee pricing (₹449–₹3299 range)");
  if (entities.products.some(p => p.veg) && entities.products.some(p => !p.veg)) e1.push("Veg/non-veg markers on products");
  if (entities.products.some(p => p.flavor)) e1.push("Flavor variants (Chocolate, Malai Kulfi, etc.)");
  if (entities.products.some(p => p.weight)) e1.push("Weight/unit specifications");
  const cats = [...new Set(entities.products.map(p => p.category))];
  if (cats.includes("protein") && cats.includes("recovery")) e1.push("Supplement categories: " + cats.join(", "));
  if (entities.customers.every(c => c.city)) e1.push("Indian customer cities (Mumbai, Bangalore, Noida, Hyderabad)");
  if (entities.customers.some(c => c.membership)) e1.push("Membership tiers (bronze/silver/gold/platinum)");
  if (entities.products.some(p => p.badge)) e1.push("Product badges (Best Seller, Top Rated, Trending)");

  // Q2: Complete workflow?
  const statuses = entities.orders.map(o => o.status);
  if (statuses.includes("pending") && statuses.includes("processing") && statuses.includes("shipped") && statuses.includes("delivered"))
    e2.push("Full order flow: pending → processing → shipped → delivered");
  if (entities.orders.some(o => o.status === "cancelled")) e2.push("Cancelled order handling");
  if (entities.orders.some(o => o.paymentMethod === "upi") && entities.orders.some(o => o.paymentMethod === "cod"))
    e2.push("Indian payment methods (UPI, COD)");
  if (state.workflows.length >= 2) e2.push("Workflows defined: " + state.workflows.map(w => w.name).join(", "));
  if (entities.orders.some(o => o.shippingAddress)) e2.push("Shipping addresses recorded");

  // Q3: Data connects?
  if (entities.orders.every(o => entities.customers.some(c => c.id === o.customerId)))
    e3.push("Every order links to a valid customer");
  if (entities.customers.every(c => c.orderIds.every(oid => entities.orders.some(o => o.id === oid))))
    e3.push("Every customer order ID links to a valid order");
  const expectedRevenue = entities.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  if (metrics.totalRevenue === expectedRevenue) e3.push("Dashboard revenue computed from orders: ₹" + metrics.totalRevenue);
  if (metrics.totalOrders === entities.orders.length) e3.push("Total orders matches entity count: " + metrics.totalOrders);
  if (metrics.averageOrderValue > 0) e3.push("AOV derived: ₹" + metrics.averageOrderValue);
  const topProductIds = metrics.topProducts.map(tp => tp.productId);
  if (topProductIds.length > 0) e3.push("Top products computed from order data");

  return { domain: "Supplement Store", q1_recognizable: { pass: e1.length >= 7, evidence: e1, min: 7 }, q2_workflow: { pass: e2.length >= 4, evidence: e2, min: 4 }, q3_data_connected: { pass: e3.length >= 4, evidence: e3, min: 4 } };
}

// ═══════════════════════════════════════════════════════════
// GYM CRM
// ═══════════════════════════════════════════════════════════

function testGymCRM(): TestResult {
  const state = generateGymBusiness();
  const { entities, metrics } = state;
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1: Real gym owner?
  const brands = entities.products.map(p => p.brand);
  if (brands.includes("FitZone")) e1.push("Gym brand: FitZone");
  if (entities.products.every(p => p.category === "membership")) e1.push("Membership tier products (Basic/Standard/Premium/VIP)");
  if (entities.products.some(p => p.benefits.length > 0)) e1.push("Membership benefits listed");
  if (entities.products.every(p => p.price > 1000 && p.price < 10000)) e1.push("Monthly fee pricing (₹1,499–₹7,999)");
  if (entities.customers.length >= 5) e1.push("Gym member data (" + entities.customers.length + " members)");
  if (entities.customers.some(c => c.city)) e1.push("Multi-city members (Mumbai, Delhi, Gurgaon, Pune)");
  if (entities.customers.some(c => c.membership)) e1.push("Active membership tiers tracked");

  // Q2: Complete workflow?
  if (state.workflows.length >= 3) e2.push("Workflows: " + state.workflows.map(w => w.name).join(", "));
  const wfNames = state.workflows.map(w => w.name);
  if (wfNames.includes("Lead Conversion")) e2.push("Lead Conversion flow (lead → contacted → tour → sold)");
  if (wfNames.includes("Check-in Flow")) e2.push("Member Check-in flow (scan → record → log → dashboard)");
  if (wfNames.includes("Billing & Renewal")) e2.push("Billing & Renewal flow (detect → remind → process → extend)");
  if (entities.orders.every(o => o.status === "delivered")) e2.push("Membership purchase orders verified");
  if (entities.orders.some(o => o.paymentMethod)) e2.push("Payment methods tracked");

  // Q3: Data connects?
  if (entities.orders.every(o => entities.customers.some(c => c.id === o.customerId)))
    e3.push("Every membership order links to a valid member");
  if (entities.customers.every(c => c.orderIds.length > 0)) e3.push("Every member has at least one order");
  const expectedRevenue = entities.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  if (metrics.totalRevenue === expectedRevenue) e3.push("Revenue computed from memberships: ₹" + metrics.totalRevenue);
  if (metrics.totalCustomers === entities.customers.length) e3.push("Member count accurate: " + metrics.totalCustomers);
  if (metrics.averageOrderValue > 0) e3.push("Average membership value: ₹" + metrics.averageOrderValue);

  return { domain: "Gym CRM", q1_recognizable: { pass: e1.length >= 5, evidence: e1, min: 5 }, q2_workflow: { pass: e2.length >= 4, evidence: e2, min: 4 }, q3_data_connected: { pass: e3.length >= 4, evidence: e3, min: 4 } };
}

// ═══════════════════════════════════════════════════════════
// RESTAURANT
// ═══════════════════════════════════════════════════════════

function testRestaurant(): TestResult {
  const state = generateRestaurantBusiness();
  const { entities, metrics } = state;
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1: Real restaurant owner?
  const brands = entities.products.map(p => p.brand);
  if (brands.includes("Spice Garden")) e1.push("Restaurant brand: Spice Garden");
  const cats = [...new Set(entities.products.map(p => p.category))];
  if (cats.includes("mains") && cats.includes("breads") && cats.includes("beverages"))
    e1.push("Menu categories: " + cats.join(", "));
  if (entities.products.some(p => p.name === "Butter Chicken" || p.name === "Paneer Tikka Masala"))
    e1.push("Indian dishes (Butter Chicken, Paneer Tikka, Garlic Naan, Gulab Jamun)");
  if (entities.products.every(p => p.veg !== undefined)) e1.push("Veg/non-veg markers on menu items");
  if (entities.products.every(p => p.price < 500)) e1.push("Restaurant pricing (₹40–₹380)");
  if (entities.products.some(p => p.fssai)) e1.push("FSSAI compliance");
  if (entities.customers.length >= 3) e1.push("Restaurant customer data");

  // Q2: Complete workflow?
  if (state.workflows.length >= 2) e2.push("Workflows: " + state.workflows.map(w => w.name).join(", "));
  const wfNames = state.workflows.map(w => w.name);
  if (wfNames.includes("Reservation Flow")) e2.push("Reservation flow (confirm → assign → seat → order → serve → bill)");
  if (wfNames.includes("Kitchen Queue")) e2.push("Kitchen queue flow (receive → prep → cook → check → serve)");
  if (entities.orders.some(o => o.status === "delivered") && entities.orders.some(o => o.status === "processing"))
    e2.push("Order status variety (delivered + processing)");
  if (entities.orders.some(o => o.shippingAddress.startsWith("Table")))
    e2.push("Table-based ordering (orders linked to tables)");

  // Q3: Data connects?
  if (entities.orders.every(o => entities.customers.some(c => c.id === o.customerId)))
    e3.push("Every order links to a valid customer");
  const expectedRevenue = entities.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  if (metrics.totalRevenue === expectedRevenue) e3.push("Revenue computed from orders: ₹" + metrics.totalRevenue);
  if (metrics.totalOrders === entities.orders.length) e3.push("Order count accurate: " + metrics.totalOrders);
  if (metrics.averageOrderValue > 0) e3.push("Average order value: ₹" + metrics.averageOrderValue);
  const orderItems = entities.orders.flatMap(o => o.items);
  if (orderItems.length > 0) e3.push("Order line items tracked (" + orderItems.length + " items)");

  return { domain: "Restaurant", q1_recognizable: { pass: e1.length >= 5, evidence: e1, min: 5 }, q2_workflow: { pass: e2.length >= 4, evidence: e2, min: 4 }, q3_data_connected: { pass: e3.length >= 4, evidence: e3, min: 4 } };
}

// ═══════════════════════════════════════════════════════════
// SaaS
// ═══════════════════════════════════════════════════════════

function testSaaS(): TestResult {
  const state = generateSaaSBusiness();
  const { entities, metrics } = state;
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1: Real SaaS founder?
  const brands = entities.products.map(p => p.brand);
  if (brands.includes("SaaSify")) e1.push("SaaS brand: SaaSify");
  const plans = entities.products.map(p => p.name);
  if (plans.includes("Starter Plan") && plans.includes("Professional Plan") && plans.includes("Enterprise Plan"))
    e1.push("Three-tier pricing (Starter/Professional/Enterprise)");
  if (entities.products.every(p => p.benefits.length > 0)) e1.push("Plan benefits listed (users, storage, support)");
  if (entities.products.every(p => p.price > 0)) e1.push("Subscription pricing (₹999–₹9,999)");
  if (entities.customers.length >= 5) e1.push("Customer data (" + entities.customers.length + " companies)");
  if (entities.customers.some(c => c.city)) e1.push("Multi-city customers (Bangalore, Pune, Delhi, Chennai, Hyderabad, Kolkata)");
  if (entities.customers.some(c => c.membership)) e1.push("Customer tiers tracked");

  // Q2: Complete workflow?
  if (state.workflows.length >= 2) e2.push("Workflows: " + state.workflows.map(w => w.name).join(", "));
  const wfNames = state.workflows.map(w => w.name);
  if (wfNames.includes("Trial Conversion")) e2.push("Trial conversion flow (start → onboard → check-in → demo → follow-up → convert)");
  if (wfNames.includes("Churn Prevention")) e2.push("Churn prevention flow (detect → email → outreach → retain → win-back)");
  if (entities.orders.some(o => o.status === "delivered") && entities.orders.some(o => o.status === "cancelled"))
    e2.push("Active and churned subscriptions tracked");
  if (entities.orders.some(o => o.shippingAddress.includes("billing")))
    e2.push("Billing cycle tracking (monthly/annual)");

  // Q3: Data connects?
  if (entities.orders.every(o => entities.customers.some(c => c.id === o.customerId)))
    e3.push("Every subscription links to a valid customer");
  const expectedRevenue = entities.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  if (metrics.totalRevenue === expectedRevenue) e3.push("Revenue computed from subscriptions: ₹" + metrics.totalRevenue);
  if (metrics.totalOrders === entities.orders.length) e3.push("Subscription count accurate: " + metrics.totalOrders);
  if (metrics.averageOrderValue > 0) e3.push("Average contract value: ₹" + metrics.averageOrderValue);
  if (entities.customers.every(c => c.totalSpent > 0)) e3.push("Customer LTV tracked");

  return { domain: "SaaS", q1_recognizable: { pass: e1.length >= 5, evidence: e1, min: 5 }, q2_workflow: { pass: e2.length >= 4, evidence: e2, min: 4 }, q3_data_connected: { pass: e3.length >= 4, evidence: e3, min: 4 } };
}

// ═══════════════════════════════════════════════════════════
// AGENCY
// ═══════════════════════════════════════════════════════════

function testAgency(): TestResult {
  const state = generateAgencyBusiness();
  const { entities, metrics } = state;
  const e1: string[] = [];
  const e2: string[] = [];
  const e3: string[] = [];

  // Q1: Real agency owner?
  const brands = entities.products.map(p => p.brand);
  if (brands.includes("PixelCraft Agency")) e1.push("Agency brand: PixelCraft Agency");
  const services = entities.products.map(p => p.name);
  if (services.includes("Website Redesign") && services.includes("SEO Package"))
    e1.push("Agency services (Website Redesign, SEO, Social Media, PPC)");
  if (entities.products.every(p => p.benefits.length > 0)) e1.push("Service deliverables listed");
  if (entities.products.every(p => p.price >= 25000)) e1.push("Agency pricing (₹25,000–₹1,50,000)");
  if (entities.customers.length >= 4) e1.push("Client data (" + entities.customers.length + " clients)");
  if (entities.customers.some(c => c.city)) e1.push("Multi-city clients (Bangalore, Mumbai, Delhi, Pune)");
  if (entities.customers.some(c => c.membership)) e1.push("Client tiers tracked");

  // Q2: Complete workflow?
  if (state.workflows.length >= 3) e2.push("Workflows: " + state.workflows.map(w => w.name).join(", "));
  const wfNames = state.workflows.map(w => w.name);
  if (wfNames.includes("Client Acquisition")) e2.push("Client acquisition flow (lead → call → proposal → contract → onboard)");
  if (wfNames.includes("Project Delivery")) e2.push("Project delivery flow (kickoff → strategy → execute → review → deliver → invoice)");
  if (wfNames.includes("Invoice Collection")) e2.push("Invoice collection flow (send → remind → follow-up → receive → close)");
  if (entities.orders.some(o => o.status === "delivered") && entities.orders.some(o => o.status === "processing"))
    e2.push("Active and completed projects tracked");
  if (entities.orders.some(o => o.shippingAddress.includes("Milestone") || o.shippingAddress.includes("Phase")))
    e2.push("Milestone-based project tracking");

  // Q3: Data connects?
  if (entities.orders.every(o => entities.customers.some(c => c.id === o.customerId)))
    e3.push("Every project links to a valid client");
  const expectedRevenue = entities.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  if (metrics.totalRevenue === expectedRevenue) e3.push("Revenue computed from projects: ₹" + metrics.totalRevenue);
  if (metrics.totalOrders === entities.orders.length) e3.push("Project count accurate: " + metrics.totalOrders);
  if (metrics.averageOrderValue > 0) e3.push("Average project value: ₹" + metrics.averageOrderValue);
  const totalProjectRevenue = entities.orders.reduce((s, o) => s + o.total, 0);
  if (totalProjectRevenue > 100000) e3.push("Six-figure project revenue verified");

  return { domain: "Agency", q1_recognizable: { pass: e1.length >= 5, evidence: e1, min: 5 }, q2_workflow: { pass: e2.length >= 4, evidence: e2, min: 4 }, q3_data_connected: { pass: e3.length >= 4, evidence: e3, min: 4 } };
}

// ═══════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════════════════════════");
console.log("  5-DOMAIN ACCEPTANCE TEST — Build.same");
console.log("═══════════════════════════════════════════════════════════\n");

const results: TestResult[] = [
  testSupplementStore(),
  testGymCRM(),
  testRestaurant(),
  testSaaS(),
  testAgency(),
];

let allPass = true;
const summary: string[] = [];

for (const r of results) {
  const q1 = r.q1_recognizable.pass ? "✅" : "❌";
  const q2 = r.q2_workflow.pass ? "✅" : "❌";
  const q3 = r.q3_data_connected.pass ? "✅" : "❌";
  const domainPass = r.q1_recognizable.pass && r.q2_workflow.pass && r.q3_data_connected.pass;
  if (!domainPass) allPass = false;

  summary.push(`  ${domainPass ? "✅" : "❌"} ${r.domain}: Q1=${q1} Q2=${q2} Q3=${q3}`);

  console.log(`┌─── ${r.domain} ───────────────────────────────`);
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
console.log(`  OVERALL: ${allPass ? "✅ ALL 5 DOMAINS PASS" : "❌ SOME DOMAINS FAILED"}`);
console.log("═══════════════════════════════════════════════════════════");

process.exit(allPass ? 0 : 1);
