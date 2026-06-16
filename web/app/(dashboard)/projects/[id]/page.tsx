"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProjectDetail {
  id: string;
  name: string;
  factory: string;
  prompt: string;
  quality_score: number;
  build_success: boolean;
  file_count: number;
  created_at: string;
  updated_at: string;
  blueprint: Record<string, unknown> | null;
  evaluation: {
    overall_score: number;
    seo_score: number;
    ux_score: number;
    perf_score: number;
    security_score: number;
    accessibility_score: number;
    code_quality_score: number;
  } | null;
}

interface FileEntry {
  path: string;
  type: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "files" | "blueprint">("overview");

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      fetch(`/api/projects/${params.id}`).then((r) => r.json()),
      fetch(`/api/projects/${params.id}/files`).then((r) => r.json()),
    ])
      .then(([projectData, filesData]) => {
        setProject(projectData);
        setFiles(filesData.files || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground animate-pulse">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return <div className="py-20 text-center text-muted-foreground">Project not found</div>;
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "files" as const, label: `Files (${files.length})` },
    { id: "blueprint" as const, label: "Blueprint" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant={project.build_success ? "default" : "destructive"}>
              {project.build_success ? "Built" : "Failed"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            <span className="capitalize">{project.factory}</span> factory &middot;{" "}
            Quality: {(project.quality_score * 100).toFixed(0)}% &middot;{" "}
            {project.file_count} files
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/projects/${project.id}/download`, "_blank")}
            disabled={!project.build_success}
          >
            Download ZIP
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (!confirm("Delete this project?")) return;
              await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
              window.location.href = "/projects";
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{project.prompt}</p>
            </CardContent>
          </Card>

          {project.evaluation && (
            <Card>
              <CardHeader>
                <CardTitle>Evaluation</CardTitle>
                <CardDescription>Quality scores across dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: "Overall", value: project.evaluation.overall_score },
                    { label: "SEO", value: project.evaluation.seo_score },
                    { label: "UX", value: project.evaluation.ux_score },
                    { label: "Performance", value: project.evaluation.perf_score },
                    { label: "Security", value: project.evaluation.security_score },
                    { label: "Accessibility", value: project.evaluation.accessibility_score },
                    { label: "Code Quality", value: project.evaluation.code_quality_score },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center">
                      <p className="text-2xl font-bold">{(metric.value * 100).toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{project.file_count}</p>
                <p className="text-xs text-muted-foreground">Files</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold capitalize">{project.factory}</p>
                <p className="text-xs text-muted-foreground">Factory</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{(project.quality_score * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Quality</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <Card>
          <CardContent className="pt-6">
            {files.length === 0 ? (
              <p className="text-muted-foreground">No files available</p>
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between rounded border px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <span className="font-mono">{file.path}</span>
                    <Badge variant="outline" className="text-xs">{file.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "blueprint" && (
        <Card>
          <CardHeader>
            <CardTitle>Blueprint</CardTitle>
            <CardDescription>Generated project blueprint (JSON)</CardDescription>
          </CardHeader>
          <CardContent>
            {project.blueprint ? (
              <pre className="max-h-[500px] overflow-auto rounded bg-muted p-4 text-xs">
                {JSON.stringify(project.blueprint, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No blueprint available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
