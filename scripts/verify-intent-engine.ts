/**
 * Verification: Two gym CRM prompts produce measurably different output
 * via the Business Intent Engine.
 *
 * Prompt A: "Build a gym CRM, we're losing too many members after their first 3 months"
 * Prompt B: "Build a gym CRM, our staff can't keep track of who's paid their monthly dues"
 *
 * Expected: Different prioritizedSystems, different hero text, different architecture emphasis.
 */

import { SolutionEngine, type SolutionModel } from "../web/lib/solution-engine";
import { extractIntent, type IntentProfile } from "../web/lib/intent-engine";
import { GymCRMPack } from "../web/lib/solution-packs/gym-crm";
import { SupplementStorePack } from "../web/lib/solution-packs/supplement-store";
import { StreamingPlatformPack } from "../web/lib/solution-packs/streaming-platform";
import { EcommerceAdminPack } from "../web/lib/solution-packs/ecommerce-admin";

const PROMPT_A = "Build a gym CRM, we're losing too many members after their first 3 months";
const PROMPT_B = "Build a gym CRM, our staff can't keep track of who's paid their monthly dues";

async function run() {
  const engine = new SolutionEngine([GymCRMPack, SupplementStorePack, StreamingPlatformPack, EcommerceAdminPack]);

  console.log("═══════════════════════════════════════════════════");
  console.log("  BUSINESS INTENT ENGINE — Acceptance Test");
  console.log("═══════════════════════════════════════════════════\n");

  // ─── Step 1: SolutionEngine detection ───
  const modelA = engine.detect(PROMPT_A);
  const modelB = engine.detect(PROMPT_B);

  console.log("Step 1: SolutionEngine Detection");
  console.log(`  Prompt A domain: ${modelA?.domain ?? "null"}`);
  console.log(`  Prompt B domain: ${modelB?.domain ?? "null"}`);
  console.log(`  Same domain: ${modelA?.domain === modelB?.domain ? "YES (both gym)" : "NO"}\n`);

  // ─── Step 2: Intent Extraction ───
  const intentA = await extractIntent(PROMPT_A, modelA);
  const intentB = await extractIntent(PROMPT_B, modelB);

  console.log("Step 2: Intent Extraction");
  console.log(`  Prompt A source: ${intentA.source}`);
  console.log(`  Prompt B source: ${intentB.source}`);
  console.log(`  Prompt A confidence: ${intentA.confidence}`);
  console.log(`  Prompt B confidence: ${intentB.confidence}\n`);

  console.log("  ┌─── Prompt A Intent ───────────────────────────");
  console.log(`  │ Primary Problem: ${intentA.primaryProblem}`);
  console.log(`  │ Primary Goal:    ${intentA.primaryGoal}`);
  console.log(`  │ Systems:         [${intentA.prioritizedSystems.join(", ")}]`);
  console.log(`  └──────────────────────────────────────────────\n`);

  console.log("  ┌─── Prompt B Intent ───────────────────────────");
  console.log(`  │ Primary Problem: ${intentB.primaryProblem}`);
  console.log(`  │ Primary Goal:    ${intentB.primaryGoal}`);
  console.log(`  │ Systems:         [${intentB.prioritizedSystems.join(", ")}]`);
  console.log(`  └──────────────────────────────────────────────\n`);

  // ─── Step 3: Verify different prioritizedSystems ───
  const systemsDiffer = JSON.stringify(intentA.prioritizedSystems) !== JSON.stringify(intentB.prioritizedSystems);
  console.log("Step 3: PrioritizedSystems Differ?");
  console.log(`  ${systemsDiffer ? "✅ YES" : "❌ NO — FAIL"}\n`);

  // ─── Step 4: Verify different primaryProblem ───
  const problemsDiffer = intentA.primaryProblem !== intentB.primaryProblem;
  console.log("Step 4: PrimaryProblem Differ?");
  console.log(`  ${problemsDiffer ? "✅ YES" : "❌ NO — FAIL"}`);
  console.log(`  A: "${intentA.primaryProblem}"`);
  console.log(`  B: "${intentB.primaryProblem}"\n`);

  // ─── Step 5: Verify different primaryGoal ───
  const goalsDiffer = intentA.primaryGoal !== intentB.primaryGoal;
  console.log("Step 5: PrimaryGoal Differ?");
  console.log(`  ${goalsDiffer ? "✅ YES" : "❌ NO — FAIL"}`);
  console.log(`  A: "${intentA.primaryGoal}"`);
  console.log(`  B: "${intentB.primaryGoal}"\n`);

  // ─── Step 6: Hero text would differ ───
  // The hero title comes from primaryGoal, the subtitle from primaryProblem
  const heroATitle = intentA.primaryGoal.charAt(0).toUpperCase() + intentA.primaryGoal.slice(1);
  const heroBTitle = intentB.primaryGoal.charAt(0).toUpperCase() + intentB.primaryGoal.slice(1);
  const heroDiffer = heroATitle !== heroBTitle;
  console.log("Step 6: Hero Text Would Differ?");
  console.log(`  ${heroDiffer ? "✅ YES" : "❌ NO — FAIL"}`);
  console.log(`  A hero title: "${heroATitle}"`);
  console.log(`  B hero title: "${heroBTitle}"\n`);

  // ─── Step 7: Personas differ ───
  const personasA = intentA.personas.map(p => p.role).join(", ");
  const personasB = intentB.personas.map(p => p.role).join(", ");
  console.log("Step 7: Personas");
  console.log(`  A: [${personasA || "none (fallback)"}]`);
  console.log(`  B: [${personasB || "none (fallback)"}]\n`);

  // ─── Step 8: Metrics differ ───
  const metricsA = intentA.successMetrics.map(m => m.metric).join(", ");
  const metricsB = intentB.successMetrics.map(m => m.metric).join(", ");
  console.log("Step 8: Success Metrics");
  console.log(`  A: [${metricsA || "none (fallback)"}]`);
  console.log(`  B: [${metricsB || "none (fallback)"}]\n`);

  // ─── Summary ───
  const allPassed = systemsDiffer && problemsDiffer && goalsDiffer && heroDiffer;
  console.log("═══════════════════════════════════════════════════");
  console.log(`  RESULT: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);
  console.log("═══════════════════════════════════════════════════\n");

  if (!allPassed) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
