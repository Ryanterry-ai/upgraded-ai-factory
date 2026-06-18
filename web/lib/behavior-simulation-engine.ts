// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIOR SIMULATION ENGINE v1 (BSE)
// ═══════════════════════════════════════════════════════════════════════════════
// Connects SSE state transitions, RPSE mutations, workflow execution, and UI
// reactivity into a unified runtime behavioral system simulator.
//
// Makes generated apps "truly alive" — Netflix actually plays content, ecommerce
// carts mutate in real-time, CRM pipelines advance through stages, SaaS dashboards
// evolve usage metrics.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CORE TYPES ───────────────────────────────────────────────────────────────

export interface StateNode {
  on?: Record<string, string>;       // event name -> target state
  entry?: StateAction[];              // actions on enter
  exit?: StateAction[];               // actions on exit
  meta?: Record<string, unknown>;     // state metadata
  depth?: number;                     // nesting depth for sub-states
}

export interface StateAction {
  type: "assign" | "emit" | "delay" | "guard" | "invoke";
  target?: string;                    // for assign: path to set
  value?: unknown;                    // for assign: value to set
  event?: string;                     // for emit: event name
  duration?: number;                  // for delay: ms
  condition?: string;                 // for guard: condition name
  service?: string;                   // for invoke: service name
}

export interface StateMachineConfig {
  id: string;
  name: string;
  initialState: string;
  states: Record<string, StateNode>;
  context?: Record<string, unknown>;  // initial context
  guards?: Record<string, (ctx: Record<string, unknown>) => boolean>;
  actions?: Record<string, (ctx: Record<string, unknown>, payload?: unknown) => Record<string, unknown>>;
}

export interface StateMachineInstance {
  id: string;
  config: StateMachineConfig;
  currentState: string;
  context: Record<string, unknown>;
  history: Array<{ state: string; event: string; timestamp: number }>;
  send(event: string, payload?: unknown): string | null;
  getState(): string;
  getContext(): Record<string, unknown>;
  canTransition(event: string): boolean;
  getTransitionPath(from: string, to: string): string[];
}

export interface TimeMutation {
  id: string;
  name: string;
  interval: number;                    // ms between mutations
  jitter?: number;                     // random ± ms variance
  condition?: (ctx: Record<string, unknown>) => boolean;
  mutate: (ctx: Record<string, unknown>) => Record<string, unknown>;
  description: string;
  priority?: number;                   // lower = runs first
}

export interface EventChainLink {
  target: string;                      // state machine ID or "self"
  action: string;                      // event to send
  payload?: Record<string, unknown>;
  delay?: number;                      // ms delay before firing
  condition?: string;                  // guard condition name
}

export interface EventChain {
  id: string;
  name: string;
  trigger: string;                     // event that triggers chain
  sourceMachine?: string;              // which state machine triggers it
  links: EventChainLink[];
  maxExecutions?: number;              // prevent infinite loops
  cooldown?: number;                   // ms between executions
}

export interface UserJourneyStep {
  id: string;
  action: string;
  target?: string;                     // component or route
  payload?: Record<string, unknown>;
  expectedOutcome?: string;
  probability?: number;                // 0-1, for branching
  nextStep?: string;                   // step ID to go to
  alternativeStep?: string;            // if probability fails
  timeout?: number;                    // ms to wait before auto-advance
}

export interface UserJourney {
  id: string;
  name: string;
  description: string;
  domain: string;
  steps: UserJourneyStep[];
  entryPoint?: string;                 // first step ID
  loopable?: boolean;                  // can restart from end
}

export interface BehaviorProfile {
  domain: string;
  name: string;
  description: string;
  stateMachines: StateMachineConfig[];
  timeMutations: TimeMutation[];
  eventChains: EventChain[];
  userJourneys: UserJourney[];
  initialState: Record<string, unknown>; // global behavior context
}

export interface BehaviorState {
  machines: Record<string, StateMachineInstance>;
  activeJourney: string | null;
  journeyStep: string | null;
  globalContext: Record<string, unknown>;
  eventLog: Array<{ event: string; source: string; target: string; timestamp: number; payload?: unknown }>;
  mutationTimers: ReturnType<typeof setInterval>[];
}

// ─── STATE MACHINE RUNTIME ────────────────────────────────────────────────────

export function createStateMachine(config: StateMachineConfig): StateMachineInstance {
  const context = { ...config.context };
  let currentState = config.initialState;
  const history: StateMachineInstance["history"] = [];

  const machine: StateMachineInstance = {
    id: config.id,
    config,
    currentState,
    context,
    history,

    send(event: string, payload?: unknown): string | null {
      const stateNode = config.states[currentState];
      if (!stateNode?.on?.[event]) return null;

      const targetState = stateNode.on[event];

      // Check guard if present
      const guardAction = stateNode.exit?.find(a => a.type === "guard");
      if (guardAction?.condition && config.guards?.[guardAction.condition]) {
        if (!config.guards[guardAction.condition](context)) return null;
      }

      // Execute exit actions
      if (stateNode.exit) {
        for (const action of stateNode.exit) {
          executeAction(action, context, config);
        }
      }

      const prevState = currentState;
      currentState = targetState;
      machine.currentState = currentState;

      // Execute entry actions
      const targetNode = config.states[currentState];
      if (targetNode?.entry) {
        for (const action of targetNode.entry) {
          executeAction(action, context, config);
        }
      }

      // Log transition
      history.push({ state: currentState, event, timestamp: Date.now() });
      if (history.length > 100) history.shift();

      return currentState;
    },

    getState(): string {
      return currentState;
    },

    getContext(): Record<string, unknown> {
      return { ...context };
    },

    canTransition(event: string): boolean {
      const stateNode = config.states[currentState];
      return !!stateNode?.on?.[event];
    },

    getTransitionPath(from: string, to: string): string[] {
      const visited = new Set<string>();
      const path: string[] = [];

      function dfs(current: string): boolean {
        if (current === to) { path.push(current); return true; }
        if (visited.has(current)) return false;
        visited.add(current);

        const node = config.states[current];
        if (!node?.on) return false;

        for (const [, target] of Object.entries(node.on)) {
          if (dfs(target)) { path.unshift(current); return true; }
        }
        return false;
      }

      dfs(from);
      return path;
    },
  };

  return machine;
}

function executeAction(action: StateAction, ctx: Record<string, unknown>, config: StateMachineConfig): void {
  switch (action.type) {
    case "assign":
      if (action.target && action.value !== undefined) {
        const parts = action.target.split(".");
        let obj: any = ctx;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = action.value;
      }
      break;
    case "emit":
      // Emitting is handled by the engine's event bus
      break;
    case "delay":
      // Delayed actions are queued by the engine
      break;
  }
}

// ─── TIME ENGINE ──────────────────────────────────────────────────────────────

export class TimeEngine {
  private mutations: TimeMutation[] = [];
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private ctx: Record<string, unknown>;
  private onMutate?: (ctx: Record<string, unknown>) => void;

  constructor(context: Record<string, unknown>, onMutate?: (ctx: Record<string, unknown>) => void) {
    this.ctx = context;
    this.onMutate = onMutate;
  }

  registerMutation(mutation: TimeMutation): void {
    this.mutations.push(mutation);
    this.mutations.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
  }

  start(): void {
    for (const mutation of this.mutations) {
      if (this.timers.has(mutation.id)) continue;

      const run = () => {
        if (mutation.condition && !mutation.condition(this.ctx)) return;
        this.ctx = mutation.mutate(this.ctx);
        this.onMutate?.(this.ctx);
      };

      const interval = mutation.jitter
        ? mutation.interval + Math.floor((Math.random() - 0.5) * mutation.jitter * 2)
        : mutation.interval;

      this.timers.set(mutation.id, setInterval(run, Math.max(100, interval)));
    }
  }

  stop(): void {
    for (const [id, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  tick(): void {
    // Manual tick for deterministic testing
    for (const mutation of this.mutations) {
      if ((mutation as any).active === false) continue;
      if (mutation.condition && !mutation.condition(this.ctx)) continue;
      this.ctx = mutation.mutate(this.ctx);
      this.onMutate?.(this.ctx);
    }
  }

  getContext(): Record<string, unknown> {
    return { ...this.ctx };
  }

  getRegisteredMutations(): TimeMutation[] {
    return [...this.mutations];
  }
}

// ─── EVENT CHAIN ENGINE ───────────────────────────────────────────────────────

export class EventChainEngine {
  private chains: EventChain[] = [];
  private executionCounts: Map<string, number> = new Map();
  private lastExecution: Map<string, number> = new Map();
  private machines: Map<string, StateMachineInstance>;

  constructor(machines: Map<string, StateMachineInstance>) {
    this.machines = machines;
  }

  registerChain(chain: EventChain): void {
    this.chains.push(chain);
  }

  handleEvent(event: string, sourceMachineId: string, payload?: unknown): void {
    for (const chain of this.chains) {
      if (chain.trigger !== event) continue;
      if (chain.sourceMachine && chain.sourceMachine !== sourceMachineId) continue;

      // Check cooldown
      const lastExec = this.lastExecution.get(chain.id) ?? 0;
      if (chain.cooldown && Date.now() - lastExec < chain.cooldown) continue;

      // Check max executions
      const execCount = this.executionCounts.get(chain.id) ?? 0;
      if (chain.maxExecutions && execCount >= chain.maxExecutions) continue;

      // Execute chain
      this.executeChain(chain, payload);
      this.executionCounts.set(chain.id, execCount + 1);
      this.lastExecution.set(chain.id, Date.now());
    }
  }

  private executeChain(chain: EventChain, initialPayload?: unknown): void {
    let delay = 0;
    for (const link of chain.links) {
      delay += link.delay ?? 0;

      const targetMachine = link.target === "self"
        ? this.machines.get(chain.sourceMachine ?? "")
        : this.machines.get(link.target);

      if (!targetMachine) continue;

      // Check condition
      if (link.condition) {
        const guards = targetMachine.config.guards;
        if (guards?.[link.condition] && !guards[link.condition](targetMachine.getContext())) {
          continue;
        }
      }

      if (delay > 0) {
        setTimeout(() => {
          targetMachine.send(link.action, link.payload ?? initialPayload);
        }, delay);
      } else {
        targetMachine.send(link.action, link.payload ?? initialPayload);
      }
    }
  }

  getExecutionCount(chainId: string): number {
    return this.executionCounts.get(chainId) ?? 0;
  }

  reset(): void {
    this.executionCounts.clear();
    this.lastExecution.clear();
  }
}

// ─── USER JOURNEY SIMULATOR ───────────────────────────────────────────────────

export class UserJourneySimulator {
  private profile: BehaviorProfile;
  private machines: Map<string, StateMachineInstance>;
  private activeJourney: UserJourney | null = null;
  private currentStep: UserJourneyStep | null = null;
  private stepHistory: Array<{ step: string; timestamp: number; outcome: string }> = [];
  private onStepComplete?: (step: UserJourneyStep, outcome: string) => void;

  constructor(
    profile: BehaviorProfile,
    machines: Map<string, StateMachineInstance>,
    onStepComplete?: (step: UserJourneyStep, outcome: string) => void
  ) {
    this.profile = profile;
    this.machines = machines;
    this.onStepComplete = onStepComplete;
  }

  startJourney(journeyId: string): boolean {
    const journey = this.profile.userJourneys.find(j => j.id === journeyId);
    if (!journey) return false;

    this.activeJourney = journey;
    this.currentStep = journey.steps.find(s => s.id === journey.entryPoint) ?? journey.steps[0];
    this.stepHistory = [];
    this.executeCurrentStep();
    return true;
  }

  private executeCurrentStep(): void {
    if (!this.currentStep || !this.activeJourney) return;

    const step = this.currentStep;

    // Determine outcome based on probability
    const outcome = (step.probability === undefined || Math.random() < step.probability)
      ? "success"
      : "alternative";

    // Execute action on target machine
    if (step.target) {
      const machine = this.machines.get(step.target);
      if (machine) {
        machine.send(step.action, step.payload);
      }
    }

    // Log step
    this.stepHistory.push({ step: step.id, timestamp: Date.now(), outcome });
    this.onStepComplete?.(step, outcome);

    // Advance to next step
    if (outcome === "success" && step.nextStep) {
      this.currentStep = this.activeJourney.steps.find(s => s.id === step.nextStep) ?? null;
    } else if (outcome === "alternative" && step.alternativeStep) {
      this.currentStep = this.activeJourney.steps.find(s => s.id === step.alternativeStep) ?? null;
    } else {
      // End of journey
      this.currentStep = null;
      if (this.activeJourney.loopable) {
        this.currentStep = this.activeJourney.steps.find(s => s.id === this.activeJourney!.entryPoint) ?? this.activeJourney.steps[0];
      }
    }

    // Auto-advance after timeout
    if (this.currentStep?.timeout) {
      setTimeout(() => this.executeCurrentStep(), this.currentStep!.timeout!);
    }
  }

  advanceStep(): boolean {
    if (!this.currentStep) return false;
    this.executeCurrentStep();
    return true;
  }

  getActiveJourney(): UserJourney | null {
    return this.activeJourney;
  }

  getCurrentStep(): UserJourneyStep | null {
    return this.currentStep;
  }

  getStepHistory(): Array<{ step: string; timestamp: number; outcome: string }> {
    return [...this.stepHistory];
  }

  isComplete(): boolean {
    return this.activeJourney !== null && this.currentStep === null;
  }
}

// ─── BEHAVIOR SIMULATION ENGINE ───────────────────────────────────────────────

export class BehaviorSimulationEngine {
  private profile: BehaviorProfile;
  private machines: Map<string, StateMachineInstance> = new Map();
  private timeEngine: TimeEngine;
  private chainEngine: EventChainEngine;
  private journeySimulator: UserJourneySimulator | null = null;
  private state: BehaviorState;
  private onStateChange?: (state: BehaviorState) => void;

  constructor(profile: BehaviorProfile, onStateChange?: (state: BehaviorState) => void) {
    this.profile = profile;
    this.onStateChange = onStateChange;

    // Create state machines
    for (const config of profile.stateMachines) {
      this.machines.set(config.id, createStateMachine(config));
    }

    // Initialize time engine with profile's initial state
    this.timeEngine = new TimeEngine({ ...profile.initialState }, (ctx) => {
      this.state.globalContext = ctx;
      this.notifyChange();
    });

    // Register time mutations
    for (const mutation of profile.timeMutations) {
      this.timeEngine.registerMutation(mutation);
    }

    // Initialize event chain engine
    this.chainEngine = new EventChainEngine(this.machines);

    // Register event chains
    for (const chain of profile.eventChains) {
      this.chainEngine.registerChain(chain);
    }

    // Initialize journey simulator
    this.journeySimulator = new UserJourneySimulator(profile, this.machines, (step, outcome) => {
      this.state.eventLog.push({
        event: `journey.step.${outcome}`,
        source: "journey",
        target: step.target ?? "self",
        timestamp: Date.now(),
        payload: { step: step.id, action: step.action },
      });
      this.notifyChange();
    });

    // Initialize state
    this.state = {
      machines: Object.fromEntries(this.machines),
      activeJourney: null,
      journeyStep: null,
      globalContext: { ...profile.initialState },
      eventLog: [],
      mutationTimers: [],
    };
  }

  // ─── Machine Access ─────────────────────────────────────────────────────

  getMachine(id: string): StateMachineInstance | undefined {
    return this.machines.get(id);
  }

  sendEvent(machineId: string, event: string, payload?: unknown): string | null {
    const machine = this.machines.get(machineId);
    if (!machine) return null;

    const result = machine.send(event, payload);

    // Trigger event chains
    this.chainEngine.handleEvent(event, machineId, payload);

    // Log event
    this.state.eventLog.push({
      event,
      source: machineId,
      target: result ?? machine.getState(),
      timestamp: Date.now(),
      payload,
    });

    if (this.state.eventLog.length > 500) {
      this.state.eventLog = this.state.eventLog.slice(-500);
    }

    this.notifyChange();
    return result;
  }

  // ─── Time Mutations ─────────────────────────────────────────────────────

  startTimeEngine(): void {
    this.timeEngine.start();
  }

  stopTimeEngine(): void {
    this.timeEngine.stop();
  }

  tickTimeEngine(): void {
    this.timeEngine.tick();
    this.state.globalContext = this.timeEngine.getContext();
    this.notifyChange();
  }

  // ─── User Journeys ──────────────────────────────────────────────────────

  startJourney(journeyId: string): boolean {
    if (!this.journeySimulator) return false;
    const result = this.journeySimulator.startJourney(journeyId);
    if (result) {
      this.state.activeJourney = journeyId;
      this.state.journeyStep = this.journeySimulator.getCurrentStep()?.id ?? null;
      this.notifyChange();
    }
    return result;
  }

  advanceJourney(): boolean {
    if (!this.journeySimulator) return false;
    const result = this.journeySimulator.advanceStep();
    if (result) {
      this.state.journeyStep = this.journeySimulator.getCurrentStep()?.id ?? null;
      if (this.journeySimulator.isComplete()) {
        this.state.activeJourney = null;
        this.state.journeyStep = null;
      }
      this.notifyChange();
    }
    return result;
  }

  // ─── State Access ───────────────────────────────────────────────────────

  getState(): BehaviorState {
    return {
      ...this.state,
      machines: Object.fromEntries(this.machines),
    };
  }

  getMachineState(machineId: string): string | null {
    return this.machines.get(machineId)?.getState() ?? null;
  }

  getMachineContext(machineId: string): Record<string, unknown> | null {
    return this.machines.get(machineId)?.getContext() ?? null;
  }

  getGlobalContext(): Record<string, unknown> {
    return { ...this.timeEngine.getContext() };
  }

  getEventLog(limit?: number): BehaviorState["eventLog"] {
    const log = this.state.eventLog;
    return limit ? log.slice(-limit) : log;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  start(): void {
    this.startTimeEngine();
  }

  stop(): void {
    this.stopTimeEngine();
  }

  destroy(): void {
    this.stop();
    this.machines.clear();
    this.state.mutationTimers.forEach(t => clearInterval(t));
  }

  private notifyChange(): void {
    this.onStateChange?.(this.getState());
  }
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

export function detectBehaviorProfile(domain: string): BehaviorProfile | null {
  const profiles: Record<string, BehaviorProfile> = {
    "ecommerce": ECOMMERCE_BEHAVIORS,
    "streaming": STREAMING_BEHAVIORS,
    "gym-crm": GYM_CRM_BEHAVIORS,
    "saas": SAAS_BEHAVIORS,
    "restaurant": RESTAURANT_BEHAVIORS,
    "admin-dashboard": ADMIN_DASHBOARD_BEHAVIORS,
    "blog": BLOG_BEHAVIORS,
    "portfolio": PORTFOLIO_BEHAVIORS,
  };
  return profiles[domain] ?? null;
}

export function getBehaviorProfile(domain: string): BehaviorProfile {
  return detectBehaviorProfile(domain) ?? GENERIC_BEHAVIORS;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN BEHAVIOR PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── STREAMING / NETFLIX ──────────────────────────────────────────────────────

const STREAMING_BEHAVIORS: BehaviorProfile = {
  domain: "streaming",
  name: "Streaming Platform Behaviors",
  description: "Netflix-like behavior: playback state, watch history, recommendations, profile switching",
  initialState: {
    currentProfile: null,
    currentContent: null,
    playbackPosition: 0,
    isPlaying: false,
    volume: 0.8,
    autoplay: true,
    watchHistory: [],
    recommendationScore: {},
    contentProgress: {},
    bingeMode: false,
    lastCategory: null,
    searchQuery: "",
    myListItemCount: 0,
  },
  stateMachines: [
    {
      id: "playback",
      name: "Playback State Machine",
      initialState: "idle",
      context: { position: 0, duration: 0, playbackRate: 1 },
      states: {
        idle: {
          on: { PLAY: "buffering", SELECT_CONTENT: "idle" },
          entry: [{ type: "assign", target: "position", value: 0 }],
        },
        buffering: {
          on: { PLAY: "playing", ERROR: "error" },
          entry: [{ type: "assign", target: "isBuffering", value: true }],
          exit: [{ type: "assign", target: "isBuffering", value: false }],
        },
        playing: {
          on: { PAUSE: "paused", STOP: "idle", END: "ended", SEEK: "playing", BUFFER: "buffering" },
          entry: [{ type: "assign", target: "isPlaying", value: true }],
          exit: [{ type: "assign", target: "isPlaying", value: false }],
        },
        paused: {
          on: { PLAY: "playing", STOP: "idle", SEEK: "paused" },
          entry: [{ type: "assign", target: "isPlaying", value: false }],
        },
        ended: {
          on: { PLAY: "buffering", REPLAY: "buffering", NEXT: "buffering" },
          entry: [{ type: "assign", target: "position", value: 0 }],
        },
        error: {
          on: { RETRY: "buffering", DISMISS: "idle" },
        },
      },
    },
    {
      id: "profile",
      name: "Profile State Machine",
      initialState: "no_profile",
      context: { profileId: null, watchHistory: [], preferences: {} },
      states: {
        no_profile: {
          on: { SELECT_PROFILE: "loading_profile", CREATE_PROFILE: "creating" },
        },
        loading_profile: {
          on: { PROFILE_LOADED: "active", PROFILE_ERROR: "no_profile" },
        },
        active: {
          on: { SWITCH_PROFILE: "switching", LOGOUT: "no_profile", VIEW_PROFILE: "viewing" },
          entry: [{ type: "assign", target: "lastActive", value: Date.now() }],
        },
        switching: {
          on: { SELECT_PROFILE: "loading_profile", CANCEL: "active" },
        },
        creating: {
          on: { PROFILE_CREATED: "active", CREATE_ERROR: "no_profile" },
        },
        viewing: {
          on: { EDIT_PROFILE: "editing", BACK: "active" },
        },
        editing: {
          on: { SAVE: "active", CANCEL: "viewing" },
        },
      },
    },
    {
      id: "recommendation",
      name: "Recommendation Engine State",
      initialState: "cold_start",
      context: { userInteractions: 0, genreScores: {}, lastUpdated: null },
      states: {
        cold_start: {
          on: { FIRST_WATCH: "warming", POPULAR_CONTENT: "warming" },
          entry: [{ type: "assign", target: "userInteractions", value: 0 }],
        },
        warming: {
          on: { WATCH: "learning", RATE: "learning", SEARCH: "learning" },
          entry: [{ type: "assign", target: "userInteractions", value: "ctx.userInteractions + 1" }],
        },
        learning: {
          on: { WATCH: "learning", RATE: "learning", PATTERN_DETECTED: "personalized" },
        },
        personalized: {
          on: { WATCH: "learning", RATE: "learning", PROFILE_SWITCH: "warming" },
          entry: [{ type: "assign", target: "lastUpdated", value: Date.now() }],
        },
      },
    },
    {
      id: "watchHistory",
      name: "Watch History State Machine",
      initialState: "empty",
      context: { entries: [], totalWatchTime: 0, completedCount: 0 },
      states: {
        empty: {
          on: { FIRST_WATCH: "tracking" },
        },
        tracking: {
          on: { WATCH: "tracking", PAUSE: "tracking", COMPLETE: "tracking", BINGE: "binge" },
          entry: [{ type: "assign", target: "entries", value: "ctx.entries + [newEntry]" }],
        },
        binge: {
          on: { WATCH: "binge", PAUSE: "tracking", COMPLETE: "binge", STOP: "tracking" },
          entry: [{ type: "assign", target: "bingeMode", value: true }],
        },
      },
    },
    {
      id: "search",
      name: "Search State Machine",
      initialState: "idle",
      context: { query: "", results: [], filters: {} },
      states: {
        idle: {
          on: { SEARCH: "searching", FOCUS: "idle" },
        },
        searching: {
          on: { RESULTS: "results", ERROR: "idle", CLEAR: "idle" },
          entry: [{ type: "assign", target: "isSearching", value: true }],
          exit: [{ type: "assign", target: "isSearching", value: false }],
        },
        results: {
          on: { SEARCH: "searching", CLEAR: "idle", FILTER: "results", SELECT: "idle" },
        },
      },
    },
  ],
  timeMutations: [
    {
      id: "playback-progress",
      name: "Playback Progress",
      interval: 1000,
      jitter: 200,
      condition: (ctx) => ctx.isPlaying === true,
      mutate: (ctx) => ({
        ...ctx,
        playbackPosition: ((ctx.playbackPosition as number) || 0) + 1,
        totalWatchTime: ((ctx.totalWatchTime as number) || 0) + 1,
      }),
      description: "Advances playback position every second when playing",
      priority: 10,
    },
    {
      id: "recommendation-evolution",
      name: "Recommendation Evolution",
      interval: 30000,
      condition: (ctx) => ((ctx.watchHistory as unknown[])?.length ?? 0) > 3,
      mutate: (ctx) => {
        const history = (ctx.watchHistory as Array<{ genre: string; rating: number }>) || [];
        const genreScores = { ...(ctx.genreScores as Record<string, number>) || {} };
        for (const entry of history.slice(-5)) {
          const genre = entry.genre;
          genreScores[genre] = (genreScores[genre] || 0) + entry.rating * 0.1;
        }
        return { ...ctx, genreScores, lastRecommendationUpdate: Date.now() };
      },
      description: "Updates genre preference scores based on recent watch history",
      priority: 50,
    },
    {
      id: "trending-shift",
      name: "Trending Content Shift",
      interval: 60000,
      mutate: (ctx) => ({
        ...ctx,
        trendingOffset: ((ctx.trendingOffset as number) || 0) + 1,
        lastTrendingUpdate: Date.now(),
      }),
      description: "Shifts trending content list periodically",
      priority: 80,
    },
    {
      id: "binge-detection",
      name: "Binge Mode Detection",
      interval: 10000,
      condition: (ctx) => ((ctx.consecutiveWatches as number) || 0) >= 3,
      mutate: (ctx) => ({
        ...ctx,
        bingeMode: true,
        autoplay: true,
        nextEpisodeAutoplay: true,
      }),
      description: "Enables binge mode after 3+ consecutive watches",
      priority: 20,
    },
    {
      id: "watch-streak",
      name: "Watch Streak Tracker",
      interval: 5000,
      mutate: (ctx) => {
        const lastWatch = (ctx.lastWatchTime as number) || 0;
        const now = Date.now();
        const hoursSinceLastWatch = (now - lastWatch) / (1000 * 60 * 60);
        let streak = (ctx.watchStreak as number) || 0;
        if (hoursSinceLastWatch > 24) streak = 0;
        return { ...ctx, watchStreak: streak, lastWatchTime: now };
      },
      description: "Tracks daily watch streak",
      priority: 90,
    },
  ],
  eventChains: [
    {
      id: "play-to-history",
      name: "Play to Watch History",
      trigger: "PLAY",
      sourceMachine: "playback",
      links: [
        { target: "watchHistory", action: "WATCH", delay: 100 },
        { target: "recommendation", action: "WATCH", delay: 500 },
      ],
    },
    {
      id: "complete-to-next",
      name: "Complete to Auto-Play Next",
      trigger: "END",
      sourceMachine: "playback",
      links: [
        { target: "watchHistory", action: "COMPLETE", delay: 200 },
        { target: "playback", action: "NEXT", delay: 5000, condition: "autoplayEnabled" },
      ],
    },
    {
      id: "profile-switch-to-history",
      name: "Profile Switch Reloads History",
      trigger: "PROFILE_LOADED",
      sourceMachine: "profile",
      links: [
        { target: "watchHistory", action: "LOAD", delay: 100 },
        { target: "recommendation", action: "PROFILE_SWITCH", delay: 200 },
      ],
    },
  ],
  userJourneys: [
    {
      id: "first-time-user",
      name: "First Time User Journey",
      description: "New user discovers content and watches first video",
      domain: "streaming",
      entryPoint: "browse",
      steps: [
        { id: "browse", action: "VIEW_HOME", target: "profile", nextStep: "select-profile", probability: 0.9 },
        { id: "select-profile", action: "SELECT_PROFILE", target: "profile", nextStep: "browse-content", probability: 0.95 },
        { id: "browse-content", action: "SCROLL", target: "recommendation", nextStep: "search", probability: 0.8 },
        { id: "search", action: "SEARCH", target: "search", nextStep: "select-content", probability: 0.7 },
        { id: "select-content", action: "SELECT_CONTENT", target: "playback", nextStep: "play", probability: 0.85 },
        { id: "play", action: "PLAY", target: "playback", nextStep: "watch", probability: 0.9 },
        { id: "watch", action: "PAUSE", target: "playback", nextStep: "rate", probability: 0.6, timeout: 30000 },
        { id: "rate", action: "RATE", target: "recommendation", probability: 0.4, alternativeStep: "end" },
        { id: "end", action: "LOGOUT", target: "profile", probability: 1.0 },
      ],
      loopable: true,
    },
    {
      id: "binge-session",
      name: "Binge Watching Session",
      description: "User watches multiple episodes in sequence",
      domain: "streaming",
      entryPoint: "start",
      steps: [
        { id: "start", action: "SELECT_CONTENT", target: "playback", nextStep: "play", probability: 1.0 },
        { id: "play", action: "PLAY", target: "playback", nextStep: "watch", probability: 1.0 },
        { id: "watch", action: "END", target: "playback", nextStep: "auto-next", probability: 0.8, timeout: 60000 },
        { id: "auto-next", action: "NEXT", target: "playback", nextStep: "play", probability: 0.9 },
      ],
      loopable: true,
    },
  ],
};

// ─── ECOMMERCE ────────────────────────────────────────────────────────────────

const ECOMMERCE_BEHAVIORS: BehaviorProfile = {
  domain: "ecommerce",
  name: "Ecommerce Store Behaviors",
  description: "Shopping behaviors: cart mutations, inventory tracking, wishlist, price monitoring",
  initialState: {
    cart: { items: [], total: 0, itemCount: 0 },
    wishlist: [],
    recentlyViewed: [],
    searchHistory: [],
    cartAbandoned: false,
    lastCartUpdate: null,
    priceAlerts: [],
    stockAlerts: [],
    checkoutStep: null,
    appliedCoupon: null,
    shippingMethod: null,
    guestSession: true,
  },
  stateMachines: [
    {
      id: "cart",
      name: "Shopping Cart State Machine",
      initialState: "empty",
      context: { items: [], total: 0, itemCount: 0 },
      states: {
        empty: {
          on: { ADD_ITEM: "has_items" },
          entry: [{ type: "assign", target: "total", value: 0 }],
        },
        has_items: {
          on: { ADD_ITEM: "has_items", REMOVE_ITEM: "has_items", CLEAR: "empty", CHECKOUT: "checkout", SAVE_FOR_LATER: "has_items" },
        },
        checkout: {
          on: { BACK_TO_CART: "has_items", SUBMIT_ORDER: "processing", CANCEL: "has_items" },
        },
        processing: {
          on: { ORDER_SUCCESS: "empty", ORDER_FAILED: "has_items" },
          entry: [{ type: "assign", target: "isProcessing", value: true }],
          exit: [{ type: "assign", target: "isProcessing", value: false }],
        },
      },
    },
    {
      id: "wishlist",
      name: "Wishlist State Machine",
      initialState: "empty",
      context: { items: [], priceDrops: [] },
      states: {
        empty: {
          on: { ADD: "has_items" },
        },
        has_items: {
          on: { ADD: "has_items", REMOVE: "has_items", MOVE_TO_CART: "has_items", CLEAR: "empty" },
        },
      },
    },
    {
      id: "checkout",
      name: "Checkout Flow State Machine",
      initialState: "cart_review",
      context: { step: 1, shipping: null, payment: null, billing: null },
      states: {
        cart_review: {
          on: { PROCEED: "shipping", UPDATE_CART: "cart_review" },
        },
        shipping: {
          on: { NEXT: "payment", BACK: "cart_review", UPDATE_ADDRESS: "shipping" },
          entry: [{ type: "assign", target: "step", value: 2 }],
        },
        payment: {
          on: { NEXT: "review", BACK: "shipping", UPDATE_PAYMENT: "payment" },
          entry: [{ type: "assign", target: "step", value: 3 }],
        },
        review: {
          on: { PLACE_ORDER: "processing", BACK: "payment", EDIT: "shipping" },
          entry: [{ type: "assign", target: "step", value: 4 }],
        },
        processing: {
          on: { SUCCESS: "complete", FAILED: "payment" },
          entry: [{ type: "assign", target: "step", value: 5 }],
        },
        complete: {
          on: { CONTINUE_SHOPPING: "cart_review", VIEW_ORDER: "complete" },
          entry: [{ type: "assign", target: "step", value: 6 }],
        },
      },
    },
    {
      id: "inventory",
      name: "Inventory State Machine",
      initialState: "in_stock",
      context: { stock: 100, reserved: 0 },
      states: {
        in_stock: {
          on: { PURCHASE: "in_stock", RESERVE: "low_stock" },
        },
        low_stock: {
          on: { PURCHASE: "out_of_stock", RESTOCK: "in_stock", RELEASE: "in_stock" },
          entry: [{ type: "emit", event: "LOW_STOCK_ALERT" }],
        },
        out_of_stock: {
          on: { RESTOCK: "in_stock", BACKORDER: "backordered" },
          entry: [{ type: "emit", event: "OUT_OF_STOCK" }],
        },
        backordered: {
          on: { RESTOCK: "in_stock", CANCEL_BACKORDER: "out_of_stock" },
        },
      },
    },
  ],
  timeMutations: [
    {
      id: "price-fluctuation",
      name: "Price Fluctuation",
      interval: 60000,
      jitter: 30000,
      mutate: (ctx) => {
        const cart = { ...(ctx.cart as Record<string, unknown>) };
        const items = (cart.items as Array<{ price: number; id: string }>) || [];
        cart.items = items.map(item => ({
          ...item,
          price: item.price * (0.98 + Math.random() * 0.04),
        }));
        cart.total = items.reduce((sum, item) => sum + item.price, 0);
        return { ...ctx, cart, lastPriceUpdate: Date.now() };
      },
      description: "Simulates minor price fluctuations (±2%)",
      priority: 70,
    },
    {
      id: "stock-simulation",
      name: "Stock Level Simulation",
      interval: 30000,
      mutate: (ctx) => {
        const stockLevels = { ...(ctx.stockLevels as Record<string, number>) || {} };
        for (const key of Object.keys(stockLevels)) {
          stockLevels[key] = Math.max(0, stockLevels[key] - Math.floor(Math.random() * 3));
        }
        return { ...ctx, stockLevels, lastStockUpdate: Date.now() };
      },
      description: "Simulates stock decreasing over time",
      priority: 60,
    },
    {
      id: "cart-abandonment",
      name: "Cart Abandonment Timer",
      interval: 15000,
      condition: (ctx) => {
        const cart = ctx.cart as { items: unknown[] };
        return (cart?.items?.length ?? 0) > 0 && ctx.checkoutStep === null;
      },
      mutate: (ctx) => ({
        ...ctx,
        cartAbandoned: true,
        abandonmentTime: Date.now(),
      }),
      description: "Marks cart as abandoned after inactivity",
      priority: 40,
    },
    {
      id: "wishlist-price-drop",
      name: "Wishlist Price Drop Detection",
      interval: 120000,
      mutate: (ctx) => {
        const wishlist = (ctx.wishlist as Array<{ price: number; originalPrice: number }>) || [];
        const priceDrops = wishlist.filter(item => item.price < item.originalPrice * 0.9);
        return { ...ctx, priceDrops, lastPriceDropCheck: Date.now() };
      },
      description: "Checks for price drops on wishlist items",
      priority: 80,
    },
  ],
  eventChains: [
    {
      id: "add-to-cart-chain",
      name: "Add to Cart Chain",
      trigger: "ADD_ITEM",
      sourceMachine: "cart",
      links: [
        { target: "inventory", action: "RESERVE", delay: 100 },
        { target: "wishlist", action: "REMOVE", delay: 200, condition: "isInWishlist" },
      ],
    },
    {
      id: "checkout-chain",
      name: "Checkout Chain",
      trigger: "PLACE_ORDER",
      sourceMachine: "checkout",
      links: [
        { target: "inventory", action: "PURCHASE", delay: 500 },
        { target: "cart", action: "CLEAR", delay: 1000 },
      ],
    },
  ],
  userJourneys: [
    {
      id: "browse-to-buy",
      name: "Browse to Purchase",
      description: "User browses products, adds to cart, and completes purchase",
      domain: "ecommerce",
      entryPoint: "browse",
      steps: [
        { id: "browse", action: "VIEW_HOME", target: "cart", nextStep: "search", probability: 0.9 },
        { id: "search", action: "SEARCH", target: "cart", nextStep: "view-product", probability: 0.7 },
        { id: "view-product", action: "VIEW_PRODUCT", target: "cart", nextStep: "add-to-cart", probability: 0.6 },
        { id: "add-to-cart", action: "ADD_ITEM", target: "cart", nextStep: "view-cart", probability: 0.5 },
        { id: "view-cart", action: "VIEW_CART", target: "checkout", nextStep: "checkout", probability: 0.7 },
        { id: "checkout", action: "PROCEED", target: "checkout", nextStep: "shipping", probability: 0.8 },
        { id: "shipping", action: "NEXT", target: "checkout", nextStep: "payment", probability: 0.9 },
        { id: "payment", action: "NEXT", target: "checkout", nextStep: "review", probability: 0.85 },
        { id: "review", action: "PLACE_ORDER", target: "checkout", nextStep: "complete", probability: 0.9 },
        { id: "complete", action: "VIEW_ORDER", target: "checkout", probability: 1.0 },
      ],
    },
    {
      id: "wishlist-browsing",
      name: "Wishlist Browsing",
      description: "User adds items to wishlist for later purchase",
      domain: "ecommerce",
      entryPoint: "browse",
      steps: [
        { id: "browse", action: "VIEW_HOME", target: "wishlist", nextStep: "view-product", probability: 0.9 },
        { id: "view-product", action: "VIEW_PRODUCT", target: "wishlist", nextStep: "add-wishlist", probability: 0.6 },
        { id: "add-wishlist", action: "ADD", target: "wishlist", nextStep: "browse-more", probability: 0.5 },
        { id: "browse-more", action: "VIEW_HOME", target: "wishlist", nextStep: "view-product", probability: 0.7 },
      ],
      loopable: true,
    },
  ],
};

// ─── GYM CRM ──────────────────────────────────────────────────────────────────

const GYM_CRM_BEHAVIORS: BehaviorProfile = {
  domain: "gym-crm",
  name: "Gym CRM Behaviors",
  description: "Gym management: member lifecycle, attendance tracking, billing, class booking",
  initialState: {
    members: [],
    leads: [],
    attendance: [],
    billing: [],
    classes: [],
    staff: [],
    activeCheckIn: null,
    todayAttendance: 0,
    monthlyRevenue: 0,
    activeMembers: 0,
    churnRisk: [],
  },
  stateMachines: [
    {
      id: "member",
      name: "Member Lifecycle State Machine",
      initialState: "lead",
      context: { memberId: null, joinDate: null, membershipType: null, status: "lead" },
      states: {
        lead: {
          on: { CONVERT: "trial", REJECT: "rejected", FOLLOW_UP: "lead" },
          entry: [{ type: "assign", target: "status", value: "lead" }],
        },
        trial: {
          on: { CONVERT: "active", EXPIRE: "lead", CANCEL: "lead" },
          entry: [{ type: "assign", target: "status", value: "trial" }],
        },
        active: {
          on: { PAUSE: "paused", CANCEL: "churned", RENEW: "active", UPGRADE: "active" },
          entry: [{ type: "assign", target: "status", value: "active" }],
        },
        paused: {
          on: { RESUME: "active", CANCEL: "churned" },
          entry: [{ type: "assign", target: "status", value: "paused" }],
        },
        churned: {
          on: { RE_ENGAGE: "lead", DELETE: "deleted" },
          entry: [{ type: "assign", target: "status", value: "churned" }],
        },
        rejected: {},
        deleted: {},
      },
    },
    {
      id: "attendance",
      name: "Attendance State Machine",
      initialState: "not_checked_in",
      context: { checkInTime: null, checkOutTime: null, duration: 0 },
      states: {
        not_checked_in: {
          on: { CHECK_IN: "checked_in" },
        },
        checked_in: {
          on: { CHECK_OUT: "not_checked_in", TIMEOUT: "auto_checkout" },
          entry: [{ type: "assign", target: "checkInTime", value: Date.now() }],
        },
        auto_checkout: {
          on: { CHECK_IN: "checked_in" },
          entry: [{ type: "assign", target: "checkOutTime", value: "auto" }],
        },
      },
    },
    {
      id: "billing",
      name: "Billing State Machine",
      initialState: "pending",
      context: { invoiceId: null, amount: 0, dueDate: null, paidDate: null },
      states: {
        pending: {
          on: { PAY: "paid", OVERDUE: "overdue", CANCEL: "cancelled" },
        },
        paid: {
          on: { REFUND: "refunded" },
          entry: [{ type: "assign", target: "paidDate", value: Date.now() }],
        },
        overdue: {
          on: { PAY: "paid", ESCALATE: "collections", CANCEL: "cancelled" },
          entry: [{ type: "emit", event: "OVERDUE_ALERT" }],
        },
        collections: {
          on: { PAY: "paid", WRITE_OFF: "written_off" },
        },
        refunded: {},
        cancelled: {},
        written_off: {},
      },
    },
    {
      id: "classBooking",
      name: "Class Booking State Machine",
      initialState: "available",
      context: { classId: null, bookedMembers: [], capacity: 30 },
      states: {
        available: {
          on: { BOOK: "available", FILL: "full" },
        },
        full: {
          on: { CANCEL_BOOKING: "available", WAITLIST: "waitlisted" },
          entry: [{ type: "emit", event: "CLASS_FULL" }],
        },
        waitlisted: {
          on: { PROMOTE: "available", CANCEL_WAITLIST: "available" },
        },
      },
    },
    {
      id: "leadPipeline",
      name: "Lead Pipeline State Machine",
      initialState: "new",
      context: { leadId: null, source: null, score: 0, lastContact: null },
      states: {
        new: {
          on: { CONTACT: "contacted", QUALIFY: "qualified", REJECT: "rejected" },
        },
        contacted: {
          on: { FOLLOW_UP: "contacted", QUALIFY: "qualified", DEAD: "dead" },
          entry: [{ type: "assign", target: "lastContact", value: Date.now() }],
        },
        qualified: {
          on: { PROPOSAL: "proposal", DEMO: "demo", DEAD: "dead" },
        },
        proposal: {
          on: { ACCEPT: "won", NEGOTIATE: "negotiation", REJECT: "lost" },
        },
        demo: {
          on: { PROPOSAL: "proposal", FOLLOW_UP: "contacted", DEAD: "dead" },
        },
        negotiation: {
          on: { ACCEPT: "won", REJECT: "lost" },
        },
        won: {
          entry: [{ type: "emit", event: "LEAD_WON" }],
        },
        lost: {},
        dead: {},
        rejected: {},
      },
    },
  ],
  timeMutations: [
    {
      id: "today-attendance",
      name: "Today's Attendance Counter",
      interval: 5000,
      mutate: (ctx) => ({
        ...ctx,
        todayAttendance: ((ctx.todayAttendance as number) || 0) + Math.floor(Math.random() * 3),
        lastAttendanceUpdate: Date.now(),
      }),
      description: "Simulates members checking in throughout the day",
      priority: 10,
    },
    {
      id: "revenue-accumulation",
      name: "Monthly Revenue Accumulation",
      interval: 30000,
      mutate: (ctx) => ({
        ...ctx,
        monthlyRevenue: ((ctx.monthlyRevenue as number) || 0) + Math.floor(Math.random() * 500),
        lastRevenueUpdate: Date.now(),
      }),
      description: "Simulates revenue accumulating from payments",
      priority: 20,
    },
    {
      id: "lead-score-decay",
      name: "Lead Score Decay",
      interval: 60000,
      mutate: (ctx) => {
        const leads = (ctx.leads as Array<{ score: number; lastContact: number }>) || [];
        const now = Date.now();
        ctx.leads = leads.map(lead => ({
          ...lead,
          score: Math.max(0, lead.score - (now - lead.lastContact) / (1000 * 60 * 60 * 24) * 2),
        }));
        return ctx;
      },
      description: "Decays lead scores over time without contact",
      priority: 50,
    },
    {
      id: "churn-risk-detection",
      name: "Churn Risk Detection",
      interval: 120000,
      mutate: (ctx) => {
        const members = (ctx.members as Array<{ lastVisit: number; membershipType: string }>) || [];
        const now = Date.now();
        const churnRisk = members.filter(m => {
          const daysSinceVisit = (now - m.lastVisit) / (1000 * 60 * 60 * 24);
          return daysSinceVisit > 14;
        });
        return { ...ctx, churnRisk, lastChurnCheck: Date.now() };
      },
      description: "Identifies members at risk of churning",
      priority: 80,
    },
  ],
  eventChains: [
    {
      id: "check-in-to-attendance",
      name: "Check-in Updates Attendance",
      trigger: "CHECK_IN",
      sourceMachine: "attendance",
      links: [
        { target: "member", action: "UPDATE_LAST_VISIT", delay: 100 },
      ],
    },
    {
      id: "lead-won-to-member",
      name: "Lead Won Creates Member",
      trigger: "LEAD_WON",
      sourceMachine: "leadPipeline",
      links: [
        { target: "member", action: "CONVERT", delay: 500 },
        { target: "billing", action: "CREATE_INVOICE", delay: 1000 },
      ],
    },
  ],
  userJourneys: [
    {
      id: "new-member-onboarding",
      name: "New Member Onboarding",
      description: "Lead converts to active member with first check-in",
      domain: "gym-crm",
      entryPoint: "lead-contact",
      steps: [
        { id: "lead-contact", action: "CONTACT", target: "leadPipeline", nextStep: "qualify", probability: 0.8 },
        { id: "qualify", action: "QUALIFY", target: "leadPipeline", nextStep: "demo", probability: 0.7 },
        { id: "demo", action: "DEMO", target: "leadPipeline", nextStep: "proposal", probability: 0.8 },
        { id: "proposal", action: "PROPOSAL", target: "leadPipeline", nextStep: "accept", probability: 0.6 },
        { id: "accept", action: "ACCEPT", target: "leadPipeline", nextStep: "convert", probability: 0.9 },
        { id: "convert", action: "CONVERT", target: "member", nextStep: "first-checkin", probability: 1.0 },
        { id: "first-checkin", action: "CHECK_IN", target: "attendance", probability: 0.95 },
      ],
    },
    {
      id: "daily-attendance-flow",
      name: "Daily Attendance Flow",
      description: "Typical member check-in and workout session",
      domain: "gym-crm",
      entryPoint: "arrive",
      steps: [
        { id: "arrive", action: "CHECK_IN", target: "attendance", nextStep: "workout", probability: 0.95 },
        { id: "workout", action: "CHECK_OUT", target: "attendance", nextStep: "done", probability: 0.9, timeout: 3600000 },
        { id: "done", action: "VIEW_STATS", target: "attendance", probability: 0.3 },
      ],
    },
  ],
};

// ─── SAAS DASHBOARD ───────────────────────────────────────────────────────────

const SAAS_BEHAVIORS: BehaviorProfile = {
  domain: "saas",
  name: "SaaS Dashboard Behaviors",
  description: "SaaS platform: user onboarding, usage tracking, subscription lifecycle, notifications",
  initialState: {
    users: [],
    subscriptions: [],
    usage: { apiCalls: 0, storage: 0, features: [] },
    notifications: [],
    trialEndsAt: null,
    monthlyUsage: 0,
    activeUsers: 0,
    churnRate: 0,
    mrr: 0,
  },
  stateMachines: [
    {
      id: "subscription",
      name: "Subscription State Machine",
      initialState: "trial",
      context: { plan: "starter", trialEndsAt: null, billingCycle: "monthly" },
      states: {
        trial: {
          on: { CONVERT: "active", EXPIRE: "expired", UPGRADE: "active" },
          entry: [{ type: "assign", target: "trialEndsAt", value: Date.now() + 14 * 24 * 60 * 60 * 1000 }],
        },
        active: {
          on: { UPGRADE: "active", DOWNGRADE: "active", CANCEL: "cancelled", PAUSE: "paused", RENEW: "active" },
          entry: [{ type: "assign", target: "status", value: "active" }],
        },
        paused: {
          on: { RESUME: "active", CANCEL: "cancelled" },
        },
        cancelled: {
          on: { REACTIVATE: "active" },
          entry: [{ type: "assign", target: "cancelledAt", value: Date.now() }],
        },
        expired: {
          on: { CONVERT: "active" },
        },
      },
    },
    {
      id: "onboarding",
      name: "User Onboarding State Machine",
      initialState: "signed_up",
      context: { steps: [], currentStep: 0 },
      states: {
        signed_up: {
          on: { COMPLETE_PROFILE: "profile_setup", SKIP: "profile_setup" },
        },
        profile_setup: {
          on: { COMPLETE: "workspace_setup", SKIP: "workspace_setup" },
        },
        workspace_setup: {
          on: { COMPLETE: "invite_team", SKIP: "invite_team" },
        },
        invite_team: {
          on: { COMPLETE: "first_project", SKIP: "first_project" },
        },
        first_project: {
          on: { COMPLETE: "completed", SKIP: "completed" },
        },
        completed: {
          entry: [{ type: "emit", event: "ONBOARDING_COMPLETE" }],
        },
      },
    },
    {
      id: "featureGating",
      name: "Feature Gating State Machine",
      initialState: "locked",
      context: { featureId: null, requiredPlan: "pro" },
      states: {
        locked: {
          on: { UNLOCK: "unlocked", UPGRADE: "unlocked" },
        },
        unlocked: {
          on: { LOCK: "locked", USAGE_LIMIT: "limited" },
        },
        limited: {
          on: { UPGRADE: "unlocked", RESET: "unlocked" },
          entry: [{ type: "emit", event: "USAGE_LIMIT_REACHED" }],
        },
      },
    },
  ],
  timeMutations: [
    {
      id: "api-usage-tracking",
      name: "API Usage Tracking",
      interval: 5000,
      mutate: (ctx) => ({
        ...ctx,
        usage: {
          ...(ctx.usage as Record<string, unknown>),
          apiCalls: ((ctx.usage as { apiCalls: number })?.apiCalls || 0) + Math.floor(Math.random() * 100),
        },
        lastUsageUpdate: Date.now(),
      }),
      description: "Simulates API calls being made",
      priority: 10,
    },
    {
      id: "storage-accumulation",
      name: "Storage Accumulation",
      interval: 30000,
      mutate: (ctx) => ({
        ...ctx,
        usage: {
          ...(ctx.usage as Record<string, unknown>),
          storage: ((ctx.usage as { storage: number })?.storage || 0) + Math.floor(Math.random() * 50),
        },
      }),
      description: "Simulates storage accumulating",
      priority: 30,
    },
    {
      id: "active-user-count",
      name: "Active User Counter",
      interval: 10000,
      mutate: (ctx) => ({
        ...ctx,
        activeUsers: Math.max(1, ((ctx.activeUsers as number) || 1) + Math.floor(Math.random() * 5) - 2),
        lastUserUpdate: Date.now(),
      }),
      description: "Simulates active user count fluctuation",
      priority: 20,
    },
    {
      id: "mrr-calculation",
      name: "MRR Calculation",
      interval: 60000,
      mutate: (ctx) => {
        const activeSubs = (ctx.subscriptions as Array<{ plan: string; mrr: number }>) || [];
        const mrr = activeSubs.reduce((sum, sub) => sum + (sub.mrr || 0), 0);
        return { ...ctx, mrr, lastMrrUpdate: Date.now() };
      },
      description: "Calculates Monthly Recurring Revenue",
      priority: 50,
    },
  ],
  eventChains: [
    {
      id: "onboarding-to-activation",
      name: "Onboarding Completion Triggers Activation",
      trigger: "ONBOARDING_COMPLETE",
      sourceMachine: "onboarding",
      links: [
        { target: "subscription", action: "ACTIVATE", delay: 500 },
      ],
    },
  ],
  userJourneys: [
    {
      id: "new-user-onboarding",
      name: "New User Onboarding",
      description: "New user signs up and completes onboarding",
      domain: "saas",
      entryPoint: "signup",
      steps: [
        { id: "signup", action: "COMPLETE_PROFILE", target: "onboarding", nextStep: "workspace", probability: 0.8 },
        { id: "workspace", action: "COMPLETE", target: "onboarding", nextStep: "invite", probability: 0.7 },
        { id: "invite", action: "COMPLETE", target: "onboarding", nextStep: "project", probability: 0.6 },
        { id: "project", action: "COMPLETE", target: "onboarding", probability: 0.8 },
      ],
    },
  ],
};

// ─── RESTAURANT ───────────────────────────────────────────────────────────────

const RESTAURANT_BEHAVIORS: BehaviorProfile = {
  domain: "restaurant",
  name: "Restaurant Behaviors",
  description: "Restaurant operations: order lifecycle, reservation management, menu availability",
  initialState: {
    orders: [],
    reservations: [],
    menuAvailability: {},
    tableStatus: [],
    waitTime: 0,
    kitchenLoad: 0,
    activeOrders: 0,
    todayRevenue: 0,
  },
  stateMachines: [
    {
      id: "order",
      name: "Order State Machine",
      initialState: "placed",
      context: { orderId: null, items: [], total: 0, orderTime: null },
      states: {
        placed: {
          on: { CONFIRM: "confirmed", CANCEL: "cancelled" },
          entry: [{ type: "assign", target: "orderTime", value: Date.now() }],
        },
        confirmed: {
          on: { PREPARE: "preparing" },
        },
        preparing: {
          on: { READY: "ready" },
          entry: [{ type: "assign", target: "startTime", value: Date.now() }],
        },
        ready: {
          on: { PICKUP: "picked_up", DELIVER: "delivering" },
        },
        delivering: {
          on: { DELIVERED: "delivered" },
        },
        picked_up: {},
        delivered: {
          entry: [{ type: "assign", target: "deliveredAt", value: Date.now() }],
        },
        cancelled: {},
      },
    },
    {
      id: "reservation",
      name: "Reservation State Machine",
      initialState: "booked",
      context: { reservationId: null, partySize: 0, time: null },
      states: {
        booked: {
          on: { CONFIRM: "confirmed", CANCEL: "cancelled" },
        },
        confirmed: {
          on: { CHECK_IN: "seated", NO_SHOW: "no_show", CANCEL: "cancelled" },
        },
        seated: {
          on: { ORDER: "ordering", FINISH: "completed" },
        },
        ordering: {
          on: { DONE: "dining" },
        },
        dining: {
          on: { PAY: "completed" },
        },
        completed: {},
        cancelled: {},
        no_show: {
          entry: [{ type: "emit", event: "NO_SHOW_ALERT" }],
        },
      },
    },
    {
      id: "table",
      name: "Table State Machine",
      initialState: "available",
      context: { tableId: null, capacity: 4 },
      states: {
        available: {
          on: { SEAT: "occupied", RESERVE: "reserved" },
        },
        occupied: {
          on: { FINISH: "available", CLEAN: "cleaning" },
        },
        reserved: {
          on: { SEAT: "occupied", CANCEL: "available", NO_SHOW: "available" },
        },
        cleaning: {
          on: { CLEAN: "available" },
        },
      },
    },
  ],
  timeMutations: [
    {
      id: "kitchen-load",
      name: "Kitchen Load Simulation",
      interval: 10000,
      mutate: (ctx) => ({
        ...ctx,
        kitchenLoad: Math.min(100, ((ctx.kitchenLoad as number) || 0) + Math.floor(Math.random() * 20) - 10),
        lastKitchenUpdate: Date.now(),
      }),
      description: "Simulates kitchen load fluctuation",
      priority: 10,
    },
    {
      id: "wait-time-calculation",
      name: "Wait Time Calculation",
      interval: 15000,
      mutate: (ctx) => ({
        ...ctx,
        waitTime: Math.max(0, ((ctx.kitchenLoad as number) || 0) * 0.5),
      }),
      description: "Calculates estimated wait time based on kitchen load",
      priority: 20,
    },
  ],
  eventChains: [],
  userJourneys: [
    {
      id: "dine-in-order",
      name: "Dine-In Order Flow",
      description: "Guest arrives, is seated, orders, and pays",
      domain: "restaurant",
      entryPoint: "arrive",
      steps: [
        { id: "arrive", action: "SEAT", target: "table", nextStep: "order", probability: 0.9 },
        { id: "order", action: "ORDER", target: "order", nextStep: "prepare", probability: 0.95 },
        { id: "prepare", action: "CONFIRM", target: "order", nextStep: "ready", probability: 0.95, timeout: 30000 },
        { id: "ready", action: "READY", target: "order", nextStep: "delivered", probability: 0.95 },
        { id: "delivered", action: "DELIVERED", target: "order", nextStep: "pay", probability: 0.95 },
        { id: "pay", action: "PAY", target: "order", nextStep: "done", probability: 0.95 },
        { id: "done", action: "FINISH", target: "table", probability: 1.0 },
      ],
    },
  ],
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const ADMIN_DASHBOARD_BEHAVIORS: BehaviorProfile = {
  domain: "admin-dashboard",
  name: "Admin Dashboard Behaviors",
  description: "Ecommerce admin: order processing, inventory management, analytics updates",
  initialState: {
    orders: [],
    products: [],
    customers: [],
    analytics: { revenue: 0, orders: 0, visitors: 0, conversionRate: 0 },
    inventoryAlerts: [],
    pendingOrders: 0,
    todayRevenue: 0,
  },
  stateMachines: [
    {
      id: "adminOrder",
      name: "Admin Order Processing",
      initialState: "pending",
      context: { orderId: null, status: "pending", assignedTo: null },
      states: {
        pending: {
          on: { ASSIGN: "assigned", CANCEL: "cancelled" },
        },
        assigned: {
          on: { PROCESS: "processing", REASSIGN: "assigned" },
        },
        processing: {
          on: { SHIP: "shipped", HOLD: "on_hold" },
        },
        shipped: {
          on: { DELIVER: "delivered" },
        },
        delivered: {},
        on_hold: {
          on: { RESUME: "processing", CANCEL: "cancelled" },
        },
        cancelled: {},
      },
    },
  ],
  timeMutations: [
    {
      id: "analytics-update",
      name: "Analytics Dashboard Update",
      interval: 5000,
      mutate: (ctx) => ({
        ...ctx,
        analytics: {
          revenue: ((ctx.analytics as { revenue: number })?.revenue || 0) + Math.floor(Math.random() * 1000),
          orders: ((ctx.analytics as { orders: number })?.orders || 0) + Math.floor(Math.random() * 5),
          visitors: ((ctx.analytics as { visitors: number })?.visitors || 0) + Math.floor(Math.random() * 50),
          conversionRate: 2 + Math.random() * 3,
        },
        lastAnalyticsUpdate: Date.now(),
      }),
      description: "Updates dashboard analytics in real-time",
      priority: 10,
    },
    {
      id: "inventory-monitor",
      name: "Inventory Level Monitor",
      interval: 30000,
      mutate: (ctx) => {
        const products = (ctx.products as Array<{ stock: number; id: string }>) || [];
        const alerts = products.filter(p => p.stock < 10);
        return { ...ctx, inventoryAlerts: alerts, lastInventoryCheck: Date.now() };
      },
      description: "Monitors inventory levels for low stock alerts",
      priority: 30,
    },
  ],
  eventChains: [],
  userJourneys: [],
};

// ─── BLOG ─────────────────────────────────────────────────────────────────────

const BLOG_BEHAVIORS: BehaviorProfile = {
  domain: "blog",
  name: "Blog Behaviors",
  description: "Content platform: reading patterns, comments, social sharing",
  initialState: {
    articles: [],
    readingHistory: [],
    comments: [],
    shares: 0,
    readTime: 0,
    currentArticle: null,
  },
  stateMachines: [
    {
      id: "article",
      name: "Article Reading State",
      initialState: "browsing",
      context: { articleId: null, readProgress: 0 },
      states: {
        browsing: {
          on: { OPEN: "reading" },
        },
        reading: {
          on: { SCROLL: "reading", COMPLETE: "completed", CLOSE: "browsing", SHARE: "reading", COMMENT: "reading" },
        },
        completed: {
          on: { SHARE: "completed", COMMENT: "completed", RELATED: "reading" },
          entry: [{ type: "assign", target: "readProgress", value: 100 }],
        },
      },
    },
  ],
  timeMutations: [
    {
      id: "read-time-tracking",
      name: "Read Time Tracking",
      interval: 1000,
      condition: (ctx) => ctx.currentArticle !== null,
      mutate: (ctx) => ({
        ...ctx,
        readTime: ((ctx.readTime as number) || 0) + 1,
      }),
      description: "Tracks time spent reading",
      priority: 10,
    },
  ],
  eventChains: [],
  userJourneys: [],
};

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

const PORTFOLIO_BEHAVIORS: BehaviorProfile = {
  domain: "portfolio",
  name: "Portfolio Behaviors",
  description: "Portfolio site: project views, contact form, skill exploration",
  initialState: {
    projectViews: [],
    contactSubmissions: [],
    skillExploration: [],
    timeOnSite: 0,
  },
  stateMachines: [],
  timeMutations: [
    {
      id: "time-on-site",
      name: "Time on Site Tracker",
      interval: 1000,
      mutate: (ctx) => ({
        ...ctx,
        timeOnSite: ((ctx.timeOnSite as number) || 0) + 1,
      }),
      description: "Tracks total time on site",
      priority: 10,
    },
  ],
  eventChains: [],
  userJourneys: [],
};

// ─── GENERIC FALLBACK ─────────────────────────────────────────────────────────

const GENERIC_BEHAVIORS: BehaviorProfile = {
  domain: "generic",
  name: "Generic Behaviors",
  description: "Generic app behaviors: navigation, form state, basic interactions",
  initialState: {
    currentPage: "/",
    isNavigating: false,
    formState: {},
    notifications: [],
  },
  stateMachines: [
    {
      id: "navigation",
      name: "Navigation State Machine",
      initialState: "home",
      context: { path: "/", history: [] },
      states: {
        home: {
          on: { NAVIGATE: "navigating" },
        },
        navigating: {
          on: { COMPLETE: "home", ERROR: "home" },
          entry: [{ type: "assign", target: "isNavigating", value: true }],
          exit: [{ type: "assign", target: "isNavigating", value: false }],
        },
      },
    },
  ],
  timeMutations: [],
  eventChains: [],
  userJourneys: [],
};
