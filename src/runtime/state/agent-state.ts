// Phase 7: Agent State Model

export type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'paused' | 'cancelled';

export type FailureType = 
  | 'import_error'
  | 'type_error'
  | 'missing_component'
  | 'missing_use_client'
  | 'missing_dependency'
  | 'config_error'
  | 'build_error'
  | 'runtime_error'
  | 'security_vulnerability';

export type RecoveryStrategy = 
  | 'auto_fix'
  | 'fallback_agent'
  | 'skip_artifact'
  | 'human_escalation'
  | 'retry_with_context'
  | 'fail_gracefully';

export type ReviewType = 
  | 'artifact_quality'
  | 'security_audit'
  | 'performance_check'
  | 'accessibility_review'
  | 'design_consistency'
  | 'architecture_review'
  | 'code_quality'
  | 'final_approval';

export type ApprovalLevel = 'none' | 'auto' | 'review' | 'critical';

export interface ExecutionStep {
  id: string;
  agentId: string;
  action: string;
  status: AgentStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  startTime: string;
  endTime?: string;
  retryCount: number;
  maxRetries: number;
}

export interface AgentState {
  id: string;
  name: string;
  department: string;
  status: AgentStatus;
  currentStep: string | null;
  executionHistory: ExecutionStep[];
  artifacts: AgentArtifact[];
  messages: AgentMessage[];
  memory: AgentMemory;
  context: Record<string, unknown>;
  error?: string;
  startTime: string;
  endTime?: string;
  totalDuration: number;
}

export interface AgentMemory {
  working: Record<string, unknown>;
  shared: Record<string, unknown>;
  persistent: Record<string, unknown>;
  knowledge: KnowledgeEntry[];
}

export interface KnowledgeEntry {
  id: string;
  type: 'pattern' | 'component' | 'design_system' | 'error_fix';
  content: unknown;
  confidence: number;
  source: string;
  lastUsed: string;
  useCount: number;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  payload: MessagePayload;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'processed';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type MessageType = 
  | 'task_assignment'
  | 'task_complete'
  | 'task_failed'
  | 'artifact_ready'
  | 'artifact_review'
  | 'request_data'
  | 'provide_data'
  | 'request_approval'
  | 'approval_granted'
  | 'approval_denied'
  | 'escalation'
  | 'sync'
  | 'heartbeat';

export interface MessagePayload {
  content: string;
  data?: unknown;
  artifacts?: string[];
  errors?: string[];
}

export interface AgentArtifact {
  id: string;
  type: ArtifactType;
  name: string;
  content: unknown;
  metadata: ArtifactMetadata;
  status: 'pending' | 'validated' | 'approved' | 'rejected' | 'repaired';
  validationErrors: string[];
  createdAt: string;
  updatedAt: string;
}

export type ArtifactType = 
  | 'blueprint'
  | 'component'
  | 'page'
  | 'api_route'
  | 'config'
  | 'schema'
  | 'test'
  | 'documentation'
  | 'design_system'
  | 'database_schema'
  | 'environment_config'
  | 'deployment_config'
  | 'analytics_config'
  | 'security_config'
  | 'performance_config';

export interface ArtifactMetadata {
  factory: string;
  version: string;
  checksum: string;
  size: number;
  dependencies: string[];
  exports: string[];
  imports: string[];
}

export interface WorkflowNode {
  id: string;
  agentId: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'parallel' | 'review';
  edges: WorkflowEdge[];
  config: NodeConfig;
}

export interface WorkflowEdge {
  target: string;
  condition?: string;
  priority: number;
}

export interface NodeConfig {
  timeout: number;
  retries: number;
  requiredArtifacts: string[];
  approvalRequired: boolean;
  approvalLevel: ApprovalLevel;
}

export interface ReviewDecision {
  id: string;
  reviewType: ReviewType;
  reviewer: string;
  decision: 'approved' | 'rejected' | 'needs_changes';
  comments: string[];
  conditions: string[];
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  artifactId: string;
  requestor: string;
  approvers: string[];
  level: ApprovalLevel;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  decisions: ReviewDecision[];
  deadline: string;
  createdAt: string;
}

export interface FailureRecord {
  id: string;
  agentId: string;
  failureType: FailureType;
  error: string;
  stack?: string;
  context: Record<string, unknown>;
  recoveryStrategy: RecoveryStrategy;
  recoveryAttempted: boolean;
  recoverySuccessful: boolean;
  timestamp: string;
}

export interface RecoveryAction {
  id: string;
  failureId: string;
  strategy: RecoveryStrategy;
  action: string;
  result: 'success' | 'failure' | 'partial';
  output?: unknown;
  error?: string;
  timestamp: string;
}

export interface RuntimeConfig {
  maxConcurrentAgents: number;
  defaultTimeout: number;
  maxRetries: number;
  enableMemory: boolean;
  enableRecovery: boolean;
  enableReview: boolean;
  enableApproval: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  maxConcurrentAgents: 5,
  defaultTimeout: 30000,
  maxRetries: 3,
  enableMemory: true,
  enableRecovery: true,
  enableReview: true,
  enableApproval: false,
  logLevel: 'info'
};

export function createInitialState(agentId: string, department: string, name: string): AgentState {
  return {
    id: agentId,
    name,
    department,
    status: 'idle',
    currentStep: null,
    executionHistory: [],
    artifacts: [],
    messages: [],
    memory: {
      working: {},
      shared: {},
      persistent: {},
      knowledge: []
    },
    context: {},
    startTime: new Date().toISOString(),
    totalDuration: 0
  };
}

export function createExecutionStep(agentId: string, action: string): ExecutionStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    action,
    status: 'queued',
    startTime: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3
  };
}

export function createAgentMessage(
  from: string,
  to: string,
  type: MessageType,
  content: string,
  data?: unknown
): AgentMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    type,
    payload: { content, data },
    timestamp: new Date().toISOString(),
    status: 'pending',
    priority: 'medium'
  };
}

export function createFailureRecord(
  agentId: string,
  failureType: FailureType,
  error: string,
  stack?: string
): FailureRecord {
  return {
    id: `fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    failureType,
    error,
    stack,
    context: {},
    recoveryStrategy: 'auto_fix',
    recoveryAttempted: false,
    recoverySuccessful: false,
    timestamp: new Date().toISOString()
  };
}

export function createApprovalRequest(
  artifactId: string,
  requestor: string,
  level: ApprovalLevel,
  deadlineMinutes: number = 60
): ApprovalRequest {
  const now = new Date();
  const deadline = new Date(now.getTime() + deadlineMinutes * 60000);
  
  return {
    id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    artifactId,
    requestor,
    approvers: [],
    level,
    status: 'pending',
    decisions: [],
    deadline: deadline.toISOString(),
    createdAt: now.toISOString()
  };
}
