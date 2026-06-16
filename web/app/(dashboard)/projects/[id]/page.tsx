"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Trash2, Eye, FileCode2, Layers, MessageSquare,
  Star, ChevronRight, Loader2, ExternalLink, Copy, Check,
} from "lucide-react";

type Tab = "files" | "blueprint" | "feedback" | "code";

interface Project {
  id: string;
  name: string;
  factory: string;
  prompt: string;
  quality_score: number;
  build_success: boolean;
  file_count: number;
  created_at: string;
  blueprint?: any;
  feedback?: any[];
}

interface FileItem {
  path: string;
  type: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tab, setTab] = useState<Tab>("files");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Feedback form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("general");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/files`).then((r) => r.json()),
    ]).then(([p, f]) => {
      setProject(p);
      setFiles(f.files || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleFileClick = async (filePath: string) => {
    setSelectedFile(filePath);
    setTab("code");
    // File content comes from the files array in project data
    setFileContent("// Loading...");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: id, rating, category, comment }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject((p) => p ? { ...p, feedback: [data, ...(p.feedback || [])] } : p);
        setRating(0);
        setComment("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="h-14 flex items-center px-4 gap-4">
          <button onClick={() => router.push("/projects")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium truncate">{project.name}</h1>
            <p className="text-xs text-muted-foreground capitalize">{project.factory}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/projects/${id}/download`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button
              onClick={async () => {
                if (confirm("Delete this project?")) {
                  await fetch(`/api/projects/${id}`, { method: "DELETE" });
                  router.push("/projects");
                }
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4">
          {([
            { id: "files" as const, icon: FileCode2, label: "Files", count: files.length },
            { id: "blueprint" as const, icon: Layers, label: "Blueprint" },
            { id: "feedback" as const, icon: MessageSquare, label: "Feedback", count: project.feedback?.length },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                tab === t.id
                  ? "border-white text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-7rem)]">
        {/* Files tab */}
        {tab === "files" && (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid gap-2">
              {files.map((f, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleFileClick(f.path)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-zinc-600 hover:bg-zinc-800/30 transition-all text-left group"
                >
                  <FileCode2 className="w-4 h-4 text-brand-light shrink-0" />
                  <span className="text-xs font-mono truncate flex-1">{f.path}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-muted-foreground">{f.type}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Code viewer */}
        {tab === "code" && selectedFile && (
          <div className="flex-1 flex flex-col">
            <div className="h-10 border-b border-border flex items-center px-4 justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-brand-light" />
                <span className="text-xs font-mono">{selectedFile}</span>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-muted-foreground leading-relaxed">
              <code>{fileContent}</code>
            </pre>
          </div>
        )}

        {tab === "code" && !selectedFile && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a file to view its code</p>
          </div>
        )}

        {/* Blueprint viewer */}
        {tab === "blueprint" && (
          <div className="flex-1 overflow-auto p-4">
            {project.blueprint ? (
              <pre className="text-xs font-mono text-muted-foreground p-4 rounded-xl border border-border bg-zinc-900/50 overflow-auto leading-relaxed">
                <code>{JSON.stringify(project.blueprint, null, 2)}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No blueprint available</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback tab */}
        {tab === "feedback" && (
          <div className="flex-1 overflow-auto p-4 max-w-xl">
            {/* Form */}
            <form onSubmit={handleFeedback} className="mb-8 p-4 rounded-xl border border-border">
              <p className="text-sm font-medium mb-4">Leave Feedback</p>

              {/* Star rating */}
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        s <= (hoverRating || rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && <span className="text-xs text-muted-foreground ml-2">{rating}/5</span>}
              </div>

              {/* Category */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["general", "quality", "design", "content", "performance"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all ${
                      category === c
                        ? "bg-white text-black"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment..."
                rows={3}
                className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors resize-none mb-4"
              />

              <button
                type="submit"
                disabled={!rating || submitting}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-30 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>

            {/* Existing feedback */}
            <div className="space-y-3">
              {(project.feedback || []).map((f: any) => (
                <div key={f.id} className="p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-muted-foreground capitalize">{f.category}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  {f.comment && <p className="text-xs text-muted-foreground">{f.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
