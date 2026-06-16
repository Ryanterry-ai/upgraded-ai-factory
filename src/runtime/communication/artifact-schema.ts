// Phase 7: Artifact Schema

import {
  AgentArtifact,
  ArtifactType,
  ArtifactMetadata,
  createFailureRecord
} from '../state/agent-state.js';

export interface ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class BlueprintValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'blueprint') {
      errors.push('Artifact type must be blueprint');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('Blueprint content is required');
    } else {
      if (!content.name) warnings.push('Blueprint missing name');
      if (!content.type) warnings.push('Blueprint missing type');
      if (!content.factories) warnings.push('Blueprint missing factories');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export class ComponentValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'component') {
      errors.push('Artifact type must be component');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('Component content is required');
    } else {
      if (!content.name) errors.push('Component must have a name');
      if (!content.code) warnings.push('Component missing code');
      if (!content.props) warnings.push('Component missing props definition');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export class PageValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'page') {
      errors.push('Artifact type must be page');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('Page content is required');
    } else {
      if (!content.path) errors.push('Page must have a path');
      if (!content.components) warnings.push('Page missing components');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export class ConfigValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'config') {
      errors.push('Artifact type must be config');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('Config content is required');
    } else {
      if (!content.filename) warnings.push('Config missing filename');
      if (!content.content) warnings.push('Config missing content');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export class ApiRouteValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'api_route') {
      errors.push('Artifact type must be api_route');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('API route content is required');
    } else {
      if (!content.method) warnings.push('API route missing method');
      if (!content.path) warnings.push('API route missing path');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export class SchemaValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'schema') {
      errors.push('Artifact type must be schema');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('Schema content is required');
    } else {
      if (!content.name) warnings.push('Schema missing name');
      if (!content.fields) warnings.push('Schema missing fields');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export class TestValidator implements ArtifactValidator {
  validate(artifact: AgentArtifact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (artifact.type !== 'test') {
      errors.push('Artifact type must be test');
    }

    const content = artifact.content as Record<string, unknown>;
    if (!content) {
      errors.push('Test content is required');
    } else {
      if (!content.name) warnings.push('Test missing name');
      if (!content.tests) warnings.push('Test missing test cases');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export function getValidatorForArtifact(type: ArtifactType): ArtifactValidator {
  switch (type) {
    case 'blueprint': return new BlueprintValidator();
    case 'component': return new ComponentValidator();
    case 'page': return new PageValidator();
    case 'config': return new ConfigValidator();
    case 'api_route': return new ApiRouteValidator();
    case 'schema': return new SchemaValidator();
    case 'test': return new TestValidator();
    default: return new BlueprintValidator();
  }
}

export function validateArtifact(artifact: AgentArtifact): ValidationResult {
  const validator = getValidatorForArtifact(artifact.type);
  return validator.validate(artifact);
}

export function createArtifact(
  id: string,
  type: ArtifactType,
  name: string,
  content: unknown,
  metadata: Partial<ArtifactMetadata>
): AgentArtifact {
  const now = new Date().toISOString();
  return {
    id,
    type,
    name,
    content,
    metadata: {
      factory: metadata.factory || 'unknown',
      version: metadata.version || '1.0.0',
      checksum: metadata.checksum || '',
      size: metadata.size || JSON.stringify(content).length,
      dependencies: metadata.dependencies || [],
      exports: metadata.exports || [],
      imports: metadata.imports || []
    },
    status: 'pending',
    validationErrors: [],
    createdAt: now,
    updatedAt: now
  };
}

export function markArtifactValidated(artifact: AgentArtifact, errors: string[]): AgentArtifact {
  return {
    ...artifact,
    status: errors.length === 0 ? 'validated' : 'rejected',
    validationErrors: errors,
    updatedAt: new Date().toISOString()
  };
}

export function markArtifactApproved(artifact: AgentArtifact): AgentArtifact {
  return {
    ...artifact,
    status: 'approved',
    updatedAt: new Date().toISOString()
  };
}

export function markArtifactRejected(artifact: AgentArtifact, reason: string): AgentArtifact {
  return {
    ...artifact,
    status: 'rejected',
    validationErrors: [...artifact.validationErrors, reason],
    updatedAt: new Date().toISOString()
  };
}

export function markArtifactRepaired(artifact: AgentArtifact): AgentArtifact {
  return {
    ...artifact,
    status: 'repaired',
    updatedAt: new Date().toISOString()
  };
}
