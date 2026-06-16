// Phase 7: Runtime Module Barrel Exports

export * from './state/agent-state.js';
export * from './agents/agent-definitions.js';
export * from './communication/message-schema.js';
export * from './runtime-core.js';
export * from './memory/runtime-memory.js';
export * from './recovery/recovery-system.js';
export * from './review/review-system.js';

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
