// Phase 7 & 7.5: Runtime Module Barrel Exports

// Phase 7: Core Runtime
export * from './state/agent-state.js';
export * from './agents/agent-definitions.js';
export * from './communication/message-schema.js';
export * from './runtime-core.js';
export * from './memory/runtime-memory.js';
export * from './recovery/recovery-system.js';
export * from './review/review-system.js';

// Phase 7.5: Agent Activation
export * from './llm/llm-client.js';
export * from './prompts/prompt-builder.js';
export * from './context/context-builder.js';
export * from './memory/memory-retrieval.js';
export * from './executor/artifact-injection.js';
export * from './executor/agent-executor.js';

// Re-export artifact-schema with type-only exports for interfaces
export type { ArtifactValidator, ValidationResult } from './communication/artifact-schema.js';
export {
  BlueprintValidator,
  ComponentValidator,
  PageValidator,
  ConfigValidator,
  ApiRouteValidator,
  SchemaValidator,
  TestValidator,
  getValidatorForArtifact,
  validateArtifact,
  createArtifact,
  markArtifactValidated,
  markArtifactApproved,
  markArtifactRejected,
  markArtifactRepaired
} from './communication/artifact-schema.js';
