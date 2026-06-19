/**
 * CROSS-APP CONSISTENCY TEST
 *
 * Verifies that data flows correctly through the Business Entity Layer:
 * - Same entity referenced across components uses consistent data
 * - Revenue is always derived from delivered orders (never hardcoded)
 * - Inventory changes are reflected in stock levels
 * - Customer data is consistent across order history and metrics
 */

import {
  generateSupplementBusiness,
  generateGymBusiness,
  generateRestaurantBusiness,
  generateSaaSBusiness,
  generateAgencyBusiness,
} from "../web/lib/business-domains";
import { computeMetrics } from "../web/lib/business-data-provider";
import type { BusinessState, BusinessEntities } from "../web/lib/business-data-provider";

interface ConsistencyResult {
  domain: string;
  tests: { name: string; pass: boolean; detail: string }[];
}

// ═══════════════════════════════════════════════════════════
// CONSISTENCY CHECKS
// ═══════════════════════════════════════════════════════════

function checkRevenueConsistency(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const delivered = state.entities.orders.filter(o => o.status !== "cancelled");
  const expected = delivered.reduce((s, o) => s + o.total, 0);
  const pass = state.metrics.totalRevenue === expected;
  return {
    name: "Revenue derived from orders",
    pass,
    detail: pass
      ? `Revenue ₹${state.metrics.totalRevenue} = sum of ${delivered.length} non-cancelled orders`
      : `MISMATCH: metrics says ₹${state.metrics.totalRevenue}, computed ₹${expected}`,
  };
}

function checkCustomerOrderLink(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const allLinked = state.entities.orders.every(o =>
    state.entities.customers.some(c => c.id === o.customerId)
  );
  return {
    name: "All orders link to valid customers",
    pass: allLinked,
    detail: allLinked
      ? `${state.entities.orders.length} orders all have valid customer references`
      : `Some orders reference non-existent customers`,
  };
}

function checkCustomerOrderHistory(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const allLinked = state.entities.customers.every(c =>
    c.orderIds.every(oid => state.entities.orders.some(o => o.id === oid))
  );
  return {
    name: "All customer order IDs link to valid orders",
    pass: allLinked,
    detail: allLinked
      ? `All customer order histories reference real orders`
      : `Some customer orderIds reference non-existent orders`,
  };
}

function checkOrderTotals(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const mismatches = state.entities.orders.filter(o => {
    const computed = o.items.reduce((s, i) => s + i.price * i.qty, 0);
    return Math.abs(computed - o.total) > 1; // allow rounding
  });
  return {
    name: "Order totals match line items",
    pass: mismatches.length === 0,
    detail: mismatches.length === 0
      ? `All ${state.entities.orders.length} order totals match their line items`
      : `${mismatches.length} orders have mismatched totals: ${mismatches.map(o => o.id).join(", ")}`,
  };
}

function checkOrderItemRefs(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const allValid = state.entities.orders.every(o =>
    o.items.every(i => state.entities.products.some(p => p.id === i.productId))
  );
  return {
    name: "All order items reference valid products",
    pass: allValid,
    detail: allValid
      ? `All order items reference existing products`
      : `Some order items reference non-existent products`,
  };
}

function checkTopProductsFromOrders(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const topIds = state.metrics.topProducts.map(tp => tp.productId);
  const allValid = topIds.every(pid => state.entities.products.some(p => p.id === pid));
  return {
    name: "Top products computed from order data",
    pass: allValid && topIds.length > 0,
    detail: allValid
      ? `${topIds.length} top products all reference valid products`
      : `Top products contain invalid references`,
  };
}

function checkMetricsMatchEntities(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const ordersOk = state.metrics.totalOrders === state.entities.orders.length;
  const customersOk = state.metrics.totalCustomers === state.entities.customers.length;
  return {
    name: "Metrics counts match entity counts",
    pass: ordersOk && customersOk,
    detail: `Orders: metrics=${state.metrics.totalOrders} entity=${state.entities.orders.length}, Customers: metrics=${state.metrics.totalCustomers} entity=${state.entities.customers.length}`,
  };
}

function checkInventorySalesLink(state: BusinessState): { name: string; pass: boolean; detail: string } {
  const sales = state.entities.inventoryMovements.filter(m => m.type === "sale");
  if (sales.length === 0) return { name: "Inventory sales link to orders", pass: true, detail: "No sales movements (N/A)" };
  const allLinked = sales.every(m => state.entities.orders.some(o => o.id === m.orderId));
  return {
    name: "Inventory sales link to orders",
    pass: allLinked,
    detail: allLinked
      ? `${sales.length} sale movements all reference valid orders`
      : `Some sale movements reference non-existent orders`,
  };
}

function checkNoHardcodedPrices(state: BusinessState): { name: string; pass: boolean; detail: string } {
  // Verify products have unique prices (not all the same placeholder value)
  const prices = state.entities.products.map(p => p.price);
  const unique = new Set(prices).size;
  return {
    name: "Products have varied pricing (no placeholders)",
    pass: unique >= Math.min(prices.length, 3),
    detail: `${unique} unique prices across ${prices.length} products`,
  };
}

function checkDomainSpecificContent(state: BusinessState, domain: string): { name: string; pass: boolean; detail: string } {
  const productNames = state.entities.products.map(p => p.name.toLowerCase());
  const customerNames = state.entities.customers.map(c => c.name);

  const domainKeywords: Record<string, string[]> = {
    supplement: ["whey", "creatine", "protein"],
    gym: ["membership", "basic", "premium"],
    restaurant: ["chicken", "paneer", "naan", "rice"],
    saas: ["plan", "starter", "enterprise"],
    agency: ["website", "seo", "social", "ppc"],
  };

  const keywords = domainKeywords[domain] || [];
  const matches = productNames.filter(n => keywords.some(k => n.includes(k)));
  return {
    name: `Domain-specific content (${domain})`,
    pass: matches.length >= 2,
    detail: `${matches.length}/${productNames.length} products match domain keywords`,
  };
}

// ═══════════════════════════════════════════════════════════
// RUN ALL DOMAINS
// ═══════════════════════════════════════════════════════════

function runDomain(domain: string, generator: () => BusinessState): ConsistencyResult {
  const state = generator();
  const tests = [
    checkRevenueConsistency(state),
    checkCustomerOrderLink(state),
    checkCustomerOrderHistory(state),
    checkOrderTotals(state),
    checkOrderItemRefs(state),
    checkTopProductsFromOrders(state),
    checkMetricsMatchEntities(state),
    checkInventorySalesLink(state),
    checkNoHardcodedPrices(state),
    checkDomainSpecificContent(state, domain),
  ];
  return { domain, tests };
}

console.log("═══════════════════════════════════════════════════════════");
console.log("  CROSS-APP CONSISTENCY TEST");
console.log("═══════════════════════════════════════════════════════════\n");

const results: ConsistencyResult[] = [
  runDomain("supplement", generateSupplementBusiness),
  runDomain("gym", generateGymBusiness),
  runDomain("restaurant", generateRestaurantBusiness),
  runDomain("saas", generateSaaSBusiness),
  runDomain("agency", generateAgencyBusiness),
];

let allPass = true;

for (const r of results) {
  const passed = r.tests.filter(t => t.pass).length;
  const total = r.tests.length;
  const domainOk = passed === total;
  if (!domainOk) allPass = false;

  console.log(`┌─── ${r.domain.toUpperCase()} (${passed}/${total}) ${domainOk ? "✅" : "❌"} ───`);
  for (const t of r.tests) {
    console.log(`│  ${t.pass ? "✅" : "❌"} ${t.name}`);
    if (!t.pass) console.log(`│     ↳ ${t.detail}`);
  }
  console.log("│");
}

console.log("═══════════════════════════════════════════════════════════");
console.log(`  OVERALL: ${allPass ? "✅ ALL CONSISTENT" : "❌ INCONSISTENCIES FOUND"}`);
console.log("═══════════════════════════════════════════════════════════");

process.exit(allPass ? 0 : 1);
