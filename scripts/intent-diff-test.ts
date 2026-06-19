/**
 * INTENT DIFFERENTIATION TEST
 *
 * Verifies that different user intents produce different outputs:
 * - "authenticity-focused" vs "repeat-customer-focused" supplement stores
 * - Intent profiles must differ in primaryProblem, primaryGoal, and prioritizedSystems
 * - Hero copy must differ between the two intents
 */

import { extractIntent } from "../web/lib/intent-engine";
import { SolutionEngine, type SolutionModel } from "../web/lib/solution-engine";
import { SupplementStorePack } from "../web/lib/solution-packs/supplement-store";

const engine = new SolutionEngine([SupplementStorePack]);

interface IntentDiffResult {
  promptsMatch: boolean;
  profileDiffers: boolean;
  heroDiffers: boolean;
  details: {
    authenticity: { problem: string; goal: string; systems: string[]; source: string };
    repeat: { problem: string; goal: string; systems: string[]; source: string };
  };
}

async function testIntentDiff(): Promise<IntentDiffResult> {
  const authenticityPrompt = "Build me a supplement store focused on authenticity and trust — lab-tested products, FSSAI certified, transparent ingredient lists";
  const repeatPrompt = "Build me a supplement store focused on repeat customers — subscription plans, loyalty rewards, reorder reminders, lifetime value";

  const solutionModel = engine.detect(authenticityPrompt);
  if (!solutionModel) throw new Error("No solution model detected for supplement prompt");

  const authProfile = await extractIntent(authenticityPrompt, solutionModel);
  const repeatProfile = await extractIntent(repeatPrompt, solutionModel);

  const profileDiffers =
    authProfile.primaryProblem !== repeatProfile.primaryProblem ||
    authProfile.primaryGoal !== repeatProfile.primaryGoal ||
    JSON.stringify(authProfile.prioritizedSystems) !== JSON.stringify(repeatProfile.prioritizedSystems);

  // Simulate hero copy (same logic as genHero)
  const authHero = authProfile.primaryGoal !== "Unspecified"
    ? authProfile.primaryGoal.charAt(0).toUpperCase() + authProfile.primaryGoal.slice(1)
    : "Fuel Your Fitness Goals Today";
  const repeatHero = repeatProfile.primaryGoal !== "Unspecified"
    ? repeatProfile.primaryGoal.charAt(0).toUpperCase() + repeatProfile.primaryGoal.slice(1)
    : "Fuel Your Fitness Goals Today";

  return {
    promptsMatch: authenticityPrompt !== repeatPrompt,
    profileDiffers,
    heroDiffers: authHero !== repeatHero,
    details: {
      authenticity: {
        problem: authProfile.primaryProblem,
        goal: authProfile.primaryGoal,
        systems: authProfile.prioritizedSystems,
        source: authProfile.source,
      },
      repeat: {
        problem: repeatProfile.primaryProblem,
        goal: repeatProfile.primaryGoal,
        systems: repeatProfile.prioritizedSystems,
        source: repeatProfile.source,
      },
    },
  };
}

async function run() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  INTENT DIFFERENTIATION TEST");
  console.log("═══════════════════════════════════════════════════════════\n");

  const result = await testIntentDiff();

  console.log("┌─── Authenticity-Focused Intent ───");
  console.log(`│  Problem: ${result.details.authenticity.problem}`);
  console.log(`│  Goal:    ${result.details.authenticity.goal}`);
  console.log(`│  Systems: ${result.details.authenticity.systems.join(", ")}`);
  console.log(`│  Source:  ${result.details.authenticity.source}`);
  console.log("│");
  console.log("┌─── Repeat-Customer-Focused Intent ───");
  console.log(`│  Problem: ${result.details.repeat.problem}`);
  console.log(`│  Goal:    ${result.details.repeat.goal}`);
  console.log(`│  Systems: ${result.details.repeat.systems.join(", ")}`);
  console.log(`│  Source:  ${result.details.repeat.source}`);
  console.log("│");

  console.log("┌─── Results ───");
  console.log(`│  ✅ Prompts differ: ${result.promptsMatch}`);
  console.log(`│  ${result.profileDiffers ? "✅" : "❌"} Intent profiles differ: ${result.profileDiffers}`);
  console.log(`│  ${result.heroDiffers ? "✅" : "❌"} Hero copy differs: ${result.heroDiffers}`);
  console.log("│");

  const allPass = result.promptsMatch && result.profileDiffers && result.heroDiffers;
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  OVERALL: ${allPass ? "✅ INTENTS PRODUCE DIFFERENT OUTPUT" : "❌ INTENTS IDENTICAL — NEED MORE RULES"}`);
  console.log("═══════════════════════════════════════════════════════════");

  process.exit(allPass ? 0 : 1);
}

run();
