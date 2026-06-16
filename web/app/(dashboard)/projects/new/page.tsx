"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Globe, ShoppingCart, LayoutDashboard, Settings, Bot,
  Code2, CheckCircle2, Circle, Loader2, ArrowRight, Download, Eye,
  FileCode2, Clock, AlertCircle, ChevronRight, Layers, Box, Upload,
  Link as LinkIcon, FileImage, FileText,
} from "lucide-react";

type Step = "input" | "generating" | "done" | "error";

interface ProgressEvent {
  step: string;
  label: string;
}

interface AgentInfo {
  name: string;
  success: boolean;
  duration: number;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: string;
}

interface GenerationResult {
  projectId: string;
  status: string;
  factory: string;
  files: GeneratedFile[];
  blueprint: any;
  qualityScore: number;
  buildSuccess: boolean;
  errors: string[];
  warnings: string[];
  llmUsed: boolean;
  memoryUsed: boolean;
  patternsExtracted: number;
  agentResults?: {
    agents: AgentInfo[];
    totalDuration: number;
    totalTokens: number;
    successCount: number;
    failCount: number;
    insights: Record<string, unknown>;
  };
  totalMs?: number;
}

const WORKSPACE_STEPS = [
  { id: "routing", label: "Routing", icon: Layers },
  { id: "generating", label: "Generating", icon: Code2 },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "validating", label: "Validating", icon: CheckCircle2 },
  { id: "storing", label: "Storing", icon: Box },
];

const AGENT_ICONS: Record<string, string> = {
  "Product Manager": "📋",
  "Frontend Engineer": "🎨",
  "SEO Specialist": "🔍",
  "QA Engineer": "✅",
  "Security Agent": "🔒",
  "Performance Agent": "⚡",
};

export default function NewProjectPage() {
  const [prompt, setPrompt] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [stepLabel, setStepLabel] = useState("");
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentInfo[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [inputMode, setInputMode] = useState<"prompt" | "url" | "upload">("prompt");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const startTimer = useCallback(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setStep("generating");
    setStepLabel("Starting...");
    setError("");
    setProgressEvents([]);
    setAgentEvents([]);
    startTimer();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (eventType === "progress") {
                setStepLabel(parsed.label);
                setProgressEvents((prev) => [...prev, parsed]);
                setStep("generating");
              } else if (eventType === "complete") {
                stopTimer();
                setResult(parsed);
                setStep("done");
              } else if (eventType === "error") {
                stopTimer();
                setError(parsed.error || "Generation failed");
                setStep("error");
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      stopTimer();
      setError(err instanceof Error ? err.message : "Network error");
      setStep("error");
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  // ── Input View ──────────────────────────────────────
  if (step === "input") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Minimal top bar */}
        <nav className="h-14 border-b border-border flex items-center px-6 justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-light to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            build.same
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
            32 agents online
          </div>
        </nav>

        {/* Centered prompt area */}
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 tracking-tight">
              What do you want to build?
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Describe your app and our AI team will build it.
            </p>

            {/* Input mode tabs */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {[
                { id: "prompt" as const, icon: Sparkles, label: "Prompt" },
                { id: "url" as const, icon: LinkIcon, label: "URL" },
                { id: "upload" as const, icon: Upload, label: "Upload" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setInputMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inputMode === m.id
                      ? "bg-white text-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-800"
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleGenerate}>
              <div className="glass rounded-2xl p-1.5 focus-within:border-brand-light/50 transition-all">
                <div className="flex items-start gap-3 px-4 py-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      inputMode === "prompt"
                        ? "Build a SaaS dashboard with login, analytics charts, user management, and billing..."
                        : inputMode === "url"
                        ? "Paste a URL to clone or reference..."
                        : "Describe your design or upload a file..."
                    }
                    rows={4}
                    maxLength={10000}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm leading-relaxed"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{prompt.length}/10,000</span>
                    {inputMode === "upload" && (
                      <div className="flex items-center gap-2">
                        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800">
                          <FileImage className="w-3.5 h-3.5" /> Screenshot
                        </button>
                        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800">
                          <Box className="w-3.5 h-3.5" /> Figma
                        </button>
                        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800">
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Generate
                  </button>
                </div>
              </div>
            </form>

            {/* Suggestions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {[
                "Ecommerce store with product grid and cart",
                "SaaS dashboard with charts and billing",
                "Portfolio with blog and contact form",
                "Admin panel with user management",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-zinc-500 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Generating / Done / Error View ──────────────────
  const currentStepIdx = WORKSPACE_STEPS.findIndex((s) => {
    if (progressEvents.length === 0) return s.id === "routing";
    const last = progressEvents[progressEvents.length - 1].step;
    return s.id === last;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left: Agent Timeline */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
        <div className="h-14 border-b border-border flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-light" />
            <span className="text-sm font-medium">Generation</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{formatTime(elapsedMs)}</span>
        </div>

        {/* Progress steps */}
        <div className="p-4 space-y-1">
          {WORKSPACE_STEPS.map((s, i) => {
            const isActive = i === currentStepIdx;
            const isDone = i < currentStepIdx || step === "done";
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive ? "bg-brand/10 text-brand-light" : isDone ? "text-muted-foreground" : "text-zinc-600"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-medium">{s.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                    {stepLabel}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Agent events */}
        {agentEvents.length > 0 && (
          <div className="border-t border-border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">AI Agents</p>
            <div className="space-y-2">
              {agentEvents.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <span>{AGENT_ICONS[a.name] || "🤖"}</span>
                  <span className="truncate flex-1">{a.name}</span>
                  <span className={`font-mono ${a.success ? "text-green-500" : "text-red-500"}`}>
                    {a.duration}ms
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Elapsed bar */}
        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{step === "done" ? "Complete" : "Working..."}</span>
            <span className="font-mono">{formatTime(elapsedMs)}</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-light to-pink-500"
              initial={{ width: "0%" }}
              animate={{ width: step === "done" ? "100%" : `${Math.min((currentStepIdx + 1) / WORKSPACE_STEPS.length * 100, 90)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Right: Content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Content header */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            {step === "done" && result && (
              <>
                <span className="text-sm font-medium">{result.factory}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{result.files.length} files</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className={`text-xs ${result.buildSuccess ? "text-green-500" : "text-yellow-500"}`}>
                  {result.buildSuccess ? "Build passed" : "Partial"}
                </span>
              </>
            )}
            {step === "generating" && (
              <span className="text-sm text-muted-foreground">{stepLabel}</span>
            )}
            {step === "error" && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
          {step === "done" && result && (
            <div className="flex items-center gap-2">
              <a
                href={`/api/projects/${result.projectId}/download`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> ZIP
              </a>
              <button
                onClick={() => router.push(`/projects/${result.projectId}`)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Project
              </button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {step === "generating" && (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
                </div>
                <p className="text-lg font-medium mb-1">{stepLabel}</p>
                <p className="text-sm text-muted-foreground">Our AI team is building your project</p>
              </motion.div>
            </div>
          )}

          {step === "done" && result && (
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Files", value: result.files.length },
                  { label: "Quality", value: `${Math.round(result.qualityScore * 100)}%` },
                  { label: "Agents", value: `${result.agentResults?.successCount || 0}/${(result.agentResults?.successCount || 0) + (result.agentResults?.failCount || 0)}` },
                  { label: "Time", value: formatTime(result.totalMs || elapsedMs) },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Agent insights */}
              {result.agentResults?.insights && (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium mb-3">Agent Insights</p>
                  {typeof result.agentResults.insights.scope === "string" && (
                    <p className="text-xs text-muted-foreground mb-2">{result.agentResults.insights.scope}</p>
                  )}
                  {Array.isArray(result.agentResults.insights.features) && (
                    <div className="flex flex-wrap gap-1.5">
                      {(result.agentResults.insights.features as string[]).map((f, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* File explorer */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-medium">Files</p>
                  <span className="text-xs text-muted-foreground">{result.files.length} generated</span>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-auto">
                  {result.files.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedFile(selectedFile?.path === f.path ? null : f)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-800/50 transition-colors ${
                        selectedFile?.path === f.path ? "bg-zinc-800/50" : ""
                      }`}
                    >
                      <FileCode2 className="w-4 h-4 text-brand-light shrink-0" />
                      <span className="text-xs font-mono truncate flex-1">{f.path}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-muted-foreground">{f.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code viewer */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-brand-light" />
                        <span className="text-xs font-mono">{selectedFile.path}</span>
                      </div>
                      <button onClick={() => setSelectedFile(null)} className="text-xs text-muted-foreground hover:text-foreground">
                        Close
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-muted-foreground overflow-auto max-h-96 leading-relaxed">
                      <code>{selectedFile.content}</code>
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {step === "error" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Generation Failed</p>
                <p className="text-sm text-muted-foreground mb-6">{error}</p>
                <button
                  onClick={() => { setStep("input"); setPrompt(""); }}
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
