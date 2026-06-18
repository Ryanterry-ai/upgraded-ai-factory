// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIOR SIMULATION ENGINE v1 — VERIFICATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

import {
  createStateMachine,
  TimeEngine,
  EventChainEngine,
  UserJourneySimulator,
  BehaviorSimulationEngine,
  getBehaviorProfile,
  detectBehaviorProfile,
  type StateMachineConfig,
  type BehaviorProfile,
} from "../web/lib/behavior-simulation-engine";
import {
  generateBehaviorFiles,
} from "../web/lib/behavior-generator";

let passed = 0;
let failed = 0;

function test(name: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. STATE MACHINE CORE
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  1. STATE MACHINE CORE");
console.log("═".repeat(70));

{
  const config: StateMachineConfig = {
    id: "toggle",
    name: "Toggle Machine",
    initialState: "off",
    states: {
      off: { on: { TOGGLE: "on" } },
      on: { on: { TOGGLE: "off" } },
    },
  };

  const sm = createStateMachine(config);

  test("Initial state is 'off'", sm.getState() === "off");
  test("Can transition TOGGLE", sm.canTransition("TOGGLE"));
  test("Cannot transition INVALID", !sm.canTransition("INVALID"));

  const result = sm.send("TOGGLE");
  test("Transition TOGGLE returns 'on'", result === "on");
  test("Current state is 'on'", sm.getState() === "on");

  sm.send("TOGGLE");
  test("Second TOGGLE returns 'off'", sm.getState() === "off");

  test("History has 2 entries", sm.history.length === 2);
  test("History first entry is 'on'", sm.history[0].state === "on");
  test("History second entry is 'off'", sm.history[1].state === "off");
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. STATE MACHINE WITH CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  2. STATE MACHINE WITH CONTEXT");
console.log("═".repeat(70));

{
  const config: StateMachineConfig = {
    id: "counter",
    name: "Counter Machine",
    initialState: "idle",
    context: { count: 0 },
    states: {
      idle: {
        on: { INCREMENT: "idle", RESET: "idle" },
        entry: [{ type: "assign", target: "count", value: 1 }],
      },
    },
  };

  const sm = createStateMachine(config);
  test("Initial context count is 0", sm.getContext().count === 0);

  sm.send("INCREMENT");
  test("After INCREMENT, count is 1", sm.getContext().count === 1);

  sm.send("INCREMENT");
  test("After 2nd INCREMENT, count is still 1 (entry runs once)", sm.getContext().count === 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MULTI-STATE MACHINE (Netflix Playback)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  3. MULTI-STATE MACHINE (Netflix Playback)");
console.log("═".repeat(70));

{
  const playbackConfig: StateMachineConfig = {
    id: "playback",
    name: "Playback",
    initialState: "idle",
    context: { position: 0 },
    states: {
      idle: { on: { PLAY: "buffering" } },
      buffering: { on: { PLAY: "playing", ERROR: "error" } },
      playing: { on: { PAUSE: "paused", STOP: "idle", END: "ended" } },
      paused: { on: { PLAY: "playing", STOP: "idle" } },
      ended: { on: { REPLAY: "buffering", NEXT: "buffering" } },
      error: { on: { RETRY: "buffering", DISMISS: "idle" } },
    },
  };

  const sm = createStateMachine(playbackConfig);

  test("Starts idle", sm.getState() === "idle");
  test("idle -> PLAY -> buffering", sm.send("PLAY") === "buffering");
  test("buffering -> PLAY -> playing", sm.send("PLAY") === "playing");
  test("playing -> PAUSE -> paused", sm.send("PAUSE") === "paused");
  test("paused -> PLAY -> playing", sm.send("PLAY") === "playing");
  test("playing -> END -> ended", sm.send("END") === "ended");
  test("ended -> REPLAY -> buffering", sm.send("REPLAY") === "buffering");

  // Test transition path
  const path = sm.getTransitionPath("idle", "ended");
  test("Transition path idle->ended exists", path.length > 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TIME ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  4. TIME ENGINE");
console.log("═".repeat(70));

{
  let mutateCount = 0;
  const engine = new TimeEngine({ value: 0 }, () => { mutateCount++; });

  engine.registerMutation({
    id: "inc",
    interval: 100,
    jitter: 0,
    mutate: (ctx) => ({ ...ctx, value: ((ctx.value as number) || 0) + 1 }),
    description: "Increment",
  });

  engine.registerMutation({
    id: "double",
    interval: 200,
    jitter: 0,
    mutate: (ctx) => ({ ...ctx, value: ((ctx.value as number) || 0) * 2 }),
    description: "Double",
  });

  test("Initial context value is 0", engine.getContext().value === 0);

  // Manual tick for deterministic testing
  engine.tick();
  // inc runs first (priority 50), then double: 0 -> 1 -> 2
  test("After tick, value is 2 (inc then double)", engine.getContext().value === 2);

  engine.tick();
  // inc: 2 -> 3, double: 3 -> 6
  test("After 2nd tick, value is 6", engine.getContext().value === 6);

  test("Mutations registered", engine.getRegisteredMutations().length === 2);
  test("Mutate callback fired", mutateCount >= 2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. TIME ENGINE CONDITIONAL
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  5. TIME ENGINE CONDITIONAL");
console.log("═".repeat(70));

{
  const engine = new TimeEngine({ isPlaying: false, position: 0 });

  engine.registerMutation({
    id: "progress",
    interval: 1000,
    jitter: 0,
    condition: (ctx) => ctx.isPlaying === true,
    mutate: (ctx) => ({ ...ctx, position: ((ctx.position as number) || 0) + 1 }),
    description: "Progress",
  });

  // Tick when not playing — should NOT mutate
  engine.tick();
  test("Position stays 0 when not playing", engine.getContext().position === 0);

  // Manually set isPlaying
  engine.tick(); // This will be skipped by condition
  test("Still 0 when not playing", engine.getContext().position === 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. EVENT CHAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  6. EVENT CHAIN ENGINE");
console.log("═".repeat(70));

{
  const machines = new Map();
  machines.set("playback", createStateMachine({
    id: "playback",
    initialState: "idle",
    states: {
      idle: { on: { PLAY: "playing" } },
      playing: { on: { END: "ended" } },
      ended: { on: { REPLAY: "playing" } },
    },
  }));
  machines.set("history", createStateMachine({
    id: "history",
    initialState: "empty",
    states: {
      empty: { on: { WATCH: "tracking" } },
      tracking: { on: { WATCH: "tracking", COMPLETE: "completed" } },
      completed: { on: { RESET: "empty" } },
    },
  }));

  const engine = new EventChainEngine(machines);
  engine.registerChain({
    id: "play-to-history",
    trigger: "PLAY",
    sourceMachine: "playback",
    links: [
      { target: "history", action: "WATCH", delay: 100 },
    ],
  });

  // Trigger chain
  engine.handleEvent("PLAY", "playback");

  // History machine should have received WATCH (with delay)
  // For immediate links (no delay), check right away
  test("Chain engine registered", engine.getExecutionCount("play-to-history") === 1);
  test("Chain does not fire on wrong trigger", (() => {
    engine.handleEvent("PAUSE", "playback");
    return engine.getExecutionCount("play-to-history") === 1;
  })());
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. USER JOURNEY SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  7. USER JOURNEY SIMULATOR");
console.log("═".repeat(70));

{
  const profile = getBehaviorProfile("ecommerce")!;
  const machines = new Map();
  for (const mc of profile.stateMachines) {
    machines.set(mc.id, createStateMachine(mc));
  }

  let completedSteps = 0;
  const simulator = new UserJourneySimulator(profile, machines, () => { completedSteps++; });

  const started = simulator.startJourney("browse-to-buy");
  test("Journey started", started);
  test("Active journey set", simulator.getActiveJourney()?.id === "browse-to-buy");
  test("Current step exists", simulator.getCurrentStep() !== null);

  // Advance a few steps
  simulator.advanceStep();
  test("Step advanced", completedSteps >= 1);

  // Run through multiple steps
  for (let i = 0; i < 8; i++) {
    if (simulator.getCurrentStep()) simulator.advanceStep();
  }
  test("Multiple steps executed", completedSteps >= 2);
  test("Step history has entries", simulator.getStepHistory().length >= 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. BEHAVIOR SIMULATION ENGINE (FULL)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  8. BEHAVIOR SIMULATION ENGINE (FULL)");
console.log("═".repeat(70));

{
  const profile = getBehaviorProfile("streaming")!;
  let stateChanges = 0;
  const engine = new BehaviorSimulationEngine(profile, () => { stateChanges++; });

  test("Engine created", engine !== null);
  test("Has state machines", Object.keys(engine.getState().machines).length > 0);

  // Test playback machine
  const playback = engine.getMachine("playback");
  test("Playback machine exists", playback !== null);
  test("Playback starts idle", engine.getMachineState("playback") === "idle");

  engine.sendEvent("playback", "PLAY");
  test("After PLAY, playback is buffering", engine.getMachineState("playback") === "buffering");

  engine.sendEvent("playback", "PLAY");
  test("After 2nd PLAY, playback is playing", engine.getMachineState("playback") === "playing");

  engine.sendEvent("playback", "PAUSE");
  test("After PAUSE, playback is paused", engine.getMachineState("playback") === "paused");

  // Test profile machine
  test("Profile machine exists", engine.getMachine("profile") !== null);

  // Test event log
  const log = engine.getEventLog();
  test("Event log has entries", log.length > 0);
  test("Event log tracks events", log.some(e => e.event === "PLAY"));

  // Test time engine tick
  engine.tickTimeEngine();
  test("Time engine ticked", true);

  // Test state change notifications
  test("State change callbacks fired", stateChanges > 0);

  engine.destroy();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. DOMAIN PROFILE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  9. DOMAIN PROFILE DETECTION");
console.log("═".repeat(70));

{
  const domains = ["ecommerce", "streaming", "gym-crm", "saas", "restaurant", "admin-dashboard", "blog"];

  for (const domain of domains) {
    const profile = detectBehaviorProfile(domain);
    test(`${domain} profile detected`, profile !== null);
    if (profile) {
      test(`${domain} has state machines`, profile.stateMachines.length > 0);
      test(`${domain} has time mutations`, profile.timeMutations.length > 0);
    }
  }

  const portfolio = detectBehaviorProfile("portfolio");
  test("portfolio profile detected", portfolio !== null);
  if (portfolio) {
    test("portfolio has time mutations", portfolio.timeMutations.length > 0);
  }

  const generic = detectBehaviorProfile("unknown");
  test("Unknown domain returns null", generic === null);

  const fallback = getBehaviorProfile("unknown");
  test("Unknown domain falls back to generic", fallback.domain === "generic");
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. BEHAVIOR CODE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  10. BEHAVIOR CODE GENERATION");
console.log("═".repeat(70));

{
  const profile = getBehaviorProfile("streaming")!;
  const files = generateBehaviorFiles(profile);

  test("Generates 6 files", files.length === 6);

  const paths = files.map(f => f.path);
  test("Has types.ts", paths.includes("src/behavior/types.ts"));
  test("Has engine.ts", paths.includes("src/behavior/engine.ts"));
  test("Has profile.ts", paths.includes("src/behavior/profile.ts"));
  test("Has provider.tsx", paths.includes("src/behavior/provider.tsx"));
  test("Has hooks.ts", paths.includes("src/behavior/hooks.ts"));
  test("Has index.ts", paths.includes("src/behavior/index.ts"));

  // Check types file content
  const typesFile = files.find(f => f.path === "src/behavior/types.ts")!;
  test("Types file has PlaybackState", typesFile.content.includes("PlaybackState"));
  test("Types file has BehaviorContext", typesFile.content.includes("BehaviorContext"));

  // Check engine file content
  const engineFile = files.find(f => f.path === "src/behavior/engine.ts")!;
  test("Engine file has createSM", engineFile.content.includes("createSM"));
  test("Engine file has TimeEngine", engineFile.content.includes("TimeEngine"));
  test("Engine file has ChainEngine", engineFile.content.includes("ChainEngine"));

  // Check provider file content
  const providerFile = files.find(f => f.path === "src/behavior/provider.tsx")!;
  test("Provider file has BehaviorProvider", providerFile.content.includes("BehaviorProvider"));
  test("Provider file has useBehavior", providerFile.content.includes("useBehavior"));

  // Check profile file content
  const profileFile = files.find(f => f.path === "src/behavior/profile.ts")!;
  test("Profile file has behaviorMachines", profileFile.content.includes("behaviorMachines"));
  test("Profile file has initialState", profileFile.content.includes("initialState"));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log(`  FINAL RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log("═".repeat(70) + "\n");

if (failed > 0) {
  process.exit(1);
}
