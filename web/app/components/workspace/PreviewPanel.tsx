"use client";
import { useState } from "react";
import { Eye, Code2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import type { GeneratedFile } from "./types";

interface PreviewPanelProps {
  previewUrl: string | null;
  device: "desktop" | "tablet" | "mobile";
  status: "idle" | "generating" | "completed" | "error";
  files: GeneratedFile[];
}

const DEVICE_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PreviewPanel({ previewUrl, device, status, files }: PreviewPanelProps) {
  const [view, setView] = useState<"preview" | "code">("preview");

  if (status === "idle") {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-400/50" />
          </div>
          <p className="text-sm text-zinc-500">Your preview will appear here</p>
          <p className="text-xs text-zinc-600 mt-1">Describe what you want to build to get started</p>
        </div>
      </div>
    );
  }

  if (status === "generating" && !previewUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Building your project...</p>
          <p className="text-xs text-zinc-600 mt-1">AI agents are generating code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      {/* View tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setView("preview")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${view === "preview" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
          <button
            onClick={() => setView("code")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${view === "code" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Code2 className="w-3 h-3" /> Code
          </button>
        </div>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            <ExternalLink className="w-3 h-3" /> Open
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-start justify-center p-4">
        {view === "preview" && previewUrl ? (
          <div
            className="bg-[#18181b] rounded-lg overflow-hidden shadow-2xl transition-all duration-300 h-full border border-white/10"
            style={{
              width: DEVICE_WIDTHS[device],
              maxWidth: "100%",
            }}
          >
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : view === "code" ? (
          <div className="w-full h-full overflow-auto">
            <pre className="p-4 text-xs text-zinc-300 font-mono">
              {files.length > 0 ? (
                files.map((f) => (
                  <div key={f.path} className="mb-4">
                    <div className="text-violet-400 text-[10px] mb-1 font-sans">{f.path}</div>
                    <code className="whitespace-pre-wrap text-zinc-400">{f.content}</code>
                  </div>
                ))
              ) : (
                <span className="text-zinc-600">No files generated yet</span>
              )}
            </pre>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-12">
            <Eye className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
            <p className="text-sm">No preview available</p>
            <p className="text-xs text-zinc-600 mt-1">Preview will appear after generation completes</p>
          </div>
        )}
      </div>
    </div>
  );
}
