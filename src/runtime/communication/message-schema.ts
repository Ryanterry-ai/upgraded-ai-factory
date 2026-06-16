// Phase 7: Message Schema

import { MessageType, MessagePayload, AgentMessage, createAgentMessage } from '../state/agent-state.js';

export interface MessageBus {
  send(message: AgentMessage): void;
  receive(agentId: string): AgentMessage[];
  subscribe(agentId: string, callback: (message: AgentMessage) => void): void;
  unsubscribe(agentId: string): void;
}

export class InMemoryMessageBus implements MessageBus {
  private queues: Map<string, AgentMessage[]> = new Map();
  private subscribers: Map<string, (message: AgentMessage) => void> = new Map();
  private history: AgentMessage[] = [];

  send(message: AgentMessage): void {
    this.history.push(message);
    
    const queue = this.queues.get(message.to) || [];
    queue.push(message);
    this.queues.set(message.to, queue);

    const subscriber = this.subscribers.get(message.to);
    if (subscriber) {
      subscriber(message);
    }

    message.status = 'sent';
  }

  receive(agentId: string): AgentMessage[] {
    const queue = this.queues.get(agentId) || [];
    this.queues.set(agentId, []);
    return queue;
  }

  subscribe(agentId: string, callback: (message: AgentMessage) => void): void {
    this.subscribers.set(agentId, callback);
  }

  unsubscribe(agentId: string): void {
    this.subscribers.delete(agentId);
  }

  getHistory(): AgentMessage[] {
    return [...this.history];
  }

  getPendingMessages(agentId: string): AgentMessage[] {
    return (this.queues.get(agentId) || []).filter(m => m.status === 'pending');
  }

  getStats(): { total: number; pending: number; delivered: number; processed: number } {
    const total = this.history.length;
    const pending = this.history.filter(m => m.status === 'pending').length;
    const delivered = this.history.filter(m => m.status === 'sent' || m.status === 'delivered').length;
    const processed = this.history.filter(m => m.status === 'processed').length;
    return { total, pending, delivered, processed };
  }
}

export function createTaskAssignment(
  from: string,
  to: string,
  taskId: string,
  taskType: string,
  context: Record<string, unknown>
): AgentMessage {
  return createAgentMessage(from, to, 'task_assignment', `Assign task: ${taskType}`, {
    taskId,
    taskType,
    context
  });
}

export function createTaskComplete(
  from: string,
  to: string,
  taskId: string,
  artifacts: string[]
): AgentMessage {
  return createAgentMessage(from, to, 'task_complete', `Task completed: ${taskId}`, {
    taskId,
    artifacts
  });
}

export function createTaskFailed(
  from: string,
  to: string,
  taskId: string,
  error: string,
  stack?: string
): AgentMessage {
  return createAgentMessage(from, to, 'task_failed', `Task failed: ${error}`, {
    taskId,
    error,
    stack
  });
}

export function createArtifactReady(
  from: string,
  to: string,
  artifactId: string,
  artifactType: string
): AgentMessage {
  return createAgentMessage(from, to, 'artifact_ready', `Artifact ready: ${artifactType}`, {
    artifactId,
    artifactType
  });
}

export function createArtifactReview(
  from: string,
  to: string,
  artifactId: string,
  reviewType: string
): AgentMessage {
  return createAgentMessage(from, to, 'artifact_review', `Review requested: ${reviewType}`, {
    artifactId,
    reviewType
  });
}

export function createRequestData(
  from: string,
  to: string,
  dataType: string,
  purpose: string
): AgentMessage {
  return createAgentMessage(from, to, 'request_data', `Requesting data: ${dataType}`, {
    dataType,
    purpose
  });
}

export function createProvideData(
  from: string,
  to: string,
  dataType: string,
  data: unknown
): AgentMessage {
  return createAgentMessage(from, to, 'provide_data', `Providing data: ${dataType}`, {
    dataType,
    data
  });
}

export function createRequestApproval(
  from: string,
  to: string,
  artifactId: string,
  level: string
): AgentMessage {
  return createAgentMessage(from, to, 'request_approval', `Approval requested: ${level}`, {
    artifactId,
    level
  });
}

export function createApprovalGranted(
  from: string,
  to: string,
  artifactId: string,
  conditions: string[]
): AgentMessage {
  return createAgentMessage(from, to, 'approval_granted', `Approval granted for ${artifactId}`, {
    artifactId,
    conditions
  });
}

export function createApprovalDenied(
  from: string,
  to: string,
  artifactId: string,
  reasons: string[]
): AgentMessage {
  return createAgentMessage(from, to, 'approval_denied', `Approval denied for ${artifactId}`, {
    artifactId,
    reasons
  });
}

export function createEscalation(
  from: string,
  to: string,
  issue: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): AgentMessage {
  return createAgentMessage(from, to, 'escalation', `Escalation: ${issue}`, {
    issue,
    severity
  });
}

export function createSync(
  from: string,
  to: string,
  state: Record<string, unknown>
): AgentMessage {
  return createAgentMessage(from, to, 'sync', 'State synchronization', {
    state
  });
}

export function createHeartbeat(
  from: string,
  to: string,
  status: string
): AgentMessage {
  return createAgentMessage(from, to, 'heartbeat', `Status: ${status}`, {
    status,
    timestamp: new Date().toISOString()
  });
}
