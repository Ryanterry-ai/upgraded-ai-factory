/**
 * System State Engine (SSE) verification tests.
 * Run: npx tsx scripts/verify-sse.ts
 *
 * 5 mandatory tests:
 * 1. Workflow start → step → complete
 * 2. RPSE data in state.entities
 * 3. UI updates from state changes
 * 4. Agent event modifies workflow
 * 5. Navigation updates state.ui.activePage
 */

import {
  initializeSystemState,
  getState,
  emit,
  hydrateStateWithRPSE,
  startWorkflow,
  advanceWorkflow,
  completeWorkflow,
  failWorkflow,
  subscribe,
  resetSystem,
  getEntitiesByType,
  getActiveWorkflows,
  getWorkflow,
  getEventsByType,
  getEventsBySource,
  registerAgentEvent,
  AgentActions,
  compileWorkflows,
  createStateSelector,
  watchState,
  type SystemState,
  type SystemEvent,
} from "../web/lib/system-state-engine";
import { detectBlueprint } from "../web/lib/domain-blueprints";
import { getRPSEData } from "../web/lib/rpse";

let passed = 0;
let failed = 0;

function test(label: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// ═══════════════════════════════════════════════════════════
// 1. WORKFLOW START → STEP → COMPLETE
// ═══════════════════════════════════════════════════════════
console.log("\n=== 1. WORKFLOW START → STEP → COMPLETE ===");

resetSystem();
const gymBlueprint = detectBlueprint("Build a gym CRM with attendance tracking and member management");
test("Gym blueprint detected", gymBlueprint !== null, gymBlueprint?.name || "none");

initializeSystemState({
  domain: "gym-crm",
  projectName: "GymFlow",
  blueprint: gymBlueprint,
});

const state1 = getState();
const workflowIds = Object.keys(state1.workflows);
test("Workflows compiled from blueprint", workflowIds.length > 0, `${workflowIds.length} workflows`);

// Start first workflow
const wfId = workflowIds[0];
const wf1 = getWorkflow(wfId);
test("Workflow found by ID", wf1 !== undefined, wf1?.name || "none");
test("Workflow starts as idle", wf1?.status === "idle");

startWorkflow(wfId);
const wf2 = getWorkflow(wfId);
test("Workflow status is active after start", wf2?.status === "active");
test("Workflow step is 0 after start", wf2?.step === 0);

// Advance through steps
advanceWorkflow(wfId);
const wf3 = getWorkflow(wfId);
test("Workflow advances to step 1", wf3?.step === 1);
test("Workflow still active after advance", wf3?.status === "active");

advanceWorkflow(wfId);
const wf4 = getWorkflow(wfId);
test("Workflow advances to step 2", wf4?.step === 2);

// Complete workflow
completeWorkflow(wfId);
const wf5 = getWorkflow(wfId);
test("Workflow status is completed", wf5?.status === "completed");
test("Workflow step equals totalSteps", wf5?.step === wf5?.totalSteps);

// ═══════════════════════════════════════════════════════════
// 2. RPSE DATA IN STATE.ENTITIES
// ═══════════════════════════════════════════════════════════
console.log("\n=== 2. RPSE DATA IN STATE.ENTITIES ===");

resetSystem();
initializeSystemState({
  domain: "gym-crm",
  projectName: "GymFlow",
  blueprint: gymBlueprint,
});

const rpseData = getRPSEData("gym-crm");
test("RPSE data bundle exists for gym-crm", rpseData !== null && rpseData !== undefined);
test("RPSE data has tableData", rpseData?.tableData !== undefined);
test("RPSE data has dashboardStats", rpseData?.dashboardStats !== undefined);

// Hydrate state with RPSE data
if (rpseData) {
  hydrateStateWithRPSE(rpseData, "gym-crm");
  const state2 = getState();
  const entityCount = Object.keys(state2.entities).length;
  test("Entities populated after RPSE hydration", entityCount > 0, `${entityCount} entities`);

  // Check entity types
  const tableRowEntities = getEntitiesByType("table-row");
  test("Table-row entities exist", tableRowEntities.length > 0, `${tableRowEntities.length} table-row entities`);

  const cardEntities = getEntitiesByType("card");
  test("Card entities exist", cardEntities.length > 0, `${cardEntities.length} card entities`);

  const pipelineEntities = getEntitiesByType("pipeline-item");
  test("Pipeline-item entities exist", pipelineEntities.length > 0, `${pipelineEntities.length} pipeline-item entities`);

  // Check domain.liveData populated
  test("Domain.liveData populated", Object.keys(state2.domain.liveData).length > 0);

  // Check RPSE event was emitted
  const rpseEvents = getEventsByType("RPSE_HYDRATE");
  test("RPSE_HYDRATE event emitted", rpseEvents.length > 0);
} else {
  test("RPSE hydration skipped (no data)", false);
}

// ═══════════════════════════════════════════════════════════
// 3. UI UPDATES FROM STATE CHANGES
// ═══════════════════════════════════════════════════════════
console.log("\n=== 3. UI UPDATES FROM STATE CHANGES ===");

resetSystem();
initializeSystemState({
  domain: "ecommerce",
  projectName: "ShopNow",
  blueprint: null,
});

const state3 = getState();
test("Initial UI has activePage", typeof state3.ui.activePage === "string");
test("Initial UI has sidebarOpen", typeof state3.ui.sidebarOpen === "boolean");
test("Initial UI has theme", typeof state3.ui.theme === "string");

// Update UI via emit — payload is the SystemUI partial directly
emit({
  type: "UI_UPDATE",
  payload: {
    activePage: "/products",
    sidebarOpen: true,
    theme: "dark",
  },
  source: "user",
});

const state4 = getState();
test("UI activePage updated to /products", state4.ui.activePage === "/products");
test("UI sidebarOpen updated to true", state4.ui.sidebarOpen === true);
test("UI theme updated to dark", state4.ui.theme === "dark");

// Test state selector
const selectActivePage = createStateSelector((s) => s.ui.activePage);
test("State selector returns current activePage", selectActivePage() === "/products");

// Test watchState
let watchCalled = false;
const unsub = watchState((s) => {
  watchCalled = true;
});
emit({
  type: "UI_UPDATE",
  payload: { activePage: "/cart" },
  source: "user",
});
test("watchState callback fired on state change", watchCalled);
test("watchState unsub works", typeof unsub === "function");

// ═══════════════════════════════════════════════════════════
// 4. AGENT EVENT MODIFIES WORKFLOW
// ═══════════════════════════════════════════════════════════
console.log("\n=== 4. AGENT EVENT MODIFIES WORKFLOW ===");

resetSystem();
initializeSystemState({
  domain: "saas-dashboard",
  projectName: "AnalyticsPro",
  blueprint: gymBlueprint,
});

const wfIds2 = Object.keys(getState().workflows);
test("Workflows exist for agent test", wfIds2.length > 0);

if (wfIds2.length > 0) {
  const testWfId = wfIds2[0];
  startWorkflow(testWfId);
  const beforeAgent = getWorkflow(testWfId);
  test("Workflow active before agent event", beforeAgent?.status === "active");

  // Agent emits an event that updates the workflow
  registerAgentEvent("updateWorkflow", {
    workflowId: testWfId,
    updates: { step: beforeAgent!.step + 1 },
  });

  const afterAgent = getWorkflow(testWfId);
  test("Agent event advanced workflow step", afterAgent!.step > beforeAgent!.step);

  // Agent uses AgentActions helper
  AgentActions.updateMetric("testMetric", 42);
  const state5 = getState();
  test("AgentActions.updateMetric sets metric", state5.domain.metrics["testMetric"] === 42);

  AgentActions.updateUI({ activePage: "/reports" });
  const state6 = getState();
  test("AgentActions.updateUI sets activePage", state6.ui.activePage === "/reports");

  // Agent events are logged
  const agentEvents = getEventsBySource("agent");
  test("Agent events logged", agentEvents.length > 0, `${agentEvents.length} events`);
}

// ═══════════════════════════════════════════════════════════
// 5. NAVIGATION UPDATES STATE.UI.ACTIVEPAGE
// ═══════════════════════════════════════════════════════════
console.log("\n=== 5. NAVIGATION UPDATES STATE.UI.ACTIVEPAGE ===");

resetSystem();
initializeSystemState({
  domain: "restaurant",
  projectName: "FoodBistro",
  blueprint: null,
});

const state7 = getState();
test("Initial activePage is /", state7.ui.activePage === "/");

// Navigate to /menu
emit({
  type: "NAVIGATE",
  payload: { page: "/menu" },
  source: "user",
});

const state8 = getState();
test("Navigation to /menu updates activePage", state8.ui.activePage === "/menu");

// Navigate to /reservations
emit({
  type: "NAVIGATE",
  payload: { page: "/reservations" },
  source: "user",
});

const state9 = getState();
test("Navigation to /reservations updates activePage", state9.ui.activePage === "/reservations");

// Navigate to /order
emit({
  type: "NAVIGATE",
  payload: { page: "/order" },
  source: "user",
});

const state10 = getState();
test("Navigation to /order updates activePage", state10.ui.activePage === "/order");

// Check navigation events were logged
const navEvents = getEventsByType("NAVIGATE");
test("NAVIGATE events logged", navEvents.length >= 3, `${navEvents.length} events`);

// Test initial navigation history
resetSystem();
initializeSystemState({
  domain: "ecommerce",
  projectName: "TestStore",
  blueprint: null,
});

emit({ type: "NAVIGATE", payload: { page: "/products" }, source: "user" });
emit({ type: "NAVIGATE", payload: { page: "/cart" }, source: "user" });
emit({ type: "NAVIGATE", payload: { page: "/checkout" }, source: "user" });

const state11 = getState();
test("Navigation history tracks all pages", state11.ui.navigationHistory.length >= 3);
test("Current page is last navigated page", state11.ui.activePage === "/checkout");

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log("\n==================================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
}
