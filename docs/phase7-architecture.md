# Phase 7 — Multi-Agent Runtime Architecture

**Version:** 0.7.0-design
**Status:** Architecture Design (Pre-Implementation)
**Date:** June 16, 2026

---

## Table of Contents

1. [Agent Runtime Architecture](#1-agent-runtime-architecture)
2. [Agent State Model](#2-agent-state-model)
3. [Agent Message Schema](#3-agent-message-schema)
4. [Agent Artifact Schema](#4-agent-artifact-schema)
5. [Shared Memory Schema](#5-shared-memory-schema)
6. [Failure Recovery Model](#6-failure-recovery-model)
7. [Human Review Model](#7-human-review-model)
8. [Approval Workflow Model](#8-approval-workflow-model)
9. [End-to-End Demonstration](#9-end-to-end-demonstration)

---

## 1. Agent Runtime Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                                 │
│         "Build a supplement ecommerce store with..."                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  CEO Agent   │  │ Coordinator  │  │  Requirement Understanding│  │
│  │  (Strategic) │◄─┤   Agent      │◄─┤  Engine (Phase 4.5)       │  │
│  └──────┬───────┘  │  (Workflow)  │  └──────────────────────────┘  │
│         │          └──────┬───────┘                                │
│         │                 │                                        │
│         ▼                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              AGENT ROUTING MATRIX                           │   │
│  │  Complexity: Simple │ Moderate │ Complex │ Critical          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   PRODUCT     │  │   RESEARCH    │  │    DESIGN     │
│  DEPARTMENT   │  │  DEPARTMENT   │  │  DEPARTMENT   │
│               │  │               │  │               │
│ • PM Agent    │  │ • UX Research │  │ • UI/UX Pro   │
│ • Strategist  │  │ • Market Res. │  │ • Design Sys  │
│ • Competitive │  │               │  │ • 21st.dev    │
│               │  │               │  │ • Framer Mot  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  ENGINEERING  │  │   QUALITY     │  │   GROWTH      │
│  DEPARTMENT   │  │  DEPARTMENT   │  │  DEPARTMENT   │
│               │  │               │  │               │
│ • FE Architect│  │ • QA Engineer │  │ • SEO Spec    │
│ • FE Engineer │  │ • Reviewer    │  │ • CRO Agent   │
│ • BE Architect│  │ • Security    │  │ • Content     │
│ • BE Engineer │  │ • Performance │  │ • Analytics   │
│ • DB Architect│  │               │  │               │
│ • API Architect│  │               │  │               │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────────────────────────────┐
│  OPERATIONS   │  │     WEBSITE INTELLIGENCE DEPT         │
│  DEPARTMENT   │  │                                       │
│               │  │ • Website Analyzer                    │
│ • DevOps      │  │ • Screenshot Vision                   │
│ • Deployment  │  │ • Design Reverse Engineer             │
│               │  │ • Component Extractor                 │
└───────────────┘  │ • Blueprint Generator                 │
                   └───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SHARED MEMORY LAYER (Phase 6)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Projects │ │Patterns  │ │Blueprints│ │Components│ │Evaluations│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       FINAL OUTPUT                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Generated Next.js Project                                  │   │
│  │  • 14-24 files (components, pages, API routes, configs)     │   │
│  │  • Blueprint (JSON + YAML)                                  │   │
│  │  • Build success: 100% (Phase 5.5 validated)               │   │
│  │  • Quality score: 95/100                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Agent Runtime Core

```typescript
// Agent Runtime — The execution engine for all agents
interface AgentRuntime {
  // Agent registry
  agents: Map<AgentId, AgentDefinition>;
  
  // Execution
  execute(input: AgentInput): Promise<AgentOutput>;
  executeParallel(inputs: AgentInput[]): Promise<AgentOutput[]>;
  
  // State management
  getState(executionId: ExecutionId): AgentState;
  setState(executionId: ExecutionId, state: AgentState): void;
  
  // Message bus
  publish(message: AgentMessage): void;
  subscribe(agentId: AgentId, handler: MessageHandler): void;
  
  // Memory
  memory: SharedMemory;
  
  // Human-in-the-loop
  requestReview(review: ReviewRequest): Promise<ReviewResult>;
  requestApproval(approval: ApprovalRequest): Promise<ApprovalResult>;
}

// Agent Definition — What an agent can do
interface AgentDefinition {
  id: AgentId;
  name: string;
  department: Department;
  role: string;
  capabilities: Capability[];
  constraints: Constraint[];
  maxRetries: number;
  timeoutMs: number;
  requiredInputs: InputRequirement[];
  outputs: OutputDefinition[];
}

// Department枚举
type Department = 
  | 'executive' 
  | 'product' 
  | 'research' 
  | 'design' 
  | 'engineering' 
  | 'quality' 
  | 'growth' 
  | 'operations' 
  | 'website-intelligence';
```

### 1.3 Agent Communication Flow

```
Agent A ──publish──► Message Bus ──subscribe──► Agent B
    │                      │                      │
    │                      ▼                      │
    │              ┌──────────────┐              │
    │              │   Shared     │              │
    │              │   Memory     │              │
    │              └──────────────┘              │
    │                      │                      │
    ◄──────────────────────┴──────────────────────┘
                    (via shared state)
```

---

## 2. Agent State Model

### 2.1 Execution State Machine

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  ROUTING    │
                    │ (CEO/Coord) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  SIMPLE    │ │  MODERATE  │ │  COMPLEX   │
       │  PIPELINE  │ │  PIPELINE  │ │  PIPELINE  │
       └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │              │              │
             ▼              ▼              ▼
       ┌─────────────────────────────────────────┐
       │           AGENT EXECUTION               │
       │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
       │  │ RUNNING │─►│ WAITING │─►│ RETRY   │ │
       │  └────┬────┘  └────┬────┘  └────┬────┘ │
       │       │            │            │       │
       │       ▼            ▼            ▼       │
       │  ┌─────────────────────────────────┐   │
       │  │         COMPLETED               │   │
       │  └─────────────────────────────────┘   │
       └─────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  REVIEW    │ │  APPROVAL  │ │  FAILED    │
       │  PENDING   │ │  PENDING   │ │  (retry?)  │
       └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │              │              │
             ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  REVIEWED  │ │  APPROVED  │ │  RECOVERED │
       │  (pass/    │ │  (proceed) │ │  (fallback)│
       │   fail)    │ │            │ │            │
       └────────────┘ └────────────┘ └────────────┘
```

### 2.2 State Definition

```typescript
type ExecutionId = string;  // UUID
type AgentId = string;      // e.g., 'fe-engineer', 'qa-engineer'

type AgentStateStatus = 
  | 'pending'
  | 'routing'
  | 'executing'
  | 'waiting-input'
  | 'review-pending'
  | 'approval-pending'
  | 'retrying'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface AgentState {
  executionId: ExecutionId;
  agentId: AgentId;
  status: AgentStateStatus;
  
  // Input/Output
  input: AgentInput;
  output: AgentOutput | null;
  
  // Progress
  progress: number;  // 0-100
  currentStep: string;
  steps: ExecutionStep[];
  
  // Timing
  startedAt: string;   // ISO timestamp
  updatedAt: string;
  completedAt?: string;
  timeoutMs: number;
  
  // Retry
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  
  // Dependencies
  dependsOn: ExecutionId[];
  dependents: ExecutionId[];
  
  // Human-in-the-loop
  reviewRequest?: ReviewRequest;
  approvalRequest?: ApprovalRequest;
}

interface ExecutionStep {
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
}
```

### 2.3 State Transitions

```typescript
const STATE_TRANSITIONS: Record<AgentStateStatus, AgentStateStatus[]> = {
  'pending':           ['routing', 'cancelled'],
  'routing':           ['executing', 'failed'],
  'executing':         ['completed', 'failed', 'waiting-input', 'review-pending', 'approval-pending'],
  'waiting-input':     ['executing', 'cancelled'],
  'review-pending':    ['completed', 'failed', 'executing'],  // review can request rework
  'approval-pending':  ['completed', 'failed', 'executing'],  // approval can reject
  'retrying':          ['executing', 'failed'],
  'completed':         [],  // terminal state
  'failed':            ['retrying', 'pending'],  // can retry or re-queue
  'cancelled':         [],  // terminal state
};
```

---

## 3. Agent Message Schema

### 3.1 Message Types

```typescript
type MessageType = 
  | 'task-assigned'
  | 'task-completed'
  | 'task-failed'
  | 'request-input'
  | 'provide-input'
  | 'request-review'
  | 'review-result'
  | 'request-approval'
  | 'approval-result'
  | 'artifact-created'
  | 'artifact-updated'
  | 'state-changed'
  | 'error'
  | 'log';

interface AgentMessage {
  id: string;               // UUID
  type: MessageType;
  timestamp: string;        // ISO
  
  // Routing
  from: AgentId;
  to: AgentId | 'broadcast';
  executionId: ExecutionId;
  
  // Content
  payload: MessagePayload;
  
  // Metadata
  correlationId?: string;   // For request-response pairing
  priority: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number;             // Time to live in ms
}

// Payload varies by message type
type MessagePayload = 
  | TaskAssignedPayload
  | TaskCompletedPayload
  | TaskFailedPayload
  | RequestInputPayload
  | ProvideInputPayload
  | RequestReviewPayload
  | ReviewResultPayload
  | RequestApprovalPayload
  | ApprovalResultPayload
  | ArtifactPayload
  | StateChangedPayload
  | ErrorPayload
  | LogPayload;
```

### 3.2 Key Payload Definitions

```typescript
interface TaskAssignedPayload {
  task: {
    id: string;
    type: string;           // 'generate-component', 'review-code', etc.
    description: string;
    input: unknown;
    constraints: Constraint[];
    deadline?: string;
  };
  context: {
    previousOutputs: Record<AgentId, AgentOutput>;
    sharedArtifacts: Artifact[];
    memory: MemorySnapshot;
  };
}

interface TaskCompletedPayload {
  taskId: string;
  result: AgentOutput;
  artifacts: Artifact[];
  metrics: {
    duration: number;
    tokensUsed: number;
    costUsd: number;
  };
}

interface RequestReviewPayload {
  artifact: Artifact;
  reviewType: 'code' | 'design' | 'security' | 'performance' | 'seo';
  criteria: string[];
  deadline?: string;
}

interface ReviewResultPayload {
  artifactId: string;
  verdict: 'approved' | 'rejected' | 'needs-changes';
  findings: ReviewFinding[];
  comments: string;
}

interface ArtifactPayload {
  artifact: Artifact;
  action: 'created' | 'updated' | 'deleted';
}
```

### 3.3 Message Flow Example

```
User Request
    │
    ▼
[CEO Agent] ──task-assigned──► [Coordinator Agent]
    │                              │
    │                              ▼
    │                     [Requirement Engine]
    │                              │
    │                              ▼
    │                     [Coordinator Agent] ──task-assigned──► [PM Agent]
    │                              │                              │
    │                              │                              ▼
    │                              │                     [PM Agent] ──task-completed──►
    │                              │                              │
    │                              ◄──────────────────────────────┘
    │                              │
    │                              ▼
    │                     [Coordinator Agent] ──task-assigned──► [UI/UX Agent]
    │                              │                              │
    │                              │                              ▼
    │                              │                     [UI/UX Agent] ──artifact-created──►
    │                              │                              │
    │                              ◄──────────────────────────────┘
    │                              │
    │                              ▼
    │                     [Coordinator Agent] ──request-review──► [Reviewer Agent]
    │                              │                              │
    │                              │                              ▼
    │                              │                     [Reviewer Agent] ──review-result──►
    │                              │                              │
    │                              ◄──────────────────────────────┘
    │                              │
    ▼                              ▼
[CEO Agent] ◄──task-completed──── [Coordinator Agent]
    │
    ▼
[Final Output]
```

---

## 4. Agent Artifact Schema

### 4.1 Artifact Types

```typescript
type ArtifactType = 
  | 'blueprint'
  | 'component'
  | 'page'
  | 'api-route'
  | 'database-schema'
  | 'design-system'
  | 'wireframe'
  | 'prototype'
  | 'test-suite'
  | 'documentation'
  | 'deployment-config'
  | 'analytics-config'
  | 'seo-config'
  | 'security-audit'
  | 'performance-report';

type ArtifactStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'published';

interface Artifact {
  id: string;               // UUID
  type: ArtifactType;
  status: ArtifactStatus;
  
  // Content
  name: string;
  description: string;
  content: ArtifactContent;
  
  // Source
  createdBy: AgentId;
  executionId: ExecutionId;
  createdAt: string;
  updatedAt: string;
  
  // Versioning
  version: number;
  previousVersionId?: string;
  
  // Quality
  qualityScore: number;     // 0-100
  reviewResults: ReviewResult[];
  
  // Dependencies
  dependsOn: string[];      // Other artifact IDs
  usedBy: string[];         // Artifacts that depend on this
  
  // Metadata
  metadata: Record<string, unknown>;
}

// Content varies by artifact type
type ArtifactContent = 
  | BlueprintContent
  | ComponentContent
  | PageContent
  | ApiRouteContent
  | DatabaseSchemaContent
  | DesignSystemContent
  | WireframeContent
  | TestSuiteContent
  | DocumentationContent
  | DeploymentConfigContent;
```

### 4.2 Key Content Definitions

```typescript
interface BlueprintContent {
  blueprint: Blueprint;     // From existing Blueprint type
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface ComponentContent {
  name: string;
  code: string;             // TypeScript/React code
  props: PropDefinition[];
  styles: string;           // CSS/Tailwind
  tests?: string;           // Test code
  storybook?: string;       // Storybook story
}

interface PageContent {
  route: string;
  components: string[];     // Component artifact IDs
  layout: string;
  metadata: PageMetadata;
}

interface DesignSystemContent {
  tokens: DesignTokens;
  components: ComponentSpec[];
  patterns: PatternSpec[];
  guidelines: string;
}

interface TestSuiteContent {
  framework: string;        // 'jest' | 'vitest' | 'playwright'
  tests: TestDefinition[];
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}
```

---

## 5. Shared Memory Schema

### 5.1 Memory Layers

```
┌─────────────────────────────────────────────────────────┐
│                    MEMORY LAYERS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  L1: WORKING MEMORY (per execution)             │   │
│  │  • Current state, intermediate results          │   │
│  │  • Agent-specific context                        │   │
│  │  • TTL: execution lifetime                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  L2: SHARED MEMORY (cross-agent)                │   │
│  │  • Artifacts, messages, coordination state       │   │
│  │  • Agent outputs, review results                 │   │
│  │  • TTL: execution lifetime                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  L3: PERSISTENT MEMORY (Phase 6)                │   │
│  │  • Projects, blueprints, patterns                │   │
│  │  • Evaluations, generations                      │   │
│  │  • TTL: permanent (with embedding search)        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  L4: KNOWLEDGE BASE                             │   │
│  │  • Best practices, design patterns               │   │
│  │  • Company standards, style guides               │   │
│  │  • TTL: permanent                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Shared Memory Interface

```typescript
interface SharedMemory {
  // Working memory (L1)
  working: Map<string, unknown>;
  
  // Shared memory (L2)
  artifacts: Map<string, Artifact>;
  messages: AgentMessage[];
  states: Map<ExecutionId, Map<AgentId, AgentState>>;
  
  // Persistent memory (L3) — via Phase 6 MemoryStore
  persistent: MemoryStore;
  
  // Knowledge base (L4)
  knowledge: KnowledgeBase;
  
  // Operations
  get<T>(key: string, layer?: MemoryLayer): T | undefined;
  set<T>(key: string, value: T, layer?: MemoryLayer): void;
  
  // Artifact operations
  createArtifact(artifact: Artifact): Artifact;
  getArtifact(id: string): Artifact | undefined;
  updateArtifact(id: string, updates: Partial<Artifact>): Artifact;
  listArtifacts(filter?: ArtifactFilter): Artifact[];
  
  // Search
  searchArtifacts(query: string, options?: SearchOptions): Artifact[];
  searchMemory(query: string, options?: SearchOptions): MemoryResult[];
}

interface KnowledgeBase {
  // Best practices
  getBestPractice(category: string): BestPractice[];
  
  // Design patterns
  getDesignPattern(patternType: string): DesignPattern[];
  
  // Company standards
  getStandard(standardType: string): Standard[];
  
  // Learn from experience
  learn(artifact: Artifact, outcome: 'success' | 'failure'): void;
}
```

---

## 6. Failure Recovery Model

### 6.1 Failure Types

```typescript
type FailureType = 
  | 'timeout'              // Agent exceeded time limit
  | 'error'                // Runtime error
  | 'validation-failed'    // Output didn't pass validation
  | 'review-rejected'      // Human review rejected
  | 'approval-denied'      // Human approval denied
  | 'dependency-failed'    // Required input unavailable
  | 'resource-exhausted'   // Token/cost limit reached
  | 'conflict';            // State conflict with another agent

interface Failure {
  id: string;
  type: FailureType;
  agentId: AgentId;
  executionId: ExecutionId;
  
  // Error details
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  
  // Recovery
  recoverable: boolean;
  recoveryStrategy: RecoveryStrategy;
  retryCount: number;
  maxRetries: number;
  
  // Timing
  failedAt: string;
  lastRetryAt?: string;
}
```

### 6.2 Recovery Strategies

```typescript
type RecoveryStrategy = 
  | 'retry'                // Simple retry with backoff
  | 'fallback-agent'       // Delegate to alternative agent
  | 'skip'                 // Skip this step, continue pipeline
  | 'human-intervention'   // Escalate to human
  | 'rollback'             // Undo previous steps
  | 'abort';               // Stop execution

const RECOVERY_MAP: Record<FailureType, RecoveryStrategy[]> = {
  'timeout':             ['retry', 'fallback-agent', 'human-intervention'],
  'error':               ['retry', 'fallback-agent', 'human-intervention', 'abort'],
  'validation-failed':   ['retry', 'human-intervention', 'rollback'],
  'review-rejected':     ['retry', 'human-intervention', 'rollback'],
  'approval-denied':     ['human-intervention', 'rollback', 'abort'],
  'dependency-failed':   ['retry', 'skip', 'human-intervention'],
  'resource-exhausted':  ['human-intervention', 'abort'],
  'conflict':            ['retry', 'human-intervention'],
};
```

### 6.3 Recovery Flow

```
Agent Fails
    │
    ▼
┌─────────────────────────────────────┐
│  1. CLASSIFY FAILURE                │
│     • Type, severity, recoverable?  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. SELECT RECOVERY STRATEGY        │
│     • Based on failure type         │
│     • Check retry count             │
│     • Check dependencies            │
└──────────────┬──────────────────────┘
               │
       ┌───────┼───────┬───────┐
       ▼       ▼       ▼       ▼
   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
   │ RETRY │ │FALLBACK│ │ HUMAN │ │ABORT  │
   │       │ │ AGENT  │ │ INTER │ │       │
   └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
       │         │         │         │
       ▼         ▼         ▼         ▼
┌─────────────────────────────────────┐
│  3. EXECUTE RECOVERY                │
│     • Apply strategy                │
│     • Update state                  │
│     • Notify dependent agents       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. CONTINUE OR TERMINATE           │
│     • Resume pipeline               │
│     • Or escalate to CEO            │
└─────────────────────────────────────┘
```

### 6.4 Fallback Agent Mapping

```typescript
const FALLBACK_AGENTS: Record<AgentId, AgentId[]> = {
  'fe-engineer':        ['be-engineer', 'frontend-architect'],
  'be-engineer':        ['fe-engineer', 'backend-architect'],
  'ui-ux-pro-max':      ['design-system', 'framer-motion'],
  'design-system':      ['ui-ux-pro-max', '21st-dev-component'],
  'qa-engineer':        ['reviewer', 'security'],
  'seo-specialist':     ['content-strategist', 'cro-agent'],
  'devops-engineer':    ['deployment', 'backend-architect'],
  // ... more mappings
};
```

---

## 7. Human Review Model

### 7.1 Review Types

```typescript
type ReviewType = 
  | 'code-review'         // Code quality, patterns, standards
  | 'design-review'       // Visual design, UX, accessibility
  | 'architecture-review' // System design, scalability
  | 'security-review'     // Vulnerabilities, compliance
  | 'performance-review'  // Speed, optimization
  | 'seo-review'          // Search optimization
  | 'content-review'      // Copy, messaging, brand voice
  | 'final-review';       // Complete output review

interface ReviewRequest {
  id: string;
  type: ReviewType;
  
  // What to review
  artifactId: string;
  artifact: Artifact;
  
  // Who should review
  requiredReviewers: AgentId[];  // Or human roles
  optionalReviewers: AgentId[];
  
  // Review criteria
  criteria: ReviewCriteria;
  
  // Deadlines
  requestedAt: string;
  deadline?: string;
  timeoutMs: number;
  
  // Context
  context: {
    project: Project;
    previousReviews: ReviewResult[];
    requirements: string[];
  };
}

interface ReviewCriteria {
  mandatory: Criterion[];     // Must pass
  optional: Criterion[];      // Should pass
  severity: 'blocking' | 'advisory';
}

interface Criterion {
  id: string;
  category: string;
  description: string;
  weight: number;            // 0-1
  checkFunction?: string;    // Automated check reference
}

interface ReviewResult {
  reviewId: string;
  reviewerId: AgentId;
  
  verdict: 'approved' | 'rejected' | 'needs-changes';
  score: number;             // 0-100
  
  findings: ReviewFinding[];
  comments: string;
  
  // Timing
  reviewedAt: string;
  duration: number;          // ms
}

interface ReviewFinding {
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  message: string;
  location?: string;         // File, line, component
  suggestion?: string;
}
```

### 7.2 Review Workflow

```
Agent Completes Task
         │
         ▼
┌─────────────────────────────────────────┐
│  1. AUTOMATED PRE-REVIEW                │
│     • Run validators (Phase 5.5)        │
│     • Run tests                          │
│     • Check standards                    │
└──────────────┬──────────────────────────┘
               │
         Pass? ┼─── No ──► Auto-fix or Reject
               │
              Yes
               │
               ▼
┌─────────────────────────────────────────┐
│  2. AGENT REVIEW (Peer Review)          │
│     • Assign reviewer agents            │
│     • Parallel review                   │
│     • Collect findings                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. CONSOLIDATE FINDINGS                │
│     • Merge all review results          │
│     • Calculate overall score           │
│     • Determine verdict                 │
└──────────────┬──────────────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
   ┌───────┐ ┌───────┐ ┌───────┐
   │PASS   │ │CHANGES│ │REJECT │
   │       │ │NEEDED │ │       │
   └───┬───┘ └───┬───┘ └───┬───┘
       │         │         │
       ▼         ▼         ▼
┌─────────────────────────────────────────┐
│  4. HUMAN REVIEW (if required)          │
│     • Escalate to human                 │
│     • Show consolidated findings        │
│     • Human approves/rejects            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. FINAL DECISION                      │
│     • Update artifact status            │
│     • Notify originating agent          │
│     • Continue or rollback              │
└─────────────────────────────────────────┘
```

---

## 8. Approval Workflow Model

### 8.1 Approval Levels

```typescript
type ApprovalLevel = 
  | 'auto'                 // No approval needed (automated)
  | 'peer'                 // Agent peer review
  | 'lead'                 // Department lead (or senior agent)
  | 'manager'              // CEO Agent
  | 'human';               // Human intervention required

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface ApprovalRequest {
  id: string;
  level: ApprovalLevel;
  
  // What needs approval
  artifactId: string;
  artifact: Artifact;
  
  // Who approves
  approver: AgentId | 'human';
  
  // Approval criteria
  criteria: string[];
  
  // Timing
  requestedAt: string;
  expiresAt?: string;
  timeoutMs: number;
  
  // Context for decision
  context: {
    project: Project;
    impact: 'low' | 'medium' | 'high' | 'critical';
    risk: 'low' | 'medium' | 'high';
    costUsd: number;
    previousApprovals: ApprovalResult[];
  };
}

interface ApprovalResult {
  approvalId: string;
  approverId: AgentId | 'human';
  
  decision: 'approved' | 'rejected';
  conditions?: string[];    // Approved with conditions
  comments: string;
  
  decidedAt: string;
  duration: number;         // ms
}
```

### 8.2 Approval Matrix

```typescript
const APPROVAL_MATRIX: Record<string, ApprovalLevel> = {
  // Simple changes
  'component-minor-change':    'auto',
  'style-update':              'auto',
  'documentation-update':      'auto',
  
  // Moderate changes
  'new-component':             'peer',
  'page-restructure':          'peer',
  'api-change':                'peer',
  
  // Significant changes
  'architecture-change':       'lead',
  'new-feature':               'lead',
  'security-fix':              'lead',
  
  // Critical changes
  'production-deployment':     'manager',
  'breaking-change':           'manager',
  'cost-impact':               'manager',
  
  // Human-required
  'legal-compliance':          'human',
  'data-privacy':              'human',
  'brand-change':              'human',
};
```

### 8.3 Approval Flow

```
Artifact Ready for Approval
         │
         ▼
┌─────────────────────────────────────────┐
│  1. DETERMINE APPROVAL LEVEL            │
│     • Check approval matrix             │
│     • Consider impact/risk              │
│     • Check previous approvals          │
└──────────────┬──────────────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
   ┌───────┐ ┌───────┐ ┌───────┐
   │ AUTO  │ │ PEER  │ │LEAD/  │
   │       │ │       │ │MANAGER│
   └───┬───┘ └───┬───┘ └───┬───┘
       │         │         │
       ▼         ▼         ▼
┌─────────────────────────────────────────┐
│  2. COLLECT APPROVALS                   │
│     • Single or multi-approver          │
│     • Parallel collection               │
│     • Timeout handling                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. CONSOLIDATE DECISIONS               │
│     • All must approve (or majority)    │
│     • Handle rejections                 │
│     • Apply conditions                  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
   ┌───────┐ ┌───────┐ ┌───────┐
   │APPROVE│ │REJECT │ │EXPIRE │
   │       │ │       │ │       │
   └───┬───┘ └───┬───┘ └───┬───┘
       │         │         │
       ▼         ▼         ▼
┌─────────────────────────────────────────┐
│  4. EXECUTE DECISION                    │
│     • Update artifact status            │
│     • Notify all stakeholders           │
│     • Continue or rollback pipeline     │
└─────────────────────────────────────────┘
```

---

## 9. End-to-End Demonstration

### 9.1 User Request

```
User: "Build a supplement ecommerce store with product catalog, 
       shopping cart, user accounts, and a blog for health articles."
```

### 9.2 Complete Agent Participation Flow

```
═══════════════════════════════════════════════════════════════════════
PHASE 1: INTAKE & ROUTING (0-2 seconds)
═══════════════════════════════════════════════════════════════════════

[USER REQUEST]
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CEO AGENT (Strategic Oversight)                                     │
│ • Receives user request                                             │
│ • Validates request completeness                                    │
│ • Determines complexity: COMPLEX (multi-feature ecommerce)          │
│ • Routes to Coordinator Agent                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ COORDINATOR AGENT (Workflow Orchestration)                          │
│ • Analyzes request: ecommerce + blog = hybrid                       │
│ • Consults Requirement Understanding Engine                         │
│ • Factory routing: ecommerce (primary) + website (blog component)   │
│ • Creates execution plan with dependency graph                      │
│ • Spawns parallel workstreams                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   PRODUCT            RESEARCH            DESIGN
   WORKSTREAM         WORKSTREAM          WORKSTREAM

═══════════════════════════════════════════════════════════════════════
PHASE 2: PRODUCT & RESEARCH (2-10 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ PRODUCT MANAGER AGENT                                               │
│ • Extracts requirements:                                            │
│   - Product catalog (categories, search, filters)                   │
│   - Shopping cart (add/remove, quantities, checkout)                │
│   - User accounts (registration, login, profile, order history)     │
│   - Blog (articles, categories, comments)                           │
│ • Prioritizes features (MVP vs. future)                             │
│ • Creates PRD artifact                                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ PRODUCT STRATEGIST AGENT                                            │
│ • Market positioning: premium supplements                           │
│ • Monetization: direct sales + subscription                         │
│ • Differentiation: lab-tested, transparent sourcing                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ COMPETITIVE RESEARCH AGENT                                          │
│ • Analyzes: GNC, Vitacost, Thorne, Athletic Greens                 │
│ • Identifies: UX patterns, pricing strategies, content approaches   │
│ • Battlecard: emphasize transparency and third-party testing        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ UX RESEARCH AGENT                                                   │
│ • Personas: health-conscious athlete, wellness enthusiast           │
│ • Journey map: discovery → research → purchase → reorder            │
│ • Pain points: complex ingredient lists, trust concerns             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ MARKET RESEARCH AGENT                                               │
│ • Market size: $15B supplement e-commerce (US)                      │
│ • Trends: personalized stacks, subscription models                  │
│ • Segmentation: athletes, wellness, medical, aging                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ CONSOLIDATED PRD       │
              │ + Market Analysis      │
              │ + User Personas        │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 3: DESIGN (10-25 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ UI/UX PRO MAX AGENT                                                 │
│ • Creates wireframes for:                                           │
│   - Homepage (hero, featured products, trust signals)               │
│   - Product listing (grid, filters, sorting)                        │
│   - Product detail (images, ingredients, reviews, add to cart)      │
│   - Cart (items, summary, checkout CTA)                             │
│   - Checkout (shipping, payment, confirmation)                      │
│   - User dashboard (orders, profile, wishlist)                      │
│   - Blog listing + article page                                     │
│ • User flow: browse → select → cart → checkout → account            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ DESIGN SYSTEM AGENT                                                 │
│ • Tokens:                                                            │
│   - Colors: Trust (green #2D5A27), Energy (orange #FF6B35),         │
│             Clean (white #FFFFFF), Premium (gold #C9A84C)           │
│   - Typography: Inter (body), Plus Jakarta Sans (headings)          │
│   - Spacing: 4px grid, 8/16/24/32/48/64 scale                      │
│ • Components: Button, Card, Badge, Input, Select, Modal, Toast      │
│ • Patterns: Product card, Cart item, Blog card, Review stars        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ 21ST.DEV COMPONENT AGENT                                            │
│ • Discovers relevant shadcn/ui components                           │
│ • Adapts to supplement store context                                 │
│ • Generates: ProductGrid, CartDrawer, CheckoutForm, BlogList        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ FRAMER MOTION AGENT                                                 │
│ • Animations:                                                       │
│   - Page transitions (slide, fade)                                  │
│   - Product card hover (scale, shadow)                              │
│   - Cart drawer (slide-in)                                          │
│   - Scroll reveals (staggered fade-up)                              │
│   - Loading skeletons                                               │
│ • Micro-interactions: button press, toggle, add-to-cart bounce      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ DESIGN SYSTEM          │
              │ + Wireframes           │
              │ + Component Specs      │
              │ + Animation Specs      │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 4: ARCHITECTURE (25-35 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND ARCHITECT AGENT                                            │
│ • Tech selection: Next.js 14, React 18, TypeScript, Tailwind        │
│ • State management: React Context + useReducer (cart, auth)         │
│ • Data fetching: Server Components + Route Handlers                 │
│ • File structure: App Router with parallel routes                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND ARCHITECT AGENT                                             │
│ • API design: RESTful endpoints                                     │
│   - /api/products (list, search, filter)                            │
│   - /api/cart (add, remove, update)                                 │
│   - /api/auth (register, login, logout)                             │
│   - /api/orders (create, list, detail)                              │
│   - /api/blog (list, detail, comments)                              │
│ • Authentication: NextAuth.js with credentials provider             │
│ • Payment: Stripe integration                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE ARCHITECT AGENT                                            │
│ • Schema:                                                           │
│   - products (id, name, price, description, images, category, stock)│
│   - categories (id, name, slug, description)                        │
│   - users (id, email, name, password_hash, role)                    │
│   - orders (id, user_id, status, total, shipping, payment)          │
│   - order_items (id, order_id, product_id, quantity, price)         │
│   - cart_items (id, user_id, product_id, quantity)                  │
│   - blog_posts (id, title, content, author_id, category, published) │
│   - reviews (id, product_id, user_id, rating, comment)              │
│ • ORM: Prisma with PostgreSQL                                       │
│ • Migrations: versioned, reversible                                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ API ARCHITECT AGENT                                                 │
│ • OpenAPI 3.0 specification                                         │
│ • Rate limiting: 100 req/min per user                               │
│ • Versioning: /api/v1/...                                           │
│ • Error handling: standardized JSON error responses                 │
│ • Documentation: auto-generated from OpenAPI                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ ARCHITECTURE SPEC      │
              │ + Database Schema      │
              │ + API Contracts        │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 5: ENGINEERING (35-80 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND ENGINEER AGENT                                             │
│ • Implements components:                                            │
│   - Header (logo, nav, cart icon, user menu)                        │
│   - ProductCard (image, name, price, add-to-cart)                   │
│   - ProductGrid (responsive grid, pagination)                       │
│   - ProductDetail (gallery, info, reviews, related)                 │
│   - CartDrawer (items, quantities, totals)                          │
│   - CheckoutForm (shipping, payment, validation)                    │
│   - UserDashboard (orders, profile, settings)                       │
│   - BlogList, BlogArticle                                           │
│   - Footer (links, newsletter, social)                              │
│ • Pages:                                                            │
│   - / (homepage)                                                    │
│   - /products (catalog with filters)                                │
│   - /products/[id] (product detail)                                 │
│   - /cart (cart page)                                               │
│   - /checkout (checkout flow)                                       │
│   - /account (user dashboard)                                       │
│   - /blog (blog listing)                                            │
│   - /blog/[slug] (blog article)                                     │
│ • Styling: Tailwind CSS with design system tokens                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND ENGINEER AGENT                                              │
│ • Implements API routes:                                            │
│   - Product CRUD with search/filter                                 │
│   - Cart management (add/update/remove)                             │
│   - Authentication (register/login/session)                         │
│   - Order processing                                                │
│   - Blog CRUD                                                       │
│   - Review system                                                   │
│ • Business logic:                                                   │
│   - Inventory management                                            │
│   - Price calculation (tax, shipping)                               │
│   - Order status workflow                                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE ENGINEER (via DB Architect)                                │
│ • Prisma schema implementation                                      │
│ • Seed data: sample products, categories, blog posts                │
│ • Migrations: initial schema                                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ GENERATED CODEBASE     │
              │ • 14-24 source files   │
│ │ • Components, pages, API routes     │
              │ • Config files          │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 6: QUALITY ASSURANCE (80-100 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ QA ENGINEER AGENT                                                   │
│ • Test strategy: unit + integration                                 │
│ • Generates test files:                                             │
│   - ProductCard.test.tsx                                            │
│   - CartDrawer.test.tsx                                             │
│   - CheckoutForm.test.tsx                                           │
│   - API routes integration tests                                    │
│ • Coverage target: 80%                                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ REVIEWER AGENT                                                      │
│ • Code review:                                                      │
│   - TypeScript strict mode compliance                               │
│   - Component patterns (single responsibility)                      │
│   - Import organization                                             │
│   - Error handling completeness                                     │
│ • Architecture review:                                              │
│   - Separation of concerns                                          │
│   - Data flow clarity                                               │
│   - Scalability concerns                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ SECURITY AGENT                                                      │
│ • Vulnerability scan:                                               │
│   - XSS prevention (sanitized inputs)                               │
│   - CSRF protection (SameSite cookies)                              │
│   - SQL injection (Prisma parameterized queries)                    │
│   - Authentication security (bcrypt, JWT best practices)            │
│ • OWASP Top 10 checklist                                           │
│ • Dependencies audit (npm audit)                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ PERFORMANCE AGENT                                                   │
│ • Core Web Vitals checks:                                           │
│   - LCP: image optimization, font loading                           │
│   - FID: event handler optimization                                 │
│   - CLS: layout stability                                           │
│ • Bundle analysis:                                                  │
│   - Tree shaking verification                                       │
│   - Code splitting strategy                                         │
│   - Dependency audit                                                │
│ • Caching strategy:                                                 │
│   - ISR for product pages                                           │
│   - Static generation for blog                                      │
│   - API response caching                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ QUALITY REPORT         │
              │ • Build: ✅ PASS        │
              │ • TypeCheck: ✅ PASS    │
              │ │ • Lint: ✅ PASS        │
              │ • Security: ✅ PASS     │
              │ • Performance: 95/100   │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 7: GROWTH & OPTIMIZATION (100-110 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ SEO SPECIALIST AGENT                                                │
│ • Technical SEO:                                                    │
│   - Meta tags (title, description, OG)                              │
│   - Structured data (Product, Organization, BlogPosting)            │
│   - Sitemap generation                                              │
│   - Robots.txt                                                      │
│   - Canonical URLs                                                  │
│ • Content SEO:                                                      │
│   - Keyword-optimized product descriptions                          │
│   - Blog content strategy                                           │
│   - Internal linking                                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ CRO AGENT                                                           │
│ • Conversion optimization:                                          │
│   - CTA placement and copy                                          │
│   - Trust signals (reviews, certifications, guarantees)             │
│   - Cart abandonment reduction                                      │
│   - Checkout flow optimization                                      │
│ • A/B test recommendations:                                         │
│   - Product page layout variations                                  │
│   - CTA color/copy tests                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ CONTENT STRATEGIST AGENT                                            │
│ • Content plan:                                                     │
│   - Product descriptions (benefit-focused)                          │
│   - Blog articles (education, trust-building)                       │
│   - FAQ content                                                      │
│   - Email templates (welcome, cart abandonment, reorder)            │
│ • Brand voice: authoritative, transparent, science-backed           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ ANALYTICS AGENT                                                     │
│ • Tracking implementation:                                          │
│   - Google Analytics 4 (e-commerce events)                          │
│   - Facebook Pixel (conversion tracking)                            │
│   - Hotjar (heatmaps, recordings)                                   │
│ • Dashboard setup:                                                  │
│   - Sales metrics                                                   │
│   - Conversion funnels                                              │
│   - Customer behavior                                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ GROWTH CONFIG          │
              │ • SEO metadata         │
              │ • Analytics setup      │
              │ • Content plan         │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 8: OPERATIONS & DEPLOYMENT (110-120 seconds, PARALLEL)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ DEVOPS ENGINEER AGENT                                               │
│ • CI/CD pipeline:                                                   │
│   - GitHub Actions workflow                                         │
│   - Build → Test → Lint → Deploy                                    │
│ • Infrastructure:                                                   │
│   - Vercel deployment config                                        │
│   - Environment variables                                           │
│   - Domain configuration                                            │
│ • Monitoring:                                                       │
│   - Error tracking (Sentry)                                         │
│   - Performance monitoring (Vercel Analytics)                       │
│   - Uptime monitoring                                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────────┐
│ DEPLOYMENT AGENT                                                    │
│ • Deployment checklist:                                             │
│   - ✅ Build passes                                                 │
│   - ✅ Tests pass                                                   │
│   - ✅ Security scan clean                                          │
│   - ✅ Performance budget met                                       │
│   - ✅ SEO metadata complete                                        │
│   - ✅ Analytics configured                                         │
│ • Deployment steps:                                                 │
│   - Push to main branch                                             │
│   - Vercel auto-deploy                                              │
│   - DNS configuration                                               │
│   - SSL certificate                                                 │
│ • Rollback plan documented                                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ DEPLOYMENT READY       │
              │ • CI/CD configured     │
              │ • Monitoring setup     │
              │ • Rollback plan        │
              └────────────┬───────────┘
                           │

═══════════════════════════════════════════════════════════════════════
PHASE 9: REVIEW & APPROVAL (120-130 seconds)
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ CEO AGENT (Final Review)                                            │
│ • Reviews consolidated output from all departments                  │
│ • Checks:                                                           │
│   - All requirements met                                            │
│   - Quality thresholds passed                                       │
│   - No critical security issues                                     │
│   - Performance acceptable                                          │
│   - SEO completeness                                                │
│ • Decision: APPROVE                                                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ COORDINATOR AGENT (Final Assembly)                                  │
│ • Assembles final project:                                          │
│   - Source code (14-24 files)                                       │
│   - Blueprint (JSON + YAML)                                         │
│   - Documentation                                                   │
│   - Deployment config                                               │
│ • Records to Memory (Phase 6):                                      │
│   - Project metadata                                                │
│   - Blueprint for future reference                                  │
│   - Patterns learned                                                │
│   - Quality metrics                                                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼

═══════════════════════════════════════════════════════════════════════
FINAL OUTPUT
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                     SUPPLEMENT E-COMMERCE STORE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📁 PROJECT STRUCTURE                                               │
│  ├── src/app/                                                       │
│  │   ├── layout.tsx              (Root layout)                      │
│  │   ├── page.tsx                (Homepage)                         │
│  │   ├── globals.css             (Styles)                           │
│  │   ├── products/page.tsx       (Product catalog)                  │
│  │   ├── products/[id]/page.tsx  (Product detail)                   │
│  │   ├── cart/page.tsx           (Shopping cart)                    │
│  │   ├── checkout/page.tsx       (Checkout flow)                    │
│  │   ├── account/page.tsx        (User dashboard)                   │
│  │   ├── blog/page.tsx           (Blog listing)                     │
│  │   ├── blog/[slug]/page.tsx    (Blog article)                     │
│  │   └── api/                                                       │
│  │       ├── products/route.ts   (Product API)                      │
│  │       ├── cart/route.ts       (Cart API)                         │
│  │       ├── auth/route.ts       (Auth API)                         │
│  │       ├── orders/route.ts     (Orders API)                       │
│  │       └── blog/route.ts       (Blog API)                         │
│  ├── src/components/                                                │
│  │   ├── Header.tsx              (Navigation)                       │
│  │   ├── Footer.tsx              (Footer)                           │
│  │   ├── ProductCard.tsx         (Product card)                     │
│  │   ├── ProductGrid.tsx         (Product grid)                     │
│  │   ├── CartDrawer.tsx          (Cart drawer)                      │
│  │   ├── CheckoutForm.tsx        (Checkout form)                    │
│  │   ├── UserDashboard.tsx       (User dashboard)                   │
│  │   ├── BlogList.tsx            (Blog listing)                     │
│  │   ├── BlogArticle.tsx         (Blog article)                     │
│  │   └── ... (more components)                                      │
│  ├── src/lib/                                                       │
│  │   ├── types.ts                (TypeScript types)                 │
│  │   ├── mock-data.ts            (Sample data)                      │
│  │   └── utils.ts                (Utility functions)                │
│  ├── package.json                                                   │
│  ├── tsconfig.json                                                  │
│  ├── next.config.mjs                                                │
│  ├── tailwind.config.mjs                                            │
│  └── postcss.config.mjs                                             │
│                                                                     │
│  📊 QUALITY METRICS                                                 │
│  ├── Build Success: ✅ 100%                                         │
│  ├── TypeScript: ✅ 0 errors                                        │
│  ├── Lint: ✅ 0 warnings                                            │
│  ├── Security: ✅ Passed                                            │
│  ├── Performance: 95/100                                            │
│  ├── SEO: 92/100                                                    │
│  └── Overall Score: 95/100                                          │
│                                                                     │
│  📦 FILES: 22                                                       │
│  ⏱️  GENERATION TIME: ~120 seconds                                  │
│  🏭 FACTORY: ecommerce (primary) + website (blog)                   │
│                                                                     │
│  🧠 MEMORY RECORDED                                                 │
│  ├── Project stored for future reference                            │
│  ├── Patterns extracted: navigation, color scheme, product cards    │
│  ├── Blueprint saved for similar requests                           │
│  └── Quality metrics updated                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.3 Agent Participation Summary

| Department | Agents | Contribution |
|------------|--------|--------------|
| **Executive** | CEO, Coordinator | Routing, orchestration, final approval |
| **Product** | PM, Strategist, Competitive | Requirements, positioning, market analysis |
| **Research** | UX Research, Market Research | Personas, journey maps, market data |
| **Design** | UI/UX, Design System, 21st.dev, Framer Motion | Wireframes, tokens, components, animations |
| **Engineering** | FE Arch, BE Arch, DB Arch, API Arch, FE Eng, BE Eng | Architecture, code, database, APIs |
| **Quality** | QA, Reviewer, Security, Performance | Testing, review, security, optimization |
| **Growth** | SEO, CRO, Content, Analytics | SEO, conversion, content, tracking |
| **Operations** | DevOps, Deployment | CI/CD, infrastructure, deployment |
| **Website Intelligence** | (Not used for new builds) | (Used for clones/rebuilds) |

**Total: 32 agents, 9 departments, ~120 seconds end-to-end**

---

## Implementation Plan

### Phase 7.1: LangGraph Runtime Core
- Agent state machine implementation
- Message bus (Redis/In-memory)
- Basic orchestration

### Phase 7.2: Agent Definitions
- All 32 agent configurations
- Capability declarations
- Input/output schemas

### Phase 7.3: Communication & Memory
- Shared memory integration (Phase 6)
- Artifact management
- Inter-agent messaging

### Phase 7.4: Human-in-the-Loop
- Review workflows
- Approval gates
- Escalation paths

### Phase 7.5: Failure Recovery
- Retry strategies
- Fallback agents
- Rollback mechanisms

---

*Architecture designed for implementation in Phase 7.1-7.5*
