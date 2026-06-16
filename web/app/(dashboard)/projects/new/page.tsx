"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const factories = [
  { id: "website", label: "Website", description: "Landing pages, portfolios, blogs" },
  { id: "ecommerce", label: "E-commerce", description: "Online stores, product pages" },
  { id: "saas", label: "SaaS", description: "Web apps, dashboards, tools" },
  { id: "dashboard", label: "Dashboard", description: "Analytics, admin panels" },
  { id: "admin", label: "Admin Panel", description: "CMS, user management" },
  { id: "agent", label: "AI Agent", description: "Chatbots, automation" },
];

export default function NewProjectPage() {
  const [prompt, setPrompt] = useState("");
  const [factory, setFactory] = useState("website");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, factory, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Generation failed");
        setLoading(false);
        return;
      }

      router.push(`/projects/${data.projectId}`);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

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
              <label className="mb-2 block text-sm font-medium">Project Name</label>
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
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || !prompt}>
              {loading ? "Generating..." : "Generate Project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
