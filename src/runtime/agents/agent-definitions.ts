// Phase 7: Agent Definitions

import {
  AgentState,
  AgentStatus,
  WorkflowNode,
  NodeConfig,
  ArtifactType,
  FailureType,
  RecoveryStrategy,
  ReviewType,
  ApprovalLevel,
  createInitialState,
  createExecutionStep,
  createAgentMessage
} from '../state/agent-state.js';

export interface AgentDefinition {
  id: string;
  name: string;
  department: string;
  description: string;
  capabilities: string[];
  inputTypes: string[];
  outputTypes: ArtifactType[];
  requiredInputs: string[];
  optionalInputs: string[];
  defaultConfig: NodeConfig;
  failureHandlers: FailureHandler[];
  reviewRequirements: ReviewRequirement[];
  dependencies: string[];
  maxConcurrency: number;
}

export interface FailureHandler {
  failureType: FailureType;
  strategy: RecoveryStrategy;
  fallbackAgent?: string;
  maxRetries: number;
}

export interface ReviewRequirement {
  reviewType: ReviewType;
  required: boolean;
  approvalLevel: ApprovalLevel;
  reviewers: string[];
}

// Department: Strategy (2 agents)
export const strategyAgents: AgentDefinition[] = [
  {
    id: 'strategic-planner',
    name: 'Strategic Planner',
    department: 'strategy',
    description: 'Creates project roadmap, milestones, and strategic direction',
    capabilities: ['roadmap', 'milestones', 'strategy', 'planning'],
    inputTypes: ['requirements', 'constraints', 'stakeholders'],
    outputTypes: ['blueprint', 'documentation'],
    requiredInputs: ['requirements'],
    optionalInputs: ['constraints', 'stakeholders', 'budget'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: [],
    maxConcurrency: 1
  },
  {
    id: 'product-architect',
    name: 'Product Architect',
    department: 'strategy',
    description: 'Designs product architecture, tech stack, and system design',
    capabilities: ['architecture', 'tech_stack', 'system_design', 'patterns'],
    inputTypes: ['requirements', 'blueprint'],
    outputTypes: ['blueprint', 'schema', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['constraints', 'existing_systems'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['blueprint', 'schema'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['strategic-planner'],
    maxConcurrency: 1
  }
];

// Department: Design (4 agents)
export const designAgents: AgentDefinition[] = [
  {
    id: 'ui-designer',
    name: 'UI Designer',
    department: 'design',
    description: 'Creates UI layouts, components, and design systems',
    capabilities: ['ui_layout', 'components', 'design_system', 'responsive'],
    inputTypes: ['requirements', 'blueprint', 'design_system'],
    outputTypes: ['design_system', 'component', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['design_system', 'brand_guidelines'],
    defaultConfig: { timeout: 60000, retries: 2, requiredArtifacts: ['design_system'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'missing_component', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['product-architect'],
    maxConcurrency: 2
  },
  {
    id: 'ux-writer',
    name: 'UX Writer',
    department: 'design',
    description: 'Writes microcopy, labels, error messages, and accessibility text',
    capabilities: ['microcopy', 'accessibility', 'error_messages', 'labels'],
    inputTypes: ['requirements', 'blueprint', 'ui_components'],
    outputTypes: ['documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['ui_components', 'brand_voice'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['ui-designer'],
    maxConcurrency: 2
  },
  {
    id: 'motion-designer',
    name: 'Motion Designer',
    department: 'design',
    description: 'Creates animations, transitions, and micro-interactions',
    capabilities: ['animations', 'transitions', 'micro_interactions', 'motion'],
    inputTypes: ['requirements', 'ui_components'],
    outputTypes: ['component'],
    requiredInputs: ['requirements', 'ui_components'],
    optionalInputs: ['design_system', 'brand_guidelines'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['ui-designer'],
    maxConcurrency: 2
  },
  {
    id: 'brand-strategist',
    name: 'Brand Strategist',
    department: 'design',
    description: 'Defines brand identity, voice, and visual language',
    capabilities: ['brand_identity', 'voice', 'visual_language', 'style_guide'],
    inputTypes: ['requirements', 'stakeholders'],
    outputTypes: ['design_system', 'documentation'],
    requiredInputs: ['requirements'],
    optionalInputs: ['stakeholders', 'existing_brand'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: [],
    maxConcurrency: 1
  }
];

// Department: Frontend (5 agents)
export const frontendAgents: AgentDefinition[] = [
  {
    id: 'react-developer',
    name: 'React Developer',
    department: 'frontend',
    description: 'Builds React components, hooks, and state management',
    capabilities: ['react', 'components', 'hooks', 'state'],
    inputTypes: ['requirements', 'blueprint', 'design_system', 'ui_components'],
    outputTypes: ['component', 'page', 'config'],
    requiredInputs: ['requirements', 'blueprint', 'design_system'],
    optionalInputs: ['ui_components', 'existing_components'],
    defaultConfig: { timeout: 60000, retries: 3, requiredArtifacts: ['component', 'page'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'missing_component', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'missing_use_client', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'import_error', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['ui-designer', 'ux-writer'],
    maxConcurrency: 3
  },
  {
    id: 'nextjs-specialist',
    name: 'Next.js Specialist',
    department: 'frontend',
    description: 'Implements Next.js routing, SSR, SSG, and API routes',
    capabilities: ['nextjs', 'routing', 'ssr', 'ssg', 'api_routes'],
    inputTypes: ['requirements', 'blueprint', 'components'],
    outputTypes: ['page', 'api_route', 'config'],
    requiredInputs: ['requirements', 'blueprint', 'components'],
    optionalInputs: ['existing_routes', 'middleware'],
    defaultConfig: { timeout: 60000, retries: 3, requiredArtifacts: ['page', 'config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'config_error', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'missing_component', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'import_error', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['react-developer'],
    maxConcurrency: 2
  },
  {
    id: 'tailwind-specialist',
    name: 'Tailwind Specialist',
    department: 'frontend',
    description: 'Creates Tailwind CSS configurations and utility classes',
    capabilities: ['tailwind', 'css', 'styling', 'responsive'],
    inputTypes: ['requirements', 'design_system'],
    outputTypes: ['config', 'component'],
    requiredInputs: ['requirements', 'design_system'],
    optionalInputs: ['existing_config', 'brand_guidelines'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'config_error', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['ui-designer'],
    maxConcurrency: 2
  },
  {
    id: 'component-architect',
    name: 'Component Architect',
    department: 'frontend',
    description: 'Designs component hierarchy, composition patterns, and APIs',
    capabilities: ['component_design', 'composition', 'patterns', 'api_design'],
    inputTypes: ['requirements', 'blueprint', 'design_system'],
    outputTypes: ['component', 'schema', 'documentation'],
    requiredInputs: ['requirements', 'blueprint', 'design_system'],
    optionalInputs: ['existing_components', 'patterns'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['component'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['ui-designer', 'react-developer'],
    maxConcurrency: 1
  },
  {
    id: 'animation-engineer',
    name: 'Animation Engineer',
    department: 'frontend',
    description: 'Implements complex animations, transitions, and visual effects',
    capabilities: ['animations', 'gsap', 'framer_motion', 'css_animations'],
    inputTypes: ['requirements', 'ui_components', 'design_system'],
    outputTypes: ['component', 'config'],
    requiredInputs: ['requirements', 'ui_components'],
    optionalInputs: ['design_system', 'animation_library'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['motion-designer', 'react-developer'],
    maxConcurrency: 2
  }
];

// Department: Backend (4 agents)
export const backendAgents: AgentDefinition[] = [
  {
    id: 'api-developer',
    name: 'API Developer',
    department: 'backend',
    description: 'Builds REST/GraphQL APIs, middleware, and authentication',
    capabilities: ['api', 'rest', 'graphql', 'middleware', 'auth'],
    inputTypes: ['requirements', 'blueprint', 'schema'],
    outputTypes: ['api_route', 'config', 'schema'],
    requiredInputs: ['requirements', 'blueprint', 'schema'],
    optionalInputs: ['existing_api', 'auth_config'],
    defaultConfig: { timeout: 60000, retries: 3, requiredArtifacts: ['api_route', 'config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'import_error', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['product-architect'],
    maxConcurrency: 2
  },
  {
    id: 'database-architect',
    name: 'Database Architect',
    department: 'backend',
    description: 'Designs database schemas, migrations, and data models',
    capabilities: ['database', 'schema', 'migrations', 'data_modeling'],
    inputTypes: ['requirements', 'blueprint'],
    outputTypes: ['database_schema', 'schema', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['existing_database', 'performance_requirements'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['database_schema'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['product-architect'],
    maxConcurrency: 1
  },
  {
    id: 'auth-specialist',
    name: 'Auth Specialist',
    department: 'backend',
    description: 'Implements authentication, authorization, and security',
    capabilities: ['authentication', 'authorization', 'security', 'encryption'],
    inputTypes: ['requirements', 'blueprint', 'auth_config'],
    outputTypes: ['api_route', 'config', 'security_config'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['auth_provider', 'security_policies'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['security_config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'security_vulnerability', strategy: 'human_escalation', maxRetries: 1 },
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [
      { reviewType: 'security_audit', required: true, approvalLevel: 'review', reviewers: ['security-auditor'] }
    ],
    dependencies: ['api-developer', 'database-architect'],
    maxConcurrency: 1
  },
  {
    id: 'integration-engineer',
    name: 'Integration Engineer',
    department: 'backend',
    description: 'Connects external services, webhooks, and third-party APIs',
    capabilities: ['integrations', 'webhooks', 'third_party', 'etl'],
    inputTypes: ['requirements', 'blueprint', 'api_config'],
    outputTypes: ['api_route', 'config', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['existing_integrations', 'api_keys'],
    defaultConfig: { timeout: 60000, retries: 3, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'import_error', strategy: 'auto_fix', maxRetries: 3 },
      { failureType: 'runtime_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['api-developer'],
    maxConcurrency: 2
  }
];

// Department: Data (3 agents)
export const dataAgents: AgentDefinition[] = [
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    department: 'data',
    description: 'Analyzes data requirements, metrics, and reporting needs',
    capabilities: ['analytics', 'metrics', 'reporting', 'dashboards'],
    inputTypes: ['requirements', 'blueprint'],
    outputTypes: ['schema', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['existing_data', 'business_metrics'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: [],
    maxConcurrency: 1
  },
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    department: 'data',
    description: 'Implements AI features, ML models, and intelligent automation',
    capabilities: ['ai', 'ml', 'nlp', 'automation'],
    inputTypes: ['requirements', 'blueprint', 'data_models'],
    outputTypes: ['api_route', 'config', 'schema'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['training_data', 'model_config'],
    defaultConfig: { timeout: 90000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'runtime_error', strategy: 'retry_with_context', maxRetries: 2 },
      { failureType: 'missing_dependency', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['data-analyst'],
    maxConcurrency: 1
  },
  {
    id: 'search-optimizer',
    name: 'Search Optimizer',
    department: 'data',
    description: 'Optimizes search, filtering, and data retrieval',
    capabilities: ['search', 'filtering', 'indexing', 'optimization'],
    inputTypes: ['requirements', 'blueprint', 'data_models'],
    outputTypes: ['api_route', 'config'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['search_config', 'performance_requirements'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['data-analyst'],
    maxConcurrency: 1
  }
];

// Department: QA (4 agents)
export const qaAgents: AgentDefinition[] = [
  {
    id: 'test-engineer',
    name: 'Test Engineer',
    department: 'qa',
    description: 'Writes unit, integration, and end-to-end tests',
    capabilities: ['testing', 'unit_tests', 'integration_tests', 'e2e_tests'],
    inputTypes: ['requirements', 'components', 'api_routes'],
    outputTypes: ['test', 'documentation'],
    requiredInputs: ['requirements', 'components'],
    optionalInputs: ['existing_tests', 'test_config'],
    defaultConfig: { timeout: 60000, retries: 2, requiredArtifacts: ['test'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 },
      { failureType: 'import_error', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['react-developer', 'api-developer'],
    maxConcurrency: 2
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    department: 'qa',
    description: 'Audits code for vulnerabilities, OWASP issues, and security best practices',
    capabilities: ['security', 'vulnerabilities', 'owasp', 'penetration_testing'],
    inputTypes: ['requirements', 'components', 'api_routes', 'security_config'],
    outputTypes: ['documentation', 'security_config'],
    requiredInputs: ['requirements', 'components', 'api_routes'],
    optionalInputs: ['security_policies', 'compliance_requirements'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'security_vulnerability', strategy: 'human_escalation', maxRetries: 1 }
    ],
    reviewRequirements: [
      { reviewType: 'security_audit', required: true, approvalLevel: 'critical', reviewers: ['auth-specialist', 'tech-lead'] }
    ],
    dependencies: ['auth-specialist'],
    maxConcurrency: 1
  },
  {
    id: 'performance-tester',
    name: 'Performance Tester',
    department: 'qa',
    description: 'Tests performance, load capacity, and optimization opportunities',
    capabilities: ['performance', 'load_testing', 'optimization', 'profiling'],
    inputTypes: ['requirements', 'components', 'api_routes'],
    outputTypes: ['documentation', 'performance_config'],
    requiredInputs: ['requirements', 'components'],
    optionalInputs: ['performance_requirements', 'load_config'],
    defaultConfig: { timeout: 60000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'runtime_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['test-engineer'],
    maxConcurrency: 1
  },
  {
    id: 'accessibility-tester',
    name: 'Accessibility Tester',
    department: 'qa',
    description: 'Tests WCAG compliance, screen reader support, and keyboard navigation',
    capabilities: ['accessibility', 'wcag', 'screen_readers', 'keyboard_navigation'],
    inputTypes: ['requirements', 'components'],
    outputTypes: ['documentation'],
    requiredInputs: ['requirements', 'components'],
    optionalInputs: ['accessibility_policies'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['test-engineer'],
    maxConcurrency: 1
  }
];

// Department: DevOps (3 agents)
export const devopsAgents: AgentDefinition[] = [
  {
    id: 'cicd-engineer',
    name: 'CI/CD Engineer',
    department: 'devops',
    description: 'Sets up continuous integration, deployment, and delivery pipelines',
    capabilities: ['cicd', 'pipelines', 'deployment', 'automation'],
    inputTypes: ['requirements', 'blueprint'],
    outputTypes: ['deployment_config', 'config', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['cloud_provider', 'deployment_target'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['deployment_config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'config_error', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['product-architect'],
    maxConcurrency: 1
  },
  {
    id: 'cloud-architect',
    name: 'Cloud Architect',
    department: 'devops',
    description: 'Designs cloud infrastructure, scaling, and cost optimization',
    capabilities: ['cloud', 'infrastructure', 'scaling', 'cost_optimization'],
    inputTypes: ['requirements', 'blueprint', 'performance_requirements'],
    outputTypes: ['deployment_config', 'config', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['cloud_provider', 'budget', 'compliance'],
    defaultConfig: { timeout: 60000, retries: 2, requiredArtifacts: ['deployment_config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'config_error', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['cicd-engineer'],
    maxConcurrency: 1
  },
  {
    id: 'monitoring-engineer',
    name: 'Monitoring Engineer',
    department: 'devops',
    description: 'Sets up logging, monitoring, alerting, and observability',
    capabilities: ['monitoring', 'logging', 'alerting', 'observability'],
    inputTypes: ['requirements', 'blueprint', 'deployment_config'],
    outputTypes: ['config', 'documentation'],
    requiredInputs: ['requirements', 'deployment_config'],
    optionalInputs: ['monitoring_tools', 'alerting_rules'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'config_error', strategy: 'auto_fix', maxRetries: 3 }
    ],
    reviewRequirements: [],
    dependencies: ['cloud-architect'],
    maxConcurrency: 1
  }
];

// Department: Management (3 agents)
export const managementAgents: AgentDefinition[] = [
  {
    id: 'project-manager',
    name: 'Project Manager',
    department: 'management',
    description: 'Coordinates work across teams, manages timelines and deliverables',
    capabilities: ['coordination', 'timelines', 'deliverables', 'communication'],
    inputTypes: ['requirements', 'blueprint', 'team_status'],
    outputTypes: ['documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['team_capacity', 'deadlines'],
    defaultConfig: { timeout: 30000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['strategic-planner'],
    maxConcurrency: 1
  },
  {
    id: 'tech-lead',
    name: 'Tech Lead',
    department: 'management',
    description: 'Reviews technical decisions, enforces standards, and mentors teams',
    capabilities: ['review', 'standards', 'mentoring', 'architecture_review'],
    inputTypes: ['requirements', 'blueprint', 'components', 'api_routes'],
    outputTypes: ['documentation'],
    requiredInputs: ['requirements', 'blueprint', 'components'],
    optionalInputs: ['standards', 'patterns'],
    defaultConfig: { timeout: 45000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [
      { reviewType: 'architecture_review', required: true, approvalLevel: 'review', reviewers: ['tech-lead'] }
    ],
    dependencies: ['product-architect'],
    maxConcurrency: 1
  },
  {
    id: 'scrum-master',
    name: 'Scrum Master',
    department: 'management',
    description: 'Facilitates agile processes, removes blockers, and tracks progress',
    capabilities: ['agile', 'process', 'blockers', 'progress'],
    inputTypes: ['requirements', 'team_status'],
    outputTypes: ['documentation'],
    requiredInputs: ['requirements'],
    optionalInputs: ['team_capacity', 'sprint_goals'],
    defaultConfig: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['project-manager'],
    maxConcurrency: 1
  }
];

// Department: Content (2 agents)
export const contentAgents: AgentDefinition[] = [
  {
    id: 'content-strategist',
    name: 'Content Strategist',
    department: 'content',
    description: 'Plans content architecture, SEO strategy, and information hierarchy',
    capabilities: ['content_strategy', 'seo', 'information_architecture', 'taxonomy'],
    inputTypes: ['requirements', 'blueprint'],
    outputTypes: ['documentation', 'schema'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['existing_content', 'seo_requirements'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: [],
    maxConcurrency: 1
  },
  {
    id: 'seo-specialist',
    name: 'SEO Specialist',
    department: 'content',
    description: 'Optimizes for search engines, meta tags, structured data, and performance',
    capabilities: ['seo', 'meta_tags', 'structured_data', 'performance'],
    inputTypes: ['requirements', 'blueprint', 'content'],
    outputTypes: ['config', 'documentation'],
    requiredInputs: ['requirements', 'blueprint'],
    optionalInputs: ['seo_keywords', 'competitor_analysis'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: ['content-strategist'],
    maxConcurrency: 1
  }
];

// Department: Client Success (2 agents)
export const clientAgents: AgentDefinition[] = [
  {
    id: 'requirements-analyst',
    name: 'Requirements Analyst',
    department: 'client_success',
    description: 'Gathers, clarifies, and documents client requirements',
    capabilities: ['requirements', 'clarification', 'documentation', 'stakeholder_management'],
    inputTypes: ['client_input', 'stakeholders'],
    outputTypes: ['documentation', 'schema'],
    requiredInputs: ['client_input'],
    optionalInputs: ['stakeholders', 'constraints', 'budget'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [],
    dependencies: [],
    maxConcurrency: 1
  },
  {
    id: 'quality-assurance',
    name: 'Quality Assurance',
    department: 'client_success',
    description: 'Ensures deliverables meet quality standards and client expectations',
    capabilities: ['quality', 'standards', 'client_satisfaction', 'acceptance'],
    inputTypes: ['requirements', 'artifacts', 'deliverables'],
    outputTypes: ['documentation'],
    requiredInputs: ['requirements', 'artifacts'],
    optionalInputs: ['quality_standards', 'acceptance_criteria'],
    defaultConfig: { timeout: 30000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' },
    failureHandlers: [
      { failureType: 'type_error', strategy: 'retry_with_context', maxRetries: 2 }
    ],
    reviewRequirements: [
      { reviewType: 'final_approval', required: true, approvalLevel: 'critical', reviewers: ['quality-assurance', 'tech-lead'] }
    ],
    dependencies: ['requirements-analyst'],
    maxConcurrency: 1
  }
];

// All agents registry
export const ALL_AGENTS: AgentDefinition[] = [
  ...strategyAgents,
  ...designAgents,
  ...frontendAgents,
  ...backendAgents,
  ...dataAgents,
  ...qaAgents,
  ...devopsAgents,
  ...managementAgents,
  ...contentAgents,
  ...clientAgents
];

// Agent lookup
export function getAgentById(id: string): AgentDefinition | undefined {
  return ALL_AGENTS.find(agent => agent.id === id);
}

export function getAgentsByDepartment(department: string): AgentDefinition[] {
  return ALL_AGENTS.filter(agent => agent.department === department);
}

export function getAgentDependencies(agentId: string): AgentDefinition[] {
  const agent = getAgentById(agentId);
  if (!agent) return [];
  return agent.dependencies.map(depId => getAgentById(depId)).filter((a): a is AgentDefinition => a !== undefined);
}

// Workflow nodes for each factory
export const WORKFLOW_NODES: Record<string, WorkflowNode[]> = {
  website: [
    { id: 'start', agentId: 'requirements-analyst', type: 'start', edges: [{ target: 'plan', priority: 1 }], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'plan', agentId: 'strategic-planner', type: 'process', edges: [{ target: 'architect', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'architect', agentId: 'product-architect', type: 'process', edges: [{ target: 'design', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint', 'schema'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'design', agentId: 'ui-designer', type: 'process', edges: [{ target: 'content', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['design_system'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'content', agentId: 'content-strategist', type: 'process', edges: [{ target: 'seo', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['documentation'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'seo', agentId: 'seo-specialist', type: 'process', edges: [{ target: 'frontend', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'frontend', agentId: 'react-developer', type: 'process', edges: [{ target: 'nextjs', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['component', 'page'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'nextjs', agentId: 'nextjs-specialist', type: 'process', edges: [{ target: 'tailwind', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['page', 'config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'tailwind', agentId: 'tailwind-specialist', type: 'process', edges: [{ target: 'test', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'test', agentId: 'test-engineer', type: 'process', edges: [{ target: 'review', priority: 1 }], config: { timeout: 60000, retries: 2, requiredArtifacts: ['test'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'review', agentId: 'tech-lead', type: 'review', edges: [{ target: 'end', priority: 1 }], config: { timeout: 30000, retries: 1, requiredArtifacts: ['documentation'], approvalRequired: true, approvalLevel: 'review' } },
    { id: 'end', agentId: 'quality-assurance', type: 'end', edges: [], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } }
  ],
  ecommerce: [
    { id: 'start', agentId: 'requirements-analyst', type: 'start', edges: [{ target: 'plan', priority: 1 }], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'plan', agentId: 'strategic-planner', type: 'process', edges: [{ target: 'architect', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'architect', agentId: 'product-architect', type: 'process', edges: [{ target: 'db', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint', 'schema'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'db', agentId: 'database-architect', type: 'process', edges: [{ target: 'design', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['database_schema'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'design', agentId: 'ui-designer', type: 'process', edges: [{ target: 'api', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['design_system'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'api', agentId: 'api-developer', type: 'process', edges: [{ target: 'auth', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['api_route', 'config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'auth', agentId: 'auth-specialist', type: 'process', edges: [{ target: 'frontend', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['security_config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'frontend', agentId: 'react-developer', type: 'process', edges: [{ target: 'nextjs', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['component', 'page'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'nextjs', agentId: 'nextjs-specialist', type: 'process', edges: [{ target: 'tailwind', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['page', 'config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'tailwind', agentId: 'tailwind-specialist', type: 'process', edges: [{ target: 'test', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'test', agentId: 'test-engineer', type: 'process', edges: [{ target: 'security', priority: 1 }], config: { timeout: 60000, retries: 2, requiredArtifacts: ['test'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'security', agentId: 'security-auditor', type: 'process', edges: [{ target: 'review', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['documentation', 'security_config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'review', agentId: 'tech-lead', type: 'review', edges: [{ target: 'end', priority: 1 }], config: { timeout: 30000, retries: 1, requiredArtifacts: ['documentation'], approvalRequired: true, approvalLevel: 'review' } },
    { id: 'end', agentId: 'quality-assurance', type: 'end', edges: [], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } }
  ],
  saas: [
    { id: 'start', agentId: 'requirements-analyst', type: 'start', edges: [{ target: 'plan', priority: 1 }], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'plan', agentId: 'strategic-planner', type: 'process', edges: [{ target: 'architect', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'architect', agentId: 'product-architect', type: 'process', edges: [{ target: 'db', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint', 'schema'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'db', agentId: 'database-architect', type: 'process', edges: [{ target: 'design', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['database_schema'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'design', agentId: 'ui-designer', type: 'process', edges: [{ target: 'api', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['design_system'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'api', agentId: 'api-developer', type: 'process', edges: [{ target: 'auth', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['api_route', 'config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'auth', agentId: 'auth-specialist', type: 'process', edges: [{ target: 'ai', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['security_config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'ai', agentId: 'ai-engineer', type: 'process', edges: [{ target: 'frontend', priority: 1 }], config: { timeout: 90000, retries: 2, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'frontend', agentId: 'react-developer', type: 'process', edges: [{ target: 'nextjs', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['component', 'page'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'nextjs', agentId: 'nextjs-specialist', type: 'process', edges: [{ target: 'tailwind', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['page', 'config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'tailwind', agentId: 'tailwind-specialist', type: 'process', edges: [{ target: 'test', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'test', agentId: 'test-engineer', type: 'process', edges: [{ target: 'security', priority: 1 }], config: { timeout: 60000, retries: 2, requiredArtifacts: ['test'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'security', agentId: 'security-auditor', type: 'process', edges: [{ target: 'review', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['documentation', 'security_config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'review', agentId: 'tech-lead', type: 'review', edges: [{ target: 'end', priority: 1 }], config: { timeout: 30000, retries: 1, requiredArtifacts: ['documentation'], approvalRequired: true, approvalLevel: 'review' } },
    { id: 'end', agentId: 'quality-assurance', type: 'end', edges: [], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } }
  ]
};

// Shared workflow for other factories (tools, admin, dashboard, agent)
export function createSharedWorkflow(factoryType: string): WorkflowNode[] {
  return [
    { id: 'start', agentId: 'requirements-analyst', type: 'start', edges: [{ target: 'plan', priority: 1 }], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'plan', agentId: 'strategic-planner', type: 'process', edges: [{ target: 'architect', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'architect', agentId: 'product-architect', type: 'process', edges: [{ target: 'design', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['blueprint', 'schema'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'design', agentId: 'ui-designer', type: 'process', edges: [{ target: 'frontend', priority: 1 }], config: { timeout: 45000, retries: 2, requiredArtifacts: ['design_system'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'frontend', agentId: 'react-developer', type: 'process', edges: [{ target: 'nextjs', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['component', 'page'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'nextjs', agentId: 'nextjs-specialist', type: 'process', edges: [{ target: 'tailwind', priority: 1 }], config: { timeout: 60000, retries: 3, requiredArtifacts: ['page', 'config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'tailwind', agentId: 'tailwind-specialist', type: 'process', edges: [{ target: 'test', priority: 1 }], config: { timeout: 30000, retries: 2, requiredArtifacts: ['config'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'test', agentId: 'test-engineer', type: 'process', edges: [{ target: 'review', priority: 1 }], config: { timeout: 60000, retries: 2, requiredArtifacts: ['test'], approvalRequired: false, approvalLevel: 'none' } },
    { id: 'review', agentId: 'tech-lead', type: 'review', edges: [{ target: 'end', priority: 1 }], config: { timeout: 30000, retries: 1, requiredArtifacts: ['documentation'], approvalRequired: true, approvalLevel: 'review' } },
    { id: 'end', agentId: 'quality-assurance', type: 'end', edges: [], config: { timeout: 15000, retries: 1, requiredArtifacts: [], approvalRequired: false, approvalLevel: 'none' } }
  ];
}

export function getWorkflowNodes(factoryType: string): WorkflowNode[] {
  if (WORKFLOW_NODES[factoryType]) {
    return WORKFLOW_NODES[factoryType];
  }
  return createSharedWorkflow(factoryType);
}
