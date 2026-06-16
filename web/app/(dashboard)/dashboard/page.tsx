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
  avgLatency: number;
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
  latencyByFactory: Record<string, number>;
  dailyGenerations: Record<string, number>;
}

interface Analytics {
  factoryPerformance: Record<
    string,
    { total: number; success: number; avgQuality: number; avgLatency: number }
  >;
  feedbackSummary: {
    total: number;
    avgRating: number;
    byCategory: Record<string, number>;
  };
  dailyTrend: Record<string, { generations: number; avgQuality: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/analytics/overview").then((r) => r.json()),
    ])
      .then(([s, a]) => { setStats(s); setAnalytics(a); })
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

  const s = stats || {
    totalProjects: 0, totalGenerations: 0, successRate: 0, avgQuality: 0,
    avgLatency: 0, recentProjects: [], factoryDistribution: {},
    latencyByFactory: {}, dailyGenerations: {},
  };
  const a = analytics || {
    factoryPerformance: {}, feedbackSummary: { total: 0, avgRating: 0, byCategory: {} },
    dailyTrend: {},
  };

  const maxFactory = Math.max(...Object.values(s.factoryDistribution), 1);
  const maxDaily = Math.max(...Object.values(s.dailyGenerations), 1);

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
            <CardDescription>Avg Latency</CardDescription>
            <CardTitle className="text-4xl">
              {s.avgLatency < 1000 ? `${s.avgLatency}ms` : `${(s.avgLatency / 1000).toFixed(1)}s`}
            </CardTitle>
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
                            style={{ width: `${(count / maxFactory) * 100}%` }}
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
          <CardTitle>Daily Generations (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(s.dailyGenerations).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {Object.entries(s.dailyGenerations).map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factory Performance</CardTitle>
          <CardDescription>Success rate and quality by factory</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(a.factoryPerformance).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(a.factoryPerformance)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([factory, perf]) => (
                  <div key={factory} className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="font-medium capitalize">{factory}</p>
                      <p className="text-xs text-muted-foreground">{perf.total} generations</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">
                          {((perf.success / Math.max(perf.total, 1)) * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Success</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{(perf.avgQuality * 100).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Quality</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">
                          {perf.avgLatency < 1000
                            ? `${perf.avgLatency}ms`
                            : `${(perf.avgLatency / 1000).toFixed(1)}s`}
                        </p>
                        <p className="text-xs text-muted-foreground">Latency</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {a.feedbackSummary.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Summary</CardTitle>
            <CardDescription>User feedback across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{a.feedbackSummary.total}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{a.feedbackSummary.avgRating.toFixed(1)}★</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
            {Object.keys(a.feedbackSummary.byCategory).length > 0 && (
              <div className="space-y-2">
                {Object.entries(a.feedbackSummary.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize text-sm">{category}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
