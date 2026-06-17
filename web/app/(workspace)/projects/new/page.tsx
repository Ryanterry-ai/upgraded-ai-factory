"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Send, RotateCcw, Monitor, Tablet, Smartphone, ChevronDown, ChevronRight,
  FileCode, FolderTree, Layout, MessageSquare, History, Sparkles, X,
  Download, Share2, Rocket, Terminal, Eye, Code2, PanelLeftClose, PanelRightClose,
  Loader2, CheckCircle2, AlertCircle, Clock, Zap, Bot, BarChart3
} from "lucide-react";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { FilePanel } from "@/components/workspace/FilePanel";
import { AgentTimeline } from "@/components/workspace/AgentTimeline";
import { BuildLogs } from "@/components/workspace/BuildLogs";
import { CoverageReport } from "@/components/workspace/CoverageReport";
import type { ChatMessage, AgentEvent, GeneratedFile, WorkspaceState, CoverageCategory, CoverageReport as CoverageReportType } from "@/components/workspace/types";

const INITIAL_STATE: WorkspaceState = {
  status: "idle",
  projectId: null,
  files: [],
  selectedFile: null,
  previewUrl: null,
  device: "desktop",
  chatMessages: [],
  agentEvents: [],
  buildLogs: [],
  progress: 0,
  error: null,
  showAgentTimeline: false,
  showBuildLogs: false,
  leftCollapsed: false,
  rightCollapsed: false,
  coverageReport: null,
};

export default function WorkspacePageWrapper() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WorkspacePage />
    </Suspense>
  );
}

function WorkspacePage() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const initialFactory = searchParams.get("factory") || "";
  const [state, setState] = useState<WorkspaceState>(INITIAL_STATE);
  const [inputValue, setInputValue] = useState(initialPrompt);
  const [selectedFactory, setSelectedFactory] = useState(initialFactory);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortRef = useRef<boolean>(false);
  const hasAutoStarted = useRef(false);

  const updateState = useCallback((updates: Partial<WorkspaceState> | ((prev: WorkspaceState) => Partial<WorkspaceState>)) => {
    setState((prev) => {
      const resolved = typeof updates === "function" ? updates(prev) : updates;
      return { ...prev, ...resolved };
    });
  }, []);

  const addAgentEvent = useCallback((event: Omit<AgentEvent, "id" | "timestamp">) => {
    const newEvent: AgentEvent = { ...event, id: crypto.randomUUID(), timestamp: Date.now() };
    setState((prev) => ({ ...prev, agentEvents: [...prev.agentEvents, newEvent] }));
  }, []);

  const addBuildLog = useCallback((log: string) => {
    setState((prev) => ({ ...prev, buildLogs: [...prev.buildLogs, `[${new Date().toLocaleTimeString()}] ${log}`] }));
  }, []);

  const handleSSEEvent = useCallback((event: Record<string, unknown>) => {
    switch (event.type) {
      case "thinking":
        const thinkingMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: event.message as string,
          timestamp: Date.now(),
          type: "thinking",
        };
        setState((prev) => ({ ...prev, chatMessages: [...prev.chatMessages, thinkingMsg] }));
        break;
      case "progress":
        updateState({ progress: (event.progress as number) || 0 });
        addBuildLog(`Progress: ${event.message || "Processing..."}`);
        break;
      case "agent_start":
        addAgentEvent({ agent: (event.agent as string) || "Agent", action: (event.action as string) || "Working", status: "running" });
        break;
      case "agent_complete":
        setState((prev) => ({
          ...prev,
          agentEvents: prev.agentEvents.map((e) =>
            e.agent === event.agent && e.status === "running"
              ? { ...e, status: "completed" as const, detail: event.detail as string }
              : e
          ),
        }));
        addBuildLog(`Agent ${(event.agent as string) || ""}: ${(event.detail as string) || "Done"}`);
        break;
      case "files":
        const files = (event.files as GeneratedFile[]) || [];
        updateState({ files, selectedFile: files[0]?.path || null });
        addBuildLog(`Generated ${files.length} files`);
        break;
      case "preview_url":
        updateState({ previewUrl: event.url as string });
        addBuildLog("Preview available");
        break;
      case "coverage_report":
        const coverageReport = {
          overallCoverage: event.overallCoverage as number,
          passed: event.passed as boolean,
          pages: event.pages as CoverageCategory,
          components: event.components as CoverageCategory,
          features: event.features as CoverageCategory,
          routes: event.routes as CoverageCategory,
          entities: event.entities as CoverageCategory,
          missingItems: event.missingItems as string[],
          qualityScores: event.qualityScores as CoverageReport["qualityScores"],
          componentDepth: event.componentDepth as CoverageReport["componentDepth"],
        };
        updateState({ coverageReport });
        const coveragePct = Math.round((event.overallCoverage as number) * 100);
        addBuildLog(`Requirement coverage: ${coveragePct}%`);
        break;
      case "project_id":
        updateState({ projectId: event.projectId as string });
        break;
      case "complete":
        updateState({
          status: "completed",
          progress: 100,
        });
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(), role: "assistant",
          content: `Project generated successfully! ${event.summary || ""}`,
          timestamp: Date.now(),
        };
        setState((prev) => ({ ...prev, chatMessages: [...prev.chatMessages, assistantMsg] }));
        addBuildLog("Generation complete!");
        break;
      case "error":
        updateState({ status: "error", error: event.message as string });
        addBuildLog(`Error: ${event.message}`);
        break;
    }
  }, [updateState, addAgentEvent, addBuildLog]);

  const startGeneration = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    abortRef.current = false;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content: prompt, timestamp: Date.now(),
    };

    const isEdit = state.projectId && state.status === "completed";
    const apiUrl = isEdit
      ? `/api/projects/${state.projectId}/edit`
      : "/api/generate";
    const body = isEdit
      ? { instruction: prompt, files: state.files }
      : { prompt, factory: selectedFactory || undefined };

    updateState({
      status: "generating",
      chatMessages: [...state.chatMessages, userMsg],
      agentEvents: isEdit ? state.agentEvents : [],
      buildLogs: isEdit ? state.buildLogs : [],
      progress: 0,
      error: null,
    });

    addBuildLog("Starting generation pipeline...");
    addAgentEvent({ agent: "Router", action: "Detecting factory type", status: "running" });

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      if (!response.headers.get("content-type")?.includes("text/event-stream")) {
        const json = await response.json();
        if (json.error) throw new Error(json.error);
        if (json.files) updateState({ files: json.files });
        if (json.projectId) updateState({ projectId: json.projectId });
        updateState({ status: "completed", progress: 100 });
        addBuildLog("Generation complete (non-streaming)");
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No response body");

      addAgentEvent({ agent: "Router", action: "Factory detected", status: "completed" });
      addBuildLog("Factory type detected. Initializing agents...");

      while (true) {
        if (abortRef.current) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              handleSSEEvent(event);
            } catch {}
          }
        }
      }
    } catch (err) {
      updateState({ status: "error", error: err instanceof Error ? err.message : "Generation failed" });
      addBuildLog(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [updateState, addAgentEvent, addBuildLog, state, selectedFactory, handleSSEEvent]);

  const sendMessage = useCallback((msg: string) => {
    if (state.status === "generating") return;
    startGeneration(msg);
    setInputValue("");
  }, [state.status, startGeneration]);

  // Auto-start when navigated from homepage with a prompt
  useEffect(() => {
    if (initialPrompt && !hasAutoStarted.current && state.status === "idle") {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => {
        startGeneration(initialPrompt);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, state.status, startGeneration]);

  const downloadProject = useCallback(async () => {
    if (!state.projectId) return;
    window.open(`/api/projects/${state.projectId}/download`, "_blank");
  }, [state.projectId]);

  const shareProject = useCallback(() => {
    if (state.projectId) {
      navigator.clipboard.writeText(`${window.location.origin}/projects/${state.projectId}`);
    }
  }, [state.projectId]);

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 border-b border-white/5 bg-[#0f0f12] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-xs">build.same</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-zinc-500">
            {state.projectId ? `Project: ${state.projectId.slice(0, 8)}` : "New Project"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Switcher */}
          {state.files.length > 0 && (
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
              {[
                { device: "desktop" as const, icon: Monitor },
                { device: "tablet" as const, icon: Tablet },
                { device: "mobile" as const, icon: Smartphone },
              ].map(({ device, icon: Icon }) => (
                <button
                  key={device}
                  onClick={() => updateState({ device })}
                  className={`p-1.5 rounded-md transition-colors ${state.device === device ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* Refresh */}
          {state.previewUrl && (
            <button
              onClick={() => updateState({ previewUrl: state.previewUrl })}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-white/10" />

          {/* Toggle panels */}
          <button
            onClick={() => updateState({ leftCollapsed: !state.leftCollapsed })}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateState({ rightCollapsed: !state.rightCollapsed })}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/10" />

          {/* Deploy + Share */}
          {state.status === "completed" && (
            <>
              <button
                onClick={shareProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 transition-colors"
              >
                <Share2 className="w-3 h-3" /> Share
              </button>
              <button
                onClick={downloadProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </>
          )}
          {state.status === "idle" && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 transition-opacity">
              <Rocket className="w-3 h-3" /> Deploy
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Chat + History */}
        {!state.leftCollapsed && (
          <div className="w-[360px] shrink-0 border-r border-white/5 flex flex-col bg-[#0f0f12] overflow-hidden">
            <ChatPanel
              messages={state.chatMessages}
              onSend={sendMessage}
              status={state.status}
              inputValue={inputValue}
              onInputChange={setInputValue}
              selectedFactory={selectedFactory}
            />
          </div>
        )}

        {/* Center — Preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
          {/* Progress bar */}
          {state.status === "generating" && (
            <div className="h-0.5 bg-white/5 shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                initial={{ width: "0%" }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <PreviewPanel
              previewUrl={state.previewUrl}
              device={state.device}
              status={state.status}
              files={state.files}
            />
          </div>

          {/* Bottom: Agent Timeline + Build Logs + Coverage */}
          {(state.agentEvents.length > 0 || state.buildLogs.length > 0 || state.coverageReport) && (
            <div className="border-t border-white/5 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f12]">
                <button
                  onClick={() => updateState({ showAgentTimeline: !state.showAgentTimeline, showBuildLogs: false })}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${state.showAgentTimeline ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <Bot className="w-3 h-3" /> Agents ({state.agentEvents.filter((e) => e.status === "completed").length}/{state.agentEvents.length})
                </button>
                <button
                  onClick={() => updateState({ showBuildLogs: !state.showBuildLogs, showAgentTimeline: false })}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${state.showBuildLogs ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <Terminal className="w-3 h-3" /> Logs ({state.buildLogs.length})
                </button>
                {state.coverageReport && (
                  <button
                    onClick={() => updateState({ showBuildLogs: false, showAgentTimeline: false })}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                      !state.showBuildLogs && !state.showAgentTimeline ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" /> Coverage ({Math.round(state.coverageReport.overallCoverage * 100)}%)
                  </button>
                )}
              </div>
              <div className="h-40 overflow-auto bg-[#0a0a0c]">
                {state.showAgentTimeline && <AgentTimeline events={state.agentEvents} />}
                {state.showBuildLogs && <BuildLogs logs={state.buildLogs} />}
                {!state.showAgentTimeline && !state.showBuildLogs && state.coverageReport && (
                  <CoverageReport report={state.coverageReport} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Files + Code */}
        {!state.rightCollapsed && (
          <div className="w-[380px] shrink-0 border-l border-white/5 flex flex-col bg-[#0f0f12] overflow-hidden">
            <FilePanel
              files={state.files}
              selectedFile={state.selectedFile}
              onSelectFile={(path) => updateState({ selectedFile: path })}
              projectId={state.projectId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
