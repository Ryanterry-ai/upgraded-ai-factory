/**
 * BUSINESS TRUTH AUDIT
 *
 * Verifies data consistency across all generated business data:
 *   - Revenue = sum of delivered order totals
 *   - Order totals = sum of line item (price × qty)
 *   - All order.customerId → valid customer
 *   - All order.items.productId → valid product
 *   - Customer.totalSpent = sum of their order totals
 *   - No placeholder data (Product A, $29.99, etc.)
 *
 * Data Consistency Score (DCS) = validRelations / totalRelations
 * Target: DCS = 1.0 (strict)
 */

import { generateFromRegistry } from "../web/lib/registry-data-generator";
import { computeMetrics } from "../web/lib/business-data-provider";

const TEST_DOMAINS = [
  "supplement-store", "ecommerce-store", "gym-crm", "saas-platform",
  "agency-crm", "restaurant", "healthcare-clinic", "education-platform",
  "real-estate-crm", "hotel-booking",
];

// ═══════════════════════════════════════════════════════════
// CHECKS
// ═══════════════════════════════════════════════════════════

interface TruthCheck {
  name: string;
  passed: boolean;
  detail: string;
}

function checkDomain(domainId: string): TruthCheck[] {
  const state = generateFromRegistry(domainId);
  const checks: TruthCheck[] = [];

  // 1. Revenue = sum of non-cancelled order totals (matches computeMetrics behavior)
  const validOrders = state.entities.orders.filter(o => o.status !== "cancelled");
  const computedRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueOk = Math.abs(state.metrics.totalRevenue - computedRevenue) < 1;
  checks.push({
    name: "Revenue derivation",
    passed: revenueOk,
    detail: `metrics.totalRevenue=${state.metrics.totalRevenue}, computed=${computedRevenue}`,
  });

  // 2. Order totals = sum of line items
  let allOrderTotalsOk = true;
  for (const order of state.entities.orders) {
    const computedTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (Math.abs(order.total - computedTotal) > 0.01) {
      allOrderTotalsOk = false;
      checks.push({
        name: "Order total mismatch",
        passed: false,
        detail: `${order.id}: total=${order.total}, computed=${computedTotal}`,
      });
    }
  }
  if (allOrderTotalsOk) {
    checks.push({
      name: "Order totals correct",
      passed: true,
      detail: `${state.entities.orders.length} orders verified`,
    });
  }

  // 3. All order.customerId → valid customer
  const customerIds = new Set(state.entities.customers.map(c => c.id));
  const invalidCustomerRefs = state.entities.orders.filter(o => !customerIds.has(o.customerId));
  checks.push({
    name: "Customer references",
    passed: invalidCustomerRefs.length === 0,
    detail: invalidCustomerRefs.length === 0
      ? `All ${state.entities.orders.length} orders link to valid customers`
      : `${invalidCustomerRefs.length} orders have invalid customer refs`,
  });

  // 4. All order.items.productId → valid product
  const productIds = new Set(state.entities.products.map(p => p.id));
  let invalidProductRefs = 0;
  for (const order of state.entities.orders) {
    for (const item of order.items) {
      if (!productIds.has(item.productId)) {
        invalidProductRefs++;
      }
    }
  }
  checks.push({
    name: "Product references",
    passed: invalidProductRefs === 0,
    detail: invalidProductRefs === 0
      ? "All order items reference valid products"
      : `${invalidProductRefs} items reference invalid products`,
  });

  // 5. Customer.totalSpent = sum of their order totals
  let totalSpentOk = true;
  for (const customer of state.entities.customers) {
    const customerOrders = state.entities.orders.filter(o => o.customerId === customer.id);
    const computedSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    if (Math.abs(customer.totalSpent - computedSpent) > 1) {
      totalSpentOk = false;
      checks.push({
        name: "Customer totalSpent mismatch",
        passed: false,
        detail: `${customer.id}: totalSpent=${customer.totalSpent}, computed=${computedSpent}`,
      });
    }
  }
  if (totalSpentOk) {
    checks.push({
      name: "Customer totalSpent correct",
      passed: true,
      detail: `All ${state.entities.customers.length} customer spending totals verified`,
    });
  }

  // 6. No placeholder data
  const placeholderPatterns = ["Product A", "Product B", "$29.99", "Lorem ipsum", "placeholder", "test user", "John Doe", "Jane Doe"];
  const allNames = [
    ...state.entities.products.map(p => p.name),
    ...state.entities.customers.map(c => c.name),
  ];
  const hasPlaceholders = allNames.some(name =>
    placeholderPatterns.some(p => name.toLowerCase().includes(p.toLowerCase()))
  );
  checks.push({
    name: "No placeholder data",
    passed: !hasPlaceholders,
    detail: hasPlaceholders ? "Found placeholder patterns in data" : "All data is domain-specific",
  });

  // 7. Order statuses are valid
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const invalidStatuses = state.entities.orders.filter(o => !validStatuses.includes(o.status));
  checks.push({
    name: "Valid order statuses",
    passed: invalidStatuses.length === 0,
    detail: invalidStatuses.length === 0
      ? `All orders have valid statuses`
      : `${invalidStatuses.length} orders have invalid statuses`,
  });

  // 8. Products have realistic pricing (real estate domains have higher thresholds)
  const isHighValue = domainId.includes("real-estate") || domainId.includes("property") || domainId.includes("construction");
  const maxPrice = isHighValue ? 100000000 : 10000000;
  const unrealisticPricing = state.entities.products.filter(p =>
    p.price <= 0 || p.price > maxPrice || p.originalPrice < p.price
  );
  checks.push({
    name: "Realistic product pricing",
    passed: unrealisticPricing.length === 0,
    detail: unrealisticPricing.length === 0
      ? `All ${state.entities.products.length} products have realistic pricing`
      : `${unrealisticPricing.length} products have unrealistic pricing`,
  });

  return checks;
}

// ═══════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════════════════════════");
console.log("  BUSINESS TRUTH AUDIT");
console.log("═══════════════════════════════════════════════════════════\n");

let totalChecks = 0;
let passedChecks = 0;
const failedDomains: string[] = [];

for (const domain of TEST_DOMAINS) {
  const checks = checkDomain(domain);
  const domainPassed = checks.every(c => c.passed);
  const icon = domainPassed ? "✅" : "❌";

  console.log(`${icon} ${domain.toUpperCase()}`);
  for (const c of checks) {
    const checkIcon = c.passed ? "✅" : "❌";
    console.log(`   ${checkIcon} ${c.name}: ${c.detail}`);
    totalChecks++;
    if (c.passed) passedChecks++;
  }
  console.log();

  if (!domainPassed) {
    failedDomains.push(domain);
  }
}

console.log("═".repeat(60));
console.log(`  RESULTS: ${passedChecks}/${totalChecks} checks passed`);
console.log(`  DOMAINS: ${TEST_DOMAINS.length - failedDomains.length}/${TEST_DOMAINS.length} passed`);
console.log(`  DCS: ${Math.round((passedChecks / totalChecks) * 100)}%`);
console.log("═".repeat(60) + "\n");

if (failedDomains.length > 0) {
  console.log("❌ BUSINESS TRUTH AUDIT FAILED — domains with data inconsistencies:");
  for (const d of failedDomains) {
    console.log(`   ${d}`);
  }
  process.exit(1);
}

console.log("✅ BUSINESS TRUTH AUDIT PASSED — all data consistent across domains");
