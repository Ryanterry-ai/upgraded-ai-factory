"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectDetail {
  id: string;
  name: string;
  factory: string;
  prompt: string;
  quality_score: number;
  build_success: boolean;
  file_count: number;
  created_at: string;
  files?: { name: string; content: string }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then(setProject)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!project) return <p>Project not found</p>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <Badge variant={project.build_success ? "default" : "destructive"}>
            {project.build_success ? "Built" : "Failed"}
          </Badge>
        </div>
        <p className="text-muted-foreground">{project.factory} — Quality: {(project.quality_score * 100).toFixed(0)}%</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{project.prompt}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Files</CardTitle>
          <CardDescription>{project.file_count} files generated</CardDescription>
        </CardHeader>
        <CardContent>
          {project.files && project.files.length > 0 ? (
            <div className="space-y-2">
              {project.files.map((file) => (
                <div key={file.name} className="flex items-center justify-between rounded-md border p-3">
                  <span className="font-mono text-sm">{file.name}</span>
                  <Badge variant="outline">{file.content.length} chars</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No files available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
