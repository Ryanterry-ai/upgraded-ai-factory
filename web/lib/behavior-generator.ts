// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIOR CODE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
// Generates the behavior/ directory with runtime code for generated apps.
// Output: types.ts, engine.ts, profiles.ts, provider.tsx, hooks.ts
// ═══════════════════════════════════════════════════════════════════════════════

import { BehaviorProfile, StateMachineConfig } from "./behavior-simulation-engine";

export interface BehaviorFileOutput {
  path: string;
  content: string;
  type: "config" | "typescript" | "react";
}

// ─── GENERATE ALL BEHAVIOR FILES ──────────────────────────────────────────────

export function generateBehaviorFiles(profile: BehaviorProfile): BehaviorFileOutput[] {
  return [
    { path: "src/behavior/types.ts", content: generateTypes(profile), type: "typescript" },
    { path: "src/behavior/engine.ts", content: generateEngine(), type: "typescript" },
    { path: "src/behavior/profile.ts", content: generateProfile(profile), type: "config" },
    { path: "src/behavior/provider.tsx", content: generateProvider(profile), type: "react" },
    { path: "src/behavior/hooks.ts", content: generateHooks(profile), type: "react" },
    { path: "src/behavior/index.ts", content: generateIndex(), type: "typescript" },
  ];
}

// ─── TYPES FILE ───────────────────────────────────────────────────────────────

function generateTypes(profile: BehaviorProfile): string {
  const machineStates = profile.stateMachines.map(m => {
    const states = Object.keys(m.states);
    return `// ${m.name}\nexport type ${capitalize(m.id)}State = ${states.map(s => `"${s}"`).join(" | ")};`;
  }).join("\n\n");

  return `// Behavior Simulation Types — Generated for ${profile.name}
// ═══════════════════════════════════════════════════════════════

${machineStates}

export interface StateMachine<T extends string> {
  state: T;
  context: Record<string, unknown>;
  send(event: string, payload?: unknown): T | null;
  can(event: string): boolean;
}

export interface TimeMutation {
  id: string;
  interval: number;
  active: boolean;
}

export interface BehaviorContext {
  machines: Record<string, StateMachine<string>>;
  globalContext: Record<string, unknown>;
  eventLog: BehaviorEvent[];
  startJourney(id: string): void;
  advanceJourney(): boolean;
}

export interface BehaviorEvent {
  event: string;
  source: string;
  target: string;
  timestamp: number;
  payload?: unknown;
}

export type DomainBehavior = "${profile.domain}";
`;
}

// ─── ENGINE FILE ──────────────────────────────────────────────────────────────

function generateEngine(): string {
  return `// Behavior Simulation Engine — Runtime for generated apps
// ═══════════════════════════════════════════════════════════════

import { StateMachine, BehaviorEvent } from "./types";

// ─── State Machine Factory ────────────────────────────────────────────────────

export function createSM<T extends string>(
  id: string,
  initial: T,
  states: Record<T, { on?: Record<string, T>; entry?: Array<(ctx: Record<string, unknown>) => void>; exit?: Array<(ctx: Record<string, unknown>) => void> }>,
  context: Record<string, unknown> = {}
): StateMachine<T> {
  let current = initial;
  const ctx = { ...context };
  const history: Array<{ state: T; event: string; time: number }> = [];

  return {
    get state() { return current; },
    get context() { return { ...ctx }; },

    send(event: string, payload?: unknown): T | null {
      const node = states[current];
      if (!node?.on?.[event]) return null;

      const target = node.on[event];

      // Exit actions
      node.exit?.forEach(fn => fn(ctx));

      current = target;

      // Entry actions
      states[current]?.entry?.forEach(fn => fn(ctx));

      history.push({ state: current, event, time: Date.now() });
      if (history.length > 100) history.shift();

      return current;
    },

    can(event: string): boolean {
      return !!states[current]?.on?.[event];
    },
  };
}

// ─── Time Engine ──────────────────────────────────────────────────────────────

export interface Mutation {
  id: string;
  interval: number;
  jitter?: number;
  active: boolean;
  condition?: (ctx: Record<string, unknown>) => boolean;
  mutate: (ctx: Record<string, unknown>) => Record<string, unknown>;
}

export class TimeEngine {
  private mutations: Mutation[] = [];
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private ctx: Record<string, unknown>;
  private onUpdate?: (ctx: Record<string, unknown>) => void;

  constructor(context: Record<string, unknown>, onUpdate?: (ctx: Record<string, unknown>) => void) {
    this.ctx = context;
    this.onUpdate = onUpdate;
  }

  add(mutation: Mutation): void {
    this.mutations.push(mutation);
  }

  start(): void {
    for (const m of this.mutations) {
      if (this.timers.has(m.id)) continue;
      const run = () => {
        if (!m.active) return;
        if (m.condition && !m.condition(this.ctx)) return;
        this.ctx = m.mutate(this.ctx);
        this.onUpdate?.(this.ctx);
      };
      const interval = m.jitter ? m.interval + (Math.random() - 0.5) * m.jitter * 2 : m.interval;
      this.timers.set(m.id, setInterval(run, Math.max(100, interval)));
    }
  }

  stop(): void {
    for (const [, t] of this.timers) clearInterval(t);
    this.timers.clear();
  }

  tick(): void {
    for (const m of this.mutations) {
      if (!m.active) continue;
      if (m.condition && !m.condition(this.ctx)) continue;
      this.ctx = m.mutate(this.ctx);
      this.onUpdate?.(this.ctx);
    }
  }

  get context() { return { ...this.ctx }; }
}

// ─── Event Chain Engine ───────────────────────────────────────────────────────

export interface ChainLink {
  target: string;
  action: string;
  delay?: number;
}

export interface EventChain {
  id: string;
  trigger: string;
  source: string;
  links: ChainLink[];
}

export class ChainEngine {
  private chains: EventChain[] = [];
  private machines: Map<string, StateMachine<unknown>>;

  constructor(machines: Map<string, StateMachine<unknown>>) {
    this.machines = machines;
  }

  register(chain: EventChain): void {
    this.chains.push(chain);
  }

  handle(event: string, sourceId: string): void {
    for (const chain of this.chains) {
      if (chain.trigger !== event || chain.source !== sourceId) continue;
      let delay = 0;
      for (const link of chain.links) {
        delay += link.delay ?? 0;
        const target = link.target === "self" ? this.machines.get(sourceId) : this.machines.get(link.target);
        if (!target) continue;
        if (delay > 0) {
          setTimeout(() => target.send(link.action), delay);
        } else {
          target.send(link.action);
        }
      }
    }
  }
}
`;
}

// ─── PROFILE FILE ─────────────────────────────────────────────────────────────

function generateProfile(profile: BehaviorProfile): string {
  const machines = profile.stateMachines.map(m => {
    const stateEntries = Object.entries(m.states).map(([name, node]) => {
      const onEntries = node.on ? `on: ${JSON.stringify(node.on)}` : "";
      return `    "${name}": { ${onEntries} }`;
    }).join(",\n");

    return `  {
    id: "${m.id}",
    name: "${m.name}",
    initialState: "${m.initialState}",
    context: ${JSON.stringify(m.context || {})},
    states: {
${stateEntries}
    }
  }`;
  }).join(",\n");

  const mutations = profile.timeMutations.map(mut => `  {
    id: "${mut.id}",
    interval: ${mut.interval},
    active: true,
    mutate: (ctx) => ctx, // Placeholder — actual mutation logic runs in engine
  }`).join(",\n");

  const chains = profile.eventChains.map(chain => `  {
    id: "${chain.id}",
    trigger: "${chain.trigger}",
    source: "${chain.sourceMachine || ""}",
    links: ${JSON.stringify(chain.links.map(l => ({ target: l.target, action: l.action, delay: l.delay })))},
  }`).join(",\n");

  return `// Behavior Profile — Generated for ${profile.name}
// ═══════════════════════════════════════════════════════════════

import { Mutation, EventChain } from "./engine";

export const behaviorMachines = [
${machines}
];

export const behaviorMutations: Mutation[] = [
${mutations}
];

export const behaviorChains: EventChain[] = [
${chains}
];

export const initialState = ${JSON.stringify(profile.initialState, null, 2)};
`;
}

// ─── PROVIDER FILE ────────────────────────────────────────────────────────────

function generateProvider(profile: BehaviorProfile): string {
  const machineImports = profile.stateMachines.map(m => m.id).join(", ");
  const machineCreations = profile.stateMachines.map(m => {
    const stateEntries = Object.entries(m.states).map(([name, node]) => {
      const onEntries = node.on ? `on: ${JSON.stringify(node.on)}` : "";
      return `      "${name}": { ${onEntries} }`;
    }).join(",\n");

    return `    "${m.id}": createSM("${m.id}", "${m.initialState}", {
${stateEntries}
    }, ${JSON.stringify(m.context || {})})`;
  }).join(",\n");

  return `// Behavior Provider — React Context for behavior simulation
// ═══════════════════════════════════════════════════════════════

"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { createSM, TimeEngine, ChainEngine } from "./engine";
import { behaviorMutations, behaviorChains, initialState } from "./profile";
import { BehaviorContext, BehaviorEvent } from "./types";

const BehaviorCtx = createContext<BehaviorContext | null>(null);

export function BehaviorProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  const machinesRef = useRef<Map<string, ReturnType<typeof createSM>>>(new Map());
  const timeRef = useRef<TimeEngine | null>(null);
  const chainRef = useRef<ChainEngine | null>(null);
  const eventLogRef = useRef<BehaviorEvent[]>([]);
  const globalCtxRef = useRef<Record<string, unknown>>({ ...initialState });

  useEffect(() => {
    // Create state machines
    const machines = new Map<string, ReturnType<typeof createSM>>();
${machineCreations}
    machinesRef.current = machines;

    // Create chain engine
    const chainEngine = new ChainEngine(machines as any);
    for (const chain of behaviorChains) {
      chainEngine.register(chain);
    }
    chainRef.current = chainEngine;

    // Create time engine
    const timeEngine = new TimeEngine(globalCtxRef.current, (ctx) => {
      globalCtxRef.current = ctx;
      setTick(t => t + 1);
    });
    for (const mutation of behaviorMutations) {
      timeEngine.add(mutation);
    }
    timeEngine.start();
    timeRef.current = timeEngine;

    return () => {
      timeEngine.stop();
      machines.clear();
    };
  }, []);

  const sendEvent = useCallback((machineId: string, event: string, payload?: unknown) => {
    const machine = machinesRef.current.get(machineId);
    if (!machine) return null;
    const result = machine.send(event, payload);
    chainRef.current?.handle(event, machineId);
    eventLogRef.current.push({
      event,
      source: machineId,
      target: result ?? machine.state,
      timestamp: Date.now(),
      payload,
    });
    if (eventLogRef.current.length > 200) eventLogRef.current = eventLogRef.current.slice(-200);
    setTick(t => t + 1);
    return result;
  }, []);

  const getMachineState = useCallback((id: string) => {
    return machinesRef.current.get(id);
  }, [tick]);

  const ctx: BehaviorContext = {
    machines: Object.fromEntries(machinesRef.current) as any,
    globalContext: globalCtxRef.current,
    eventLog: eventLogRef.current,
    startJourney: () => {},
    advanceJourney: () => false,
  };

  return (
    <BehaviorCtx.Provider value={ctx}>
      {children}
    </BehaviorCtx.Provider>
  );
}

export function useBehavior(): BehaviorContext {
  const ctx = useContext(BehaviorCtx);
  if (!ctx) throw new Error("useBehavior must be used within BehaviorProvider");
  return ctx;
}

export { createSM, TimeEngine, ChainEngine };
`;
}

// ─── HOOKS FILE ───────────────────────────────────────────────────────────────

function generateHooks(profile: BehaviorProfile): string {
  const machineHooks = profile.stateMachines.map(m => {
    const stateType = capitalize(m.id) + "State";
    return `// ─── ${m.name} Hook ─────────────────────────────────────────────────────

export function use${capitalize(m.id)}() {
  const { machines, eventLog } = useBehavior();
  const machine = machines["${m.id}"] as StateMachine<${stateType}> | undefined;

  const send = useCallback((event: string, payload?: unknown) => {
    if (!machine) return null;
    return machine.send(event, payload);
  }, [machine]);

  return {
    state: machine?.state ?? "${m.initialState}",
    context: machine?.context ?? {},
    send,
    can: (event: string) => machine?.can(event) ?? false,
    recentEvents: eventLog.filter(e => e.source === "${m.id}").slice(-10),
  };
}`;
  }).join("\n\n");

  return `// Behavior Hooks — Domain-specific hooks for each state machine
// ═══════════════════════════════════════════════════════════════

"use client";

import { useCallback } from "react";
import { useBehavior } from "./provider";
import { StateMachine } from "./types";

${machineHooks}

// ─── Global Behavior Hook ────────────────────────────────────────────────────

export function useGlobalBehavior() {
  const { globalContext, eventLog } = useBehavior();

  return {
    context: globalContext,
    recentEvents: eventLog.slice(-20),
    totalEvents: eventLog.length,
  };
}

// ─── Time Mutation Hook ──────────────────────────────────────────────────────

export function useTimeMutation(mutationId: string) {
  const { globalContext } = useBehavior();
  const mutation = globalContext[mutationId];
  return mutation ?? null;
}
`;
}

// ─── INDEX FILE ───────────────────────────────────────────────────────────────

function generateIndex(): string {
  return `// Behavior Simulation — Public API
// ═══════════════════════════════════════════════════════════════

export { BehaviorProvider, useBehavior } from "./provider";
export * from "./hooks";
export * from "./types";
export * from "./engine";
export { behaviorMachines, behaviorMutations, behaviorChains, initialState } from "./profile";
`;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
