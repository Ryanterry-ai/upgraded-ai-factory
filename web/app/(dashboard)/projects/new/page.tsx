"use client";

import { useState } from "react";
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

type Step = "input" | "routing" | "generating" | "storing" | "done" | "error";

interface GenerationResult {
  projectId: string;
  status: string;
  factory: string;
  files: { path: string; content: string; type: string }[];
  qualityScore: number;
  buildSuccess: boolean;
  error?: string;
}

export default function NewProjectPage() {
  const [prompt, setPrompt] = useState("");
  const [factory, setFactory] = useState("auto");
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [stepLabel, setStepLabel] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("routing");
    setStepLabel("Routing to best factory...");
    setError("");

    try {
      setTimeout(() => {
        if (step === "routing") setStepLabel("Analyzing requirements...");
      }, 2000);

      setTimeout(() => {
        if (step === "routing") setStep("generating");
        setStepLabel("Generating project files...");
      }, 4000);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          factory: factory === "auto" ? undefined : factory,
          name,
        }),
      });

      const data: GenerationResult = await response.json();

      if (!response.ok) {
        setStep("error");
        setError(data.error || "Generation failed");
        return;
      }

      setStep("storing");
      setStepLabel("Saving to storage...");

      setTimeout(() => {
        setResult(data);
        setStep("done");
      }, 1000);
    } catch {
      setStep("error");
      setError("Network error — check your connection");
    }
  };

  const stepIndicator = (current: Step, target: Step, label: string) => {
    const state =
      step === target
        ? "active"
        : ["done", "storing"].indexOf(step) >= ["routing", "generating", "storing", "done"].indexOf(target)
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
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
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
            </div>
          </CardContent>
        </Card>

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
          <Button variant="ghost" onClick={() => { setStep("input"); setResult(null); setPrompt(""); setName(""); }}>
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
            <Button className="mt-4" onClick={() => { setStep("input"); setError(""); }}>
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
        <h1 className="text-3xl font-bold">Generating Project</h1>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              {stepIndicator("input", "routing", "Analyzing input")}
              {stepIndicator("routing", "generating", "Selecting factory")}
              {stepIndicator("generating", "storing", "Generating files")}
              {stepIndicator("storing", "done", "Saving results")}
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">{stepLabel}</p>
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
