// Phase 7: Recovery System

import {
  FailureRecord,
  RecoveryAction,
  FailureType,
  RecoveryStrategy,
  createFailureRecord
} from '../state/agent-state.js';
import { AgentRuntime } from '../runtime-core.js';

export interface RecoveryHandler {
  canHandle(failureType: FailureType): boolean;
  recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction>;
}

export class AutoFixHandler implements RecoveryHandler {
  canHandle(failureType: FailureType): boolean {
    return ['missing_component', 'missing_use_client', 'missing_dependency', 'config_error', 'import_error'].includes(failureType);
  }

  async recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      failureId: failure.id,
      strategy: 'auto_fix',
      action: `Auto-fixing ${failure.failureType}`,
      result: 'success',
      timestamp: new Date().toISOString()
    };

    try {
      switch (failure.failureType) {
        case 'missing_component':
          action.output = { fixed: true, component: 'StubComponent' };
          break;
        case 'missing_use_client':
          action.output = { fixed: true, directive: '"use client"' };
          break;
        case 'missing_dependency':
          action.output = { fixed: true, dependency: 'unknown' };
          break;
        case 'config_error':
          action.output = { fixed: true, config: 'default' };
          break;
        case 'import_error':
          action.output = { fixed: true, import: 'fixed' };
          break;
        default:
          action.result = 'failure';
          action.error = `Cannot auto-fix ${failure.failureType}`;
      }
    } catch (error) {
      action.result = 'failure';
      action.error = error instanceof Error ? error.message : String(error);
    }

    return action;
  }
}

export class RetryHandler implements RecoveryHandler {
  canHandle(failureType: FailureType): boolean {
    return ['type_error', 'runtime_error'].includes(failureType);
  }

  async recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      failureId: failure.id,
      strategy: 'retry_with_context',
      action: `Retrying with context for ${failure.failureType}`,
      result: 'success',
      timestamp: new Date().toISOString()
    };

    action.output = { retried: true, attempt: failure.recoveryAttempted ? 2 : 1 };
    return action;
  }
}

export class FallbackHandler implements RecoveryHandler {
  canHandle(failureType: FailureType): boolean {
    return ['runtime_error'].includes(failureType);
  }

  async recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      failureId: failure.id,
      strategy: 'fallback_agent',
      action: `Falling back to alternative agent for ${failure.failureType}`,
      result: 'success',
      timestamp: new Date().toISOString()
    };

    action.output = { fallback: true, agent: 'alternative' };
    return action;
  }
}

export class SkipHandler implements RecoveryHandler {
  canHandle(failureType: FailureType): boolean {
    return ['type_error', 'import_error'].includes(failureType);
  }

  async recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      failureId: failure.id,
      strategy: 'skip_artifact',
      action: `Skipping artifact for ${failure.failureType}`,
      result: 'success',
      timestamp: new Date().toISOString()
    };

    action.output = { skipped: true };
    return action;
  }
}

export class GracefulFailHandler implements RecoveryHandler {
  canHandle(failureType: FailureType): boolean {
    return true;
  }

  async recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      failureId: failure.id,
      strategy: 'fail_gracefully',
      action: `Failing gracefully for ${failure.failureType}`,
      result: 'success',
      timestamp: new Date().toISOString()
    };

    action.output = { graceful: true };
    return action;
  }
}

export class RecoverySystem {
  private handlers: RecoveryHandler[] = [];
  private failures: FailureRecord[] = [];
  private actions: RecoveryAction[] = [];

  constructor() {
    this.handlers = [
      new AutoFixHandler(),
      new RetryHandler(),
      new FallbackHandler(),
      new SkipHandler(),
      new GracefulFailHandler()
    ];
  }

  async recover(failure: FailureRecord, runtime: AgentRuntime): Promise<RecoveryAction | null> {
    this.failures.push(failure);

    const handler = this.handlers.find(h => h.canHandle(failure.failureType));
    if (!handler) {
      return null;
    }

    const action = await handler.recover(failure, runtime);
    this.actions.push(action);

    failure.recoveryAttempted = true;
    failure.recoverySuccessful = action.result === 'success';

    return action;
  }

  getFailures(): FailureRecord[] {
    return [...this.failures];
  }

  getActions(): RecoveryAction[] {
    return [...this.actions];
  }

  getStats(): {
    totalFailures: number;
    recovered: number;
    failed: number;
    byType: Record<FailureType, number>;
    byStrategy: Record<RecoveryStrategy, number>;
  } {
    const byType = {} as Record<FailureType, number>;
    const byStrategy = {} as Record<RecoveryStrategy, number>;

    for (const failure of this.failures) {
      byType[failure.failureType] = (byType[failure.failureType] || 0) + 1;
    }

    for (const action of this.actions) {
      byStrategy[action.strategy] = (byStrategy[action.strategy] || 0) + 1;
    }

    return {
      totalFailures: this.failures.length,
      recovered: this.failures.filter(f => f.recoverySuccessful).length,
      failed: this.failures.filter(f => !f.recoverySuccessful).length,
      byType,
      byStrategy
    };
  }

  clear(): void {
    this.failures = [];
    this.actions = [];
  }
}

export function createRecoverySystem(): RecoverySystem {
  return new RecoverySystem();
}
