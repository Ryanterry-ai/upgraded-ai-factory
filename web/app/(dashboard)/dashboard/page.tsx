"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalProjects: number;
  totalGenerations: number;
  successRate: number;
  avgQuality: number;
  recentProjects: {
    id: string;
    name: string;
    factory: string;
    quality_score: number;
    build_success: boolean;
    file_count: number;
    created_at: string;
  }[];
  factoryDistribution: Record<string, number>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your AI factory usage</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const s = stats || { totalProjects: 0, totalGenerations: 0, successRate: 0, avgQuality: 0, recentProjects: [], factoryDistribution: {} };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your AI factory usage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-4xl">{s.totalProjects}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Generations</CardDescription>
            <CardTitle className="text-4xl">{s.totalGenerations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-4xl">{(s.successRate * 100).toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Quality</CardDescription>
            <CardTitle className="text-4xl">{(s.avgQuality * 100).toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Last 5 generated projects</CardDescription>
          </CardHeader>
          <CardContent>
            {s.recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {s.recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.factory}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.build_success ? "default" : "destructive"}>
                        {p.build_success ? "Built" : "Failed"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(p.quality_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factory Distribution</CardTitle>
            <CardDescription>Projects by factory type</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(s.factoryDistribution).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(s.factoryDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([factory, count]) => (
                    <div key={factory} className="flex items-center justify-between">
                      <span className="capitalize text-sm">{factory}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(count / Math.max(...Object.values(s.factoryDistribution))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Generate a new project from a prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Project
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
