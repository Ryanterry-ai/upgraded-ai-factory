export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
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
}
