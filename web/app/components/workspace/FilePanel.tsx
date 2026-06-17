"use client";
import { useState } from "react";
import {
  FileCode, FolderTree, Layout, ChevronDown, ChevronRight, Copy, Check,
  Download
} from "lucide-react";
import type { GeneratedFile } from "./types";

interface FilePanelProps {
  files: GeneratedFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  projectId: string | null;
}

export function FilePanel({ files, selectedFile, onSelectFile, projectId }: FilePanelProps) {
  const [tab, setTab] = useState<"files" | "blueprint">("files");
  const [copied, setCopied] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["src", "src/app", "src/components"]));

  const toggleDir = (dir: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  };

  const copyCode = () => {
    if (!selectedFile) return;
    const file = files.find((f) => f.path === selectedFile);
    if (file) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (!selectedFile || !projectId) return;
    window.open(`/api/projects/${projectId}/download`, "_blank");
  };

  // Build file tree
  const tree: Record<string, { files: GeneratedFile[]; dirs: Record<string, unknown> }> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = { files: [], dirs: {} };
      current = current[parts[i]].dirs as typeof tree;
    }
    const fileName = parts[parts.length - 1];
    const lastDir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
    if (!tree[lastDir]) tree[lastDir] = { files: [], dirs: {} };
    tree[lastDir].files.push(file);
  }

  const renderTree = (node: Record<string, { files: GeneratedFile[]; dirs: Record<string, unknown> }>, path = "", depth = 0) => {
    const entries: React.JSX.Element[] = [];

    for (const [name, dir] of Object.entries(node)) {
      if (name === "") {
        for (const file of dir.files) {
          const fileName = file.path.split("/").pop() || file.path;
          const isSelected = file.path === selectedFile;
          const Icon = fileName.endsWith(".tsx") || fileName.endsWith(".ts") ? FileCode : FileCode;
          entries.push(
            <button
              key={file.path}
              onClick={() => onSelectFile(file.path)}
              className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors ${
                isSelected ? "bg-violet-500/15 text-violet-300" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{fileName}</span>
            </button>
          );
        }
        continue;
      }

      const dirPath = path ? `${path}/${name}` : name;
      const isExpanded = expandedDirs.has(dirPath);
      entries.push(
        <button
          key={dirPath}
          onClick={() => toggleDir(dirPath)}
          className="w-full flex items-center gap-2 px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200 rounded-md transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <FolderTree className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
          <span>{name}</span>
        </button>
      );

      if (isExpanded) {
        entries.push(...renderTree(dir.dirs as Record<string, { files: GeneratedFile[]; dirs: Record<string, unknown> }>, dirPath, depth + 1));
      }
    }

    return entries;
  };

  const selectedFileData = files.find((f) => f.path === selectedFile);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        <button
          onClick={() => setTab("files")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "files" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <FolderTree className="w-3 h-3" /> Files ({files.length})
        </button>
        <button
          onClick={() => setTab("blueprint")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "blueprint" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <Layout className="w-3 h-3" /> Blueprint
        </button>
      </div>

      {tab === "files" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* File tree */}
          <div className="w-48 border-r border-white/5 overflow-y-auto py-1">
            {files.length === 0 ? (
              <p className="text-[10px] text-zinc-600 px-3 py-4">No files yet</p>
            ) : (
              renderTree(tree)
            )}
          </div>

          {/* Code viewer */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedFileData ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
                  <span className="text-[10px] text-zinc-500 truncate">{selectedFile}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={downloadFile}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Download className="w-3 h-3" /> ZIP
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{selectedFileData.content}</pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
                Select a file to view
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Blueprint tab */
        <div className="flex-1 overflow-auto p-3">
          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
            {JSON.stringify({
              project: { framework: "nextjs", styling: "tailwind", language: "typescript" },
              pages: [...new Set(files.filter((f) => f.type === "page").map((f) => f.path))],
              components: [...new Set(files.filter((f) => f.type === "component").map((f) => f.path.split("/").pop()?.replace(".tsx", "") || ""))],
              config: files.filter((f) => f.type === "config").map((f) => f.path),
              styles: files.filter((f) => f.type === "style").map((f) => f.path),
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
