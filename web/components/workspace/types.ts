export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  type?: "thinking" | "error" | "success";
  agentEvents?: AgentEvent[];
}

export interface AgentEvent {
  id: string;
  agent: string;
  action: string;
  status: "running" | "completed" | "error";
  timestamp: number;
  detail?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: string;
}

export interface CoverageCategory {
  type: string;
  required: string[];
  generated: string[];
  missing: string[];
  coverage: number;
}

export interface CoverageReport {
  overallCoverage: number;
  passed: boolean;
  pages: CoverageCategory;
  components: CoverageCategory;
  features: CoverageCategory;
  routes: CoverageCategory;
  entities: CoverageCategory;
  missingItems: string[];
}

export interface WorkspaceState {
  status: "idle" | "generating" | "completed" | "error";
  projectId: string | null;
  files: GeneratedFile[];
  selectedFile: string | null;
  previewUrl: string | null;
  device: "desktop" | "tablet" | "mobile";
  chatMessages: ChatMessage[];
  agentEvents: AgentEvent[];
  buildLogs: string[];
  progress: number;
  error: string | null;
  showAgentTimeline: boolean;
  showBuildLogs: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  coverageReport: CoverageReport | null;
}
