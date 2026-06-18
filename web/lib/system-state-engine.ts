/**
 * System State Engine (SSE v1) — Central Runtime Layer
 *
 * Connects: Workflows + RPSE + UI Renderer + Agent Outputs
 * into one unified state-driven system.
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────────┐
 *   │              System State Engine                 │
 *   │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
 *   │  │  State   │  │  Events  │  │ Reducer  │      │
 *   │  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
 *   │       │              │              │            │
 *   │  ┌────┴──────────────┴──────────────┴────┐      │
 *   │  │         Unified SystemState           │      │
 *   │  └────┬──────┬──────┬──────┬──────┬─────┘      │
 *   │       │      │      │      │      │            │
 *   │  ┌────┴─┐ ┌──┴──┐ ┌─┴──┐ ┌─┴──┐ ┌─┴──┐       │
 *   │  │  UI  │ │Entit│ │Wf  │ │Dom │ │Evt │       │
 *   │  │      │ │ies  │ │    │ │ain │ │Log │       │
 *   │  └──────┘ └─────┘ └────┘ └────┘ └────┘       │
 *   └─────────────────────────────────────────────────┘
 *         ↑           ↑          ↑           ↑
 *    UI Renderer   RPSE     Workflows   Agent Skills
 *
 * Rules:
 *   - State is single source of truth
 *   - All updates go through event system
 *   - Workflows are executable via state transitions
 *   - UI reads ONLY from state
 *   - Agents emit events into state system
 */

import type { RPSEDataBundle } from "./rpse";
import type { DomainBlueprint } from "./domain-blueprints";

// ═══════════════════════════════════════════════════════════
// SECTION 1: GLOBAL SYSTEM STATE MODEL
// ═══════════════════════════════════════════════════════════

export interface SystemUI {
  activePage: string;
  modals: string[];
  loading: boolean;
  navigationHistory: string[];
  sidebarOpen: boolean;
  theme: "light" | "dark";
}

export interface SystemEntity {
  id: string;
  type: string;
  data: Record<string, unknown>;
  updatedAt: number;
  createdAt: number;
}

export interface WorkflowState {
  id: string;
  name: string;
  status: "idle" | "active" | "completed" | "failed";
  step: number;
  totalSteps: number;
  steps: string[];
  context: Record<string, unknown>;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface SystemDomain {
  name: string;
  metrics: Record<string, number | string>;
  liveData: Record<string, unknown>;
  lastUpdated: number;
}

export interface SystemEvent {
  type: EventType;
  payload: Record<string, unknown>;
  timestamp: number;
  source: "user" | "agent" | "workflow" | "system" | "rpse";
  id: string;
}

export type EventType =
  | "USER_ACTION"
  | "NAVIGATE"
  | "WORKFLOW_START"
  | "WORKFLOW_STEP"
  | "WORKFLOW_COMPLETE"
  | "WORKFLOW_FAILED"
  | "DATA_UPDATE"
  | "UI_UPDATE"
  | "AGENT_EVENT"
  | "RPSE_HYDRATE"
  | "ENTITY_CREATE"
  | "ENTITY_UPDATE"
  | "ENTITY_DELETE"
  | "METRIC_UPDATE"
  | "SYSTEM_INIT"
  | "SYSTEM_RESET";

export interface SystemState {
  ui: SystemUI;
  entities: Record<string, SystemEntity>;
  workflows: Record<string, WorkflowState>;
  domain: SystemDomain;
  events: SystemEvent[];
  metadata: {
    initializedAt: number;
    domain: string;
    projectName: string;
    version: string;
  };
}

// ═══════════════════════════════════════════════════════════
// SECTION 2: EVENT SYSTEM
// ═══════════════════════════════════════════════════════════

export type StateReducer = (
  state: SystemState,
  event: SystemEvent
) => SystemState;

export type EventHandler = (
  state: SystemState,
  event: SystemEvent
) => SystemState;

export interface EventSubscription {
  id: string;
  eventType: EventType | "*";
  handler: EventHandler;
  once: boolean;
}

// ═══════════════════════════════════════════════════════════
// SECTION 3: STATE ENGINE CORE
// ═══════════════════════════════════════════════════════════

let _state: SystemState | null = null;
let _subscribers: EventSubscription[] = [];
let _reducers: StateReducer[] = [];
let _eventLog: SystemEvent[] = [];
let _idCounter = 0;

function generateId(): string {
  _idCounter++;
  return `evt_${Date.now()}_${_idCounter}`;
}

// ═══════════════════════════════════════════════════════════
// SECTION 4: STATE ACCESS
// ═══════════════════════════════════════════════════════════

/**
 * Get current system state (single source of truth).
 */
export function getState(): SystemState {
  if (!_state) {
    throw new Error("SystemState not initialized. Call initializeSystemState() first.");
  }
  return _state;
}

/**
 * Set state directly (internal use only — prefer emit events).
 */
export function setState(state: SystemState): void {
  _state = state;
}

/**
 * Check if system is initialized.
 */
export function isInitialized(): boolean {
  return _state !== null;
}

// ═══════════════════════════════════════════════════════════
// SECTION 5: EVENT EMITTING
// ═══════════════════════════════════════════════════════════

/**
 * Emit an event into the system. This is the ONLY way to modify state.
 */
export function emit(
  event: Omit<SystemEvent, "id" | "timestamp"> & { timestamp?: number }
): SystemState {
  const fullEvent: SystemEvent = {
    ...event,
    id: generateId(),
    timestamp: event.timestamp || Date.now(),
  };

  // Log event
  _eventLog.push(fullEvent);
  if (_state) {
    _state.events.push(fullEvent);
  }

  // Apply built-in reducer
  if (_state) {
    _state = reduceState(_state, fullEvent);
  }

  // Apply registered reducers
  for (const reducer of _reducers) {
    if (_state) {
      _state = reducer(_state, fullEvent);
    }
  }

  // Notify subscribers
  for (const sub of _subscribers) {
    if (sub.eventType === "*" || sub.eventType === fullEvent.type) {
      if (_state) {
        _state = sub.handler(_state, fullEvent);
      }
      if (sub.once) {
        _subscribers = _subscribers.filter((s) => s.id !== sub.id);
      }
    }
  }

  return _state!;
}

// ═══════════════════════════════════════════════════════════
// SECTION 6: EVENT SUBSCRIPTION
// ═══════════════════════════════════════════════════════════

/**
 * Subscribe to events. Handler receives (state, event) and must return new state.
 */
export function subscribe(
  eventType: EventType | "*",
  handler: EventHandler,
  options: { once?: boolean } = {}
): () => void {
  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const sub: EventSubscription = {
    id,
    eventType,
    handler,
    once: options.once || false,
  };
  _subscribers.push(sub);

  // Return unsubscribe function
  return () => {
    _subscribers = _subscribers.filter((s) => s.id !== id);
  };
}

/**
 * Register a custom reducer that processes every event.
 */
export function registerReducer(reducer: StateReducer): () => void {
  _reducers.push(reducer);
  return () => {
    _reducers = _reducers.filter((r) => r !== reducer);
  };
}

// ═══════════════════════════════════════════════════════════
// SECTION 7: BUILT-IN REDUCER
// ═══════════════════════════════════════════════════════════

/**
 * Core state reducer — handles all event types.
 */
export function reduceState(
  state: SystemState,
  event: SystemEvent
): SystemState {
  const next = { ...state };

  switch (event.type) {
    // ─── UI EVENTS ───
    case "NAVIGATE":
      next.ui = {
        ...state.ui,
        activePage: (event.payload.page as string) || state.ui.activePage,
        navigationHistory: [
          ...state.ui.navigationHistory,
          state.ui.activePage,
        ].slice(-20), // Keep last 20
      };
      break;

    case "UI_UPDATE": {
      const updates = event.payload as Partial<SystemUI>;
      next.ui = { ...state.ui, ...updates };
      break;
    }

    case "USER_ACTION":
      // User actions can update any UI state
      if (event.payload.modal) {
        next.ui = {
          ...state.ui,
          modals: [...state.ui.modals, event.payload.modal as string],
        };
      }
      if (event.payload.closeModal) {
        next.ui = {
          ...state.ui,
          modals: state.ui.modals.filter(
            (m) => m !== event.payload.closeModal
          ),
        };
      }
      if (event.payload.loading !== undefined) {
        next.ui = { ...state.ui, loading: event.payload.loading as boolean };
      }
      break;

    // ─── WORKFLOW EVENTS ───
    case "WORKFLOW_START": {
      const wfId = event.payload.workflowId as string;
      const wfName = (event.payload.name as string) || wfId;
      const steps = (event.payload.steps as string[]) || [];
      next.workflows = {
        ...state.workflows,
        [wfId]: {
          id: wfId,
          name: wfName,
          status: "active",
          step: 0,
          totalSteps: steps.length,
          steps,
          context: (event.payload.context as Record<string, unknown>) || {},
          startedAt: event.timestamp,
        },
      };
      break;
    }

    case "WORKFLOW_STEP": {
      const wfId = event.payload.workflowId as string;
      const wf = state.workflows[wfId];
      if (wf) {
        const nextStep = (event.payload.step as number) ?? wf.step + 1;
        next.workflows = {
          ...state.workflows,
          [wfId]: {
            ...wf,
            step: nextStep,
            context: {
              ...wf.context,
              ...((event.payload.context as Record<string, unknown>) || {}),
            },
          },
        };
      }
      break;
    }

    case "WORKFLOW_COMPLETE": {
      const wfId = event.payload.workflowId as string;
      const wf = state.workflows[wfId];
      if (wf) {
        next.workflows = {
          ...state.workflows,
          [wfId]: {
            ...wf,
            status: "completed",
            step: wf.totalSteps,
            completedAt: event.timestamp,
            context: {
              ...wf.context,
              ...((event.payload.context as Record<string, unknown>) || {}),
            },
          },
        };
      }
      break;
    }

    case "WORKFLOW_FAILED": {
      const wfId = event.payload.workflowId as string;
      const wf = state.workflows[wfId];
      if (wf) {
        next.workflows = {
          ...state.workflows,
          [wfId]: {
            ...wf,
            status: "failed",
            error: (event.payload.error as string) || "Unknown error",
          },
        };
      }
      break;
    }

    // ─── DATA EVENTS ───
    case "DATA_UPDATE": {
      const key = event.payload.key as string;
      const value = event.payload.value;
      next.domain = {
        ...state.domain,
        liveData: { ...state.domain.liveData, [key]: value },
        lastUpdated: event.timestamp,
      };
      break;
    }

    case "ENTITY_CREATE": {
      const entity = event.payload as Omit<SystemEntity, "createdAt" | "updatedAt">;
      const id = entity.id || `ent_${Date.now()}`;
      next.entities = {
        ...state.entities,
        [id]: {
          ...entity,
          id,
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        },
      };
      break;
    }

    case "ENTITY_UPDATE": {
      const id = event.payload.id as string;
      const existing = state.entities[id];
      if (existing) {
        next.entities = {
          ...state.entities,
          [id]: {
            ...existing,
            data: {
              ...existing.data,
              ...((event.payload.data as Record<string, unknown>) || {}),
            },
            updatedAt: event.timestamp,
          },
        };
      }
      break;
    }

    case "ENTITY_DELETE": {
      const id = event.payload.id as string;
      const { [id]: _, ...rest } = state.entities;
      next.entities = rest;
      break;
    }

    case "METRIC_UPDATE": {
      const key = event.payload.key as string;
      const value = event.payload.value as string | number;
      next.domain = {
        ...state.domain,
        metrics: { ...state.domain.metrics, [key]: value },
        lastUpdated: event.timestamp,
      };
      break;
    }

    // ─── AGENT EVENTS ───
    case "AGENT_EVENT": {
      // Agent events can modify any part of state based on payload
      const action = event.payload.action as string;
      if (action === "updateWorkflow") {
        const wfId = event.payload.workflowId as string;
        const wf = state.workflows[wfId];
        if (wf) {
          next.workflows = {
            ...state.workflows,
            [wfId]: {
              ...wf,
              ...((event.payload.updates as Partial<WorkflowState>) || {}),
            },
          };
        }
      }
      if (action === "updateUI") {
        next.ui = {
          ...state.ui,
          ...((event.payload.updates as Partial<SystemUI>) || {}),
        };
      }
      if (action === "updateMetric") {
        next.domain = {
          ...state.domain,
          metrics: {
            ...state.domain.metrics,
            [event.payload.metricKey as string]: event.payload.metricValue as string | number,
          },
        };
      }
      break;
    }

    // ─── RPSE EVENTS ───
    case "RPSE_HYDRATE": {
      const rpseData = event.payload.rpseData as RPSEDataBundle;
      const domain = event.payload.domain as string;
      if (rpseData) {
        // Hydrate entities from RPSE data
        for (const item of rpseData.tableData || []) {
          const id = (item.id as string) || `ent_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          next.entities = {
            ...next.entities,
            [id]: {
              id,
              type: "table-row",
              data: item,
              createdAt: event.timestamp,
              updatedAt: event.timestamp,
            },
          };
        }
        for (const item of rpseData.cardData || []) {
          const id = item.id || `card_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          next.entities = {
            ...next.entities,
            [id]: {
              id,
              type: "card",
              data: item,
              createdAt: event.timestamp,
              updatedAt: event.timestamp,
            },
          };
        }
        for (const item of rpseData.pipelineData || []) {
          const id = item.id || `pipe_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          next.entities = {
            ...next.entities,
            [id]: {
              id,
              type: "pipeline-item",
              data: item,
              createdAt: event.timestamp,
              updatedAt: event.timestamp,
            },
          };
        }
        // Hydrate domain liveData
        next.domain = {
          ...state.domain,
          liveData: {
            ...state.domain.liveData,
            chartData: rpseData.chartData,
            dashboardStats: rpseData.dashboardStats,
            activityFeed: rpseData.activityFeed,
            menuData: rpseData.menuData,
            metrics: rpseData.metrics,
          },
          metrics: {
            ...state.domain.metrics,
            ...rpseData.metrics,
          },
          lastUpdated: event.timestamp,
        };
      }
      break;
    }

    // ─── SYSTEM EVENTS ───
    case "SYSTEM_INIT":
      // System init is handled by initializeSystemState
      break;

    case "SYSTEM_RESET":
      return createInitialState(
        state.metadata.domain,
        state.metadata.projectName
      );
  }

  return next;
}

// ═══════════════════════════════════════════════════════════
// SECTION 8: WORKFLOW STATE MACHINE
// ═══════════════════════════════════════════════════════════

/**
 * Compile a domain blueprint's requiredFlows into executable workflows.
 */
export function compileWorkflows(
  blueprint: DomainBlueprint | null
): Record<string, WorkflowState> {
  if (!blueprint) return {};

  const workflows: Record<string, WorkflowState> = {};

  for (const flow of blueprint.requiredFlows) {
    // Parse flow string into steps: "step1 → step2 → step3"
    const steps = flow
      .split("→")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (steps.length === 0) continue;

    // Generate workflow ID from first and last step
    const id = `wf_${steps[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 30)}`;

    workflows[id] = {
      id,
      name: flow,
      status: "idle",
      step: 0,
      totalSteps: steps.length,
      steps,
      context: {},
    };
  }

  return workflows;
}

/**
 * Start a workflow by ID.
 */
export function startWorkflow(id: string): SystemState {
  const state = getState();
  const wf = state.workflows[id];
  if (!wf) throw new Error(`Workflow ${id} not found`);

  return emit({
    type: "WORKFLOW_START",
    payload: { workflowId: id, name: wf.name, steps: wf.steps },
    source: "system",
  });
}

/**
 * Advance a workflow to the next step.
 */
export function advanceWorkflow(
  id: string,
  context?: Record<string, unknown>
): SystemState {
  const state = getState();
  const wf = state.workflows[id];
  if (!wf) throw new Error(`Workflow ${id} not found`);
  if (wf.status !== "active") throw new Error(`Workflow ${id} is not active`);

  const nextStep = wf.step + 1;
  if (nextStep >= wf.totalSteps) {
    // Auto-complete if this is the last step
    return emit({
      type: "WORKFLOW_COMPLETE",
      payload: { workflowId: id, context },
      source: "system",
    });
  }

  return emit({
    type: "WORKFLOW_STEP",
    payload: { workflowId: id, step: nextStep, context },
    source: "system",
  });
}

/**
 * Complete a workflow immediately.
 */
export function completeWorkflow(
  id: string,
  context?: Record<string, unknown>
): SystemState {
  return emit({
    type: "WORKFLOW_COMPLETE",
    payload: { workflowId: id, context },
    source: "system",
  });
}

/**
 * Fail a workflow with an error.
 */
export function failWorkflow(id: string, error: string): SystemState {
  return emit({
    type: "WORKFLOW_FAILED",
    payload: { workflowId: id, error },
    source: "system",
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 9: RPSE INTEGRATION
// ═══════════════════════════════════════════════════════════

/**
 * Hydrate system state with RPSE data.
 * RPSE data MUST populate state.entities and state.domain.liveData.
 */
export function hydrateStateWithRPSE(
  rpseData: RPSEDataBundle,
  domain: string
): SystemState {
  return emit({
    type: "RPSE_HYDRATE",
    payload: { rpseData, domain },
    source: "rpse",
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 10: UI REACTIVITY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Create a state selector function for UI components.
 * UI MUST read from state using this pattern.
 */
export function createStateSelector<T>(
  selector: (state: SystemState) => T
): () => T {
  return () => selector(getState());
}

/**
 * Subscribe to state changes and call handler when selected value changes.
 */
export function watchState<T>(
  selector: (state: SystemState) => T,
  handler: (value: T, prev: T) => void
): () => void {
  let prev = selector(getState());
  return subscribe("*", (state) => {
    const next = selector(state);
    if (next !== prev) {
      handler(next, prev);
      prev = next;
    }
    return state;
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 11: AGENT INTEGRATION
// ═══════════════════════════════════════════════════════════

/**
 * Agents emit events into the system state.
 */
export function registerAgentEvent(
  event: string,
  payload: Record<string, unknown>
): SystemState {
  return emit({
    type: "AGENT_EVENT",
    payload: { action: event, ...payload },
    source: "agent",
  });
}

/**
 * Agent-specific emit helpers for common patterns.
 */
export const AgentActions = {
  updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowState>
  ): SystemState {
    return registerAgentEvent("updateWorkflow", { workflowId, updates });
  },

  updateUI(updates: Partial<SystemUI>): SystemState {
    return registerAgentEvent("updateUI", { updates });
  },

  updateMetric(key: string, value: number | string): SystemState {
    return registerAgentEvent("updateMetric", {
      metricKey: key,
      metricValue: value,
    });
  },

  failWorkflow(workflowId: string, error: string): SystemState {
    return failWorkflow(workflowId, error);
  },
};

// ═══════════════════════════════════════════════════════════
// SECTION 12: SYSTEM INITIALIZATION
// ═══════════════════════════════════════════════════════════

function createInitialState(
  domain: string,
  projectName: string
): SystemState {
  return {
    ui: {
      activePage: "/",
      modals: [],
      loading: false,
      navigationHistory: [],
      sidebarOpen: true,
      theme: "light",
    },
    entities: {},
    workflows: {},
    domain: {
      name: domain,
      metrics: {},
      liveData: {},
      lastUpdated: Date.now(),
    },
    events: [],
    metadata: {
      initializedAt: Date.now(),
      domain,
      projectName,
      version: "1.0.0",
    },
  };
}

/**
 * Initialize the system state. Must be called before any other SSE function.
 */
export function initializeSystemState(config: {
  domain?: string;
  projectName?: string;
  blueprint?: DomainBlueprint | null;
  rpseData?: RPSEDataBundle;
}): SystemState {
  const domain = config.domain || "generic";
  const projectName = config.projectName || "My Project";

  // Reset internal state
  _state = createInitialState(domain, projectName);
  _subscribers = [];
  _reducers = [];
  _eventLog = [];
  _idCounter = 0;

  // Compile workflows from blueprint
  if (config.blueprint) {
    const workflows = compileWorkflows(config.blueprint);
    _state.workflows = workflows;
  }

  // Emit init event
  emit({
    type: "SYSTEM_INIT",
    payload: { domain, projectName },
    source: "system",
  });

  // Hydrate with RPSE data if provided
  if (config.rpseData) {
    hydrateStateWithRPSE(config.rpseData, domain);
  }

  return _state;
}

/**
 * Reset the system to initial state.
 */
export function resetSystem(): SystemState {
  if (!_state) {
    return createInitialState("generic", "My Project");
  }
  return emit({
    type: "SYSTEM_RESET",
    payload: {},
    source: "system",
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 13: QUERY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get all entities of a specific type.
 */
export function getEntitiesByType(type: string): SystemEntity[] {
  const state = getState();
  return Object.values(state.entities).filter((e) => e.type === type);
}

/**
 * Get a specific entity by ID.
 */
export function getEntity(id: string): SystemEntity | undefined {
  return getState().entities[id];
}

/**
 * Get all active workflows.
 */
export function getActiveWorkflows(): WorkflowState[] {
  return Object.values(getState().workflows).filter(
    (wf) => wf.status === "active"
  );
}

/**
 * Get a specific workflow by ID.
 */
export function getWorkflow(id: string): WorkflowState | undefined {
  return getState().workflows[id];
}

/**
 * Get event log filtered by type.
 */
export function getEventsByType(type: EventType): SystemEvent[] {
  return getState().events.filter((e) => e.type === type);
}

/**
 * Get event log filtered by source.
 */
export function getEventsBySource(
  source: SystemEvent["source"]
): SystemEvent[] {
  return getState().events.filter((e) => e.source === source);
}
