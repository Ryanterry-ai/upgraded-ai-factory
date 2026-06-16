// Phase 7.5: Artifact Injection Layer

import { AgentArtifact, ArtifactType } from '../state/agent-state.js';
import { createArtifact } from '../communication/artifact-schema.js';

export interface ArtifactInjectionConfig {
  maxArtifacts: number;
  includeMetadata: boolean;
  includeContent: boolean;
  contentTruncateLimit: number;
}

const DEFAULT_INJECTION_CONFIG: ArtifactInjectionConfig = {
  maxArtifacts: 10,
  includeMetadata: true,
  includeContent: true,
  contentTruncateLimit: 2000
};

export interface InjectedArtifact {
  id: string;
  type: string;
  name: string;
  status: string;
  summary: string;
  contentPreview?: string;
  metadata?: Record<string, unknown>;
}

export class ArtifactInjector {
  private config: ArtifactInjectionConfig;

  constructor(config: Partial<ArtifactInjectionConfig> = {}) {
    this.config = { ...DEFAULT_INJECTION_CONFIG, ...config };
  }

  injectArtifacts(
    artifacts: AgentArtifact[],
    agentOutputTypes: ArtifactType[]
  ): InjectedArtifact[] {
    const relevantArtifacts = this.filterRelevantArtifacts(artifacts, agentOutputTypes);
    const limitedArtifacts = relevantArtifacts.slice(0, this.config.maxArtifacts);

    return limitedArtifacts.map(artifact => this.formatArtifact(artifact));
  }

  private filterRelevantArtifacts(
    artifacts: AgentArtifact[],
    agentOutputTypes: ArtifactType[]
  ): AgentArtifact[] {
    return artifacts.filter(artifact => {
      if (agentOutputTypes.includes(artifact.type)) {
        return true;
      }

      if (artifact.status === 'validated' || artifact.status === 'approved') {
        return true;
      }

      return false;
    });
  }

  private formatArtifact(artifact: AgentArtifact): InjectedArtifact {
    const injected: InjectedArtifact = {
      id: artifact.id,
      type: artifact.type,
      name: artifact.name,
      status: artifact.status,
      summary: this.createSummary(artifact)
    };

    if (this.config.includeContent) {
      injected.contentPreview = this.createContentPreview(artifact);
    }

    if (this.config.includeMetadata) {
      injected.metadata = {
        factory: artifact.metadata.factory,
        version: artifact.metadata.version,
        dependencies: artifact.metadata.dependencies,
        exports: artifact.metadata.exports
      };
    }

    return injected;
  }

  private createSummary(artifact: AgentArtifact): string {
    const content = artifact.content as Record<string, unknown>;

    if (!content) {
      return `Empty ${artifact.type}`;
    }

    switch (artifact.type) {
      case 'component':
        return `React component: ${content.name || 'Unknown'}`;
      case 'page':
        return `Page: ${content.path || '/'}`;
      case 'api_route':
        return `API route: ${content.method || 'GET'} ${content.path || '/'}`;
      case 'config':
        return `Config: ${content.filename || 'unknown'}`;
      case 'blueprint':
        return `Blueprint: ${content.name || 'Unknown'} (${content.type || 'general'})`;
      case 'schema':
        return `Schema: ${content.name || 'Unknown'}`;
      case 'test':
        return `Test: ${content.name || 'Unknown'}`;
      case 'documentation':
        return `Documentation: ${content.title || 'Unknown'}`;
      default:
        return `${artifact.type}: ${artifact.name}`;
    }
  }

  private createContentPreview(artifact: AgentArtifact): string {
    const content = artifact.content;

    if (!content) {
      return '';
    }

    if (typeof content === 'string') {
      return content.substring(0, this.config.contentTruncateLimit);
    }

    const contentStr = JSON.stringify(content, null, 2);
    return contentStr.substring(0, this.config.contentTruncateLimit);
  }

  formatForInjection(artifacts: InjectedArtifact[]): string {
    if (artifacts.length === 0) {
      return 'No artifacts available.';
    }

    const sections: string[] = [];

    sections.push('## Available Artifacts');
    sections.push('');

    for (const artifact of artifacts) {
      sections.push(`### ${artifact.name} (${artifact.type})`);
      sections.push(`Status: ${artifact.status}`);
      sections.push(`Summary: ${artifact.summary}`);

      if (artifact.contentPreview) {
        sections.push('');
        sections.push('**Content Preview:**');
        sections.push('```');
        sections.push(artifact.contentPreview);
        sections.push('```');
      }

      if (artifact.metadata) {
        sections.push('');
        sections.push('**Metadata:**');
        if (artifact.metadata.dependencies && (artifact.metadata.dependencies as string[]).length > 0) {
          sections.push(`- Dependencies: ${(artifact.metadata.dependencies as string[]).join(', ')}`);
        }
        if (artifact.metadata.exports && (artifact.metadata.exports as string[]).length > 0) {
          sections.push(`- Exports: ${(artifact.metadata.exports as string[]).join(', ')}`);
        }
      }

      sections.push('');
    }

    return sections.join('\n');
  }

  createArtifactFromOutput(
    agentId: string,
    agentName: string,
    factoryType: string,
    outputType: ArtifactType,
    content: unknown
  ): AgentArtifact {
    return createArtifact(
      `${agentId}-${outputType}-${Date.now()}`,
      outputType,
      `${agentName}_${outputType}`,
      content,
      {
        factory: factoryType,
        version: '1.0.0',
        dependencies: [],
        exports: [`${agentName}_${outputType}`],
        imports: []
      }
    );
  }
}

export function createArtifactInjector(config?: Partial<ArtifactInjectionConfig>): ArtifactInjector {
  return new ArtifactInjector(config);
}
