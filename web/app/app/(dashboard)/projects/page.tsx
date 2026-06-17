"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Loader2, Globe, ShoppingCart, LayoutDashboard, Settings, Bot, Code2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  factory: string;
  quality_score: number;
  build_success: boolean;
  file_count: number;
  created_at: string;
}

const FACTORY_ICONS: Record<string, any> = {
  website: Globe, ecommerce: ShoppingCart, saas: LayoutDashboard,
  admin: Settings, agent: Bot, tools: Code2, dashboard: LayoutDashboard,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects?limit=50")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects generated</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
            <Code2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No projects yet</p>
          <p className="text-sm text-muted-foreground mb-4">Generate your first project to get started</p>
          <Link href="/projects/new" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors">
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p, i) => {
            const Icon = FACTORY_ICONS[p.factory] || Globe;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border hover:border-zinc-600 hover:bg-zinc-800/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-700 transition-colors">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.factory} • {p.file_count} files</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.build_success ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                      {p.build_success ? "Built" : "Partial"}
                    </span>
                    <span className="text-xs text-muted-foreground">{Math.round(p.quality_score * 100)}%</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
