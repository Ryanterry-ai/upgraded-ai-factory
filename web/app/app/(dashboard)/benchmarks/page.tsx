"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Benchmark {
  id: string;
  prompt_id: string;
  platform: string;
  category: string;
  total_score: number;
  grade: string;
  created_at: string;
}

export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/benchmarks")
      .then((r) => r.json())
      .then((data) => setBenchmarks(data.benchmarks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Benchmarks</h1>
        <p className="text-muted-foreground">Platform comparison results</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : benchmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No benchmark results yet. Run benchmarks to see results.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benchmarks.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle className="text-lg">{b.prompt_id}</CardTitle>
                <CardDescription>{b.platform} — {b.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={b.grade.startsWith("A") ? "default" : b.grade.startsWith("B") ? "secondary" : "destructive"}>
                    {b.grade}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Score: {(b.total_score * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
