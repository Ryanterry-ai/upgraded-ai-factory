"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Zap, Clock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface Stats {
  totalProjects: number;
  totalGenerations: number;
  successRate: number;
  avgQuality: number;
  avgLatency: number;
  recentProjects: {
    id: string; name: string; factory: string; quality_score: number;
    build_success: boolean; file_count: number; created_at: string;
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

  const s = stats || {
    totalProjects: 0, totalGenerations: 0, successRate: 0, avgQuality: 0,
    avgLatency: 0, recentProjects: [], factoryDistribution: {},
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back. Here&apos;s your overview.</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Projects", value: s.totalProjects, icon: CheckCircle2, color: "text-brand-light" },
          { label: "Generations", value: s.totalGenerations, icon: Zap, color: "text-yellow-500" },
          { label: "Success Rate", value: `${Math.round(s.successRate * 100)}%`, icon: TrendingUp, color: "text-green-500" },
          { label: "Avg Latency", value: s.avgLatency < 1000 ? `${s.avgLatency}ms` : `${(s.avgLatency / 1000).toFixed(1)}s`, icon: Clock, color: "text-blue-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent projects */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-medium">Recent Projects</p>
          <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : s.recentProjects.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">No projects yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {s.recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.factory}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.build_success ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                  {p.build_success ? "Built" : "Partial"}
                </span>
                <span className="text-xs text-muted-foreground">{Math.round(p.quality_score * 100)}%</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Factory distribution */}
      {Object.keys(s.factoryDistribution).length > 0 && (
        <div className="mt-6 rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-4">Factory Distribution</p>
          <div className="space-y-3">
            {Object.entries(s.factoryDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([factory, count]) => {
                const max = Math.max(...Object.values(s.factoryDistribution));
                return (
                  <div key={factory} className="flex items-center gap-3">
                    <span className="text-xs capitalize w-24 truncate">{factory}</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-light rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
