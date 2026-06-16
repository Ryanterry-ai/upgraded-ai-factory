"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const factories = [
  { id: "auto", label: "Auto-Detect", description: "AI picks the best factory" },
  { id: "website", label: "Website", description: "Landing pages, portfolios, blogs" },
  { id: "ecommerce", label: "E-commerce", description: "Online stores, product pages" },
  { id: "saas", label: "SaaS", description: "Web apps, dashboards, tools" },
  { id: "dashboard", label: "Dashboard", description: "Analytics, admin panels" },
  { id: "admin", label: "Admin Panel", description: "CMS, user management" },
  { id: "agent", label: "AI Agent", description: "Chatbots, automation" },
  { id: "tools", label: "Tools", description: "Utilities, converters" },
];

type Step = "input" | "routing" | "generating" | "agents" | "validating" | "storing" | "done" | "error";

interface ProgressEvent {
  step: string;
  label: string;
  detail?: string;
}

interface AgentInfo {
  name: string;
  success: boolean;
  duration: number;
}

interface GenerationResult {
  projectId: string;
  status: string;
  factory: string;
  files: { path: string; content: string; type: string }[];
  qualityScore: number;
  buildSuccess: boolean;
  error?: string;
  errors: string[];
  warnings: string[];
  llmUsed: boolean;
  memoryUsed: boolean;
  patternsExtracted: number;
  totalMs?: number;
  agentResults?: {
    agents: AgentInfo[];
    totalDuration: number;
    totalTokens: number;
    successCount: number;
    failCount: number;
    insights: Record<string, unknown>;
  };
}

export default function NewProjectPage() {
  const [prompt, setPrompt] = useState("");
  const [factory, setFactory] = useState("auto");
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [stepLabel, setStepLabel] = useState("");
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentInfo[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const startTimer = useCallback(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("routing");
    setStepLabel("Starting generation...");
    setError("");
    setProgressEvents([]);
    setAgentEvents([]);
    startTimer();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          prompt,
          factory: factory === "auto" ? undefined : factory,
          name,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
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
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                if (eventType === "progress") {
                  const evt = parsed as ProgressEvent;
                  setStepLabel(evt.label);
                  setProgressEvents((prev) => [...prev, evt]);
                  if (evt.step === "generating") setStep("generating");
                  if (evt.step === "agents") setStep("agents");
                  if (evt.step === "validating") setStep("validating");
                  if (evt.step === "storing") setStep("storing");
                } else if (eventType === "agent") {
                  setAgentEvents((prev) => [...prev, parsed as AgentInfo]);
                } else if (eventType === "complete") {
                  stopTimer();
                  setResult(parsed as GenerationResult);
                  setStep("done");
                } else if (eventType === "error") {
                  stopTimer();
                  setError(parsed.error || "Generation failed");
                  setStep("error");
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } else {
        const data = await response.json();
        stopTimer();
        if (!response.ok) {
          setError(data.error || "Generation failed");
          setStep("error");
        } else {
          setResult(data as GenerationResult);
          setStep("done");
        }
      }
    } catch {
      stopTimer();
      setError("Network error — check your connection");
      setStep("error");
    }
  };

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const stepIndicator = (target: Step, label: string) => {
    const steps: Step[] = ["routing", "generating", "agents", "validating", "storing", "done"];
    const targetIdx = steps.indexOf(target);
    const currentIdx = steps.indexOf(step);
    const state =
      step === target
        ? "active"
        : step === "done" || step === "error"
          ? currentIdx >= targetIdx ? "done" : "pending"
          : currentIdx > targetIdx
            ? "done"
            : "pending";

    return (
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            state === "done"
              ? "bg-green-500 text-white"
              : state === "active"
                ? "bg-primary text-white animate-pulse"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {state === "done" ? "✓" : state === "active" ? "●" : "○"}
        </div>
        <span className={`text-sm ${state === "active" ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
      </div>
    );
  };

  if (step === "done" && result) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Generation Complete</h1>
          <Badge variant="default">Success</Badge>
          {result.totalMs && (
            <span className="text-sm text-muted-foreground">{formatMs(result.totalMs)}</span>
          )}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{result.files.length}</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{(result.qualityScore * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Quality</p>
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{result.factory}</p>
                <p className="text-sm text-muted-foreground">Factory</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{result.agentResults?.successCount || 0}/{(result.agentResults?.successCount || 0) + (result.agentResults?.failCount || 0)}</p>
                <p className="text-sm text-muted-foreground">Agents</p>
              </div>
            </div>

            <div className="flex gap-2 text-xs text-muted-foreground">
              {result.llmUsed && <Badge variant="secondary">LLM</Badge>}
              {result.memoryUsed && <Badge variant="secondary">Memory</Badge>}
              {result.patternsExtracted > 0 && <Badge variant="secondary">{result.patternsExtracted} Patterns</Badge>}
            </div>
          </CardContent>
        </Card>

        {result.agentResults?.insights && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <h3 className="font-semibold">Agent Insights</h3>
              {typeof result.agentResults.insights.scope === "string" && (
                <p className="text-sm text-muted-foreground">{result.agentResults.insights.scope}</p>
              )}
              {Array.isArray(result.agentResults.insights.features) && (
                <ul className="text-sm list-disc list-inside">
                  {(result.agentResults.insights.features as string[]).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              {typeof result.agentResults.insights.seoTitle === "string" && (
                <p className="text-xs">SEO: {result.agentResults.insights.seoTitle}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Generated Files</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {result.files.map((file) => (
                <div key={file.path} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                  <span className="font-mono">{file.path}</span>
                  <Badge variant="outline" className="text-xs">{file.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {result.warnings.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Warnings</h3>
              <ul className="text-sm text-yellow-600 space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button onClick={() => router.push(`/projects/${result.projectId}`)} className="flex-1">
            View Project
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/api/projects/${result.projectId}/download`, "_blank")}
          >
            Download ZIP
          </Button>
          <Button variant="ghost" onClick={() => { setStep("input"); setResult(null); setPrompt(""); setName(""); setProgressEvents([]); setAgentEvents([]); setElapsedMs(0); }}>
            New Project
          </Button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Generation Failed</h1>
          <Badge variant="destructive">Error</Badge>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button className="mt-4" onClick={() => { setStep("input"); setError(""); setProgressEvents([]); setAgentEvents([]); setElapsedMs(0); }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step !== "input") {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Generating Project</h1>
          <span className="text-sm text-muted-foreground font-mono">{formatMs(elapsedMs)}</span>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              {stepIndicator("routing", "Analyzing input")}
              {stepIndicator("generating", "Generating files")}
              {stepIndicator("agents", "Running agents")}
              {stepIndicator("validating", "Validating build")}
              {stepIndicator("storing", "Saving results")}
            </div>

            <p className="text-sm text-muted-foreground animate-pulse">{stepLabel}</p>

            {agentEvents.length > 0 && (
              <div className="space-y-1">
                {agentEvents.map((agent, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      {agent.success ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                      {agent.name}
                    </span>
                    <span className="text-muted-foreground">{formatMs(agent.duration)}</span>
                  </div>
                ))}
              </div>
            )}

            {progressEvents.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {progressEvents.map((evt, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    {evt.label}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">New Project</h1>
        <p className="text-muted-foreground">Describe what you want to build</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Project Name (optional)</label>
              <Input
                placeholder="my-awesome-project"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Factory</label>
              <div className="grid grid-cols-2 gap-2">
                {factories.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFactory(f.id)}
                    className={`rounded-md border p-3 text-left text-sm transition-colors ${
                      factory === f.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Build a modern landing page for a SaaS product called 'Acme' with a hero section, features grid, pricing, and CTA..."
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{prompt.length} / 10,000 characters</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={!prompt.trim()}>
              Generate Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
