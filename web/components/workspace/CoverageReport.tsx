"use client";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, FileText, Layers, Puzzle, Route, Database } from "lucide-react";
import { useState } from "react";
import type { CoverageReport as CoverageReportType, CoverageCategory } from "./types";

interface CoverageReportProps {
  report: CoverageReportType;
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  pages: FileText,
  components: Layers,
  features: Puzzle,
  routes: Route,
  entities: Database,
};

const CATEGORY_LABELS: Record<string, string> = {
  pages: "Pages",
  components: "Components",
  features: "Features",
  routes: "Routes",
  entities: "Entities",
};

function CategoryRow({ name, category }: { name: string; category: CoverageCategory }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[name] || FileText;
  const pct = Math.round(category.coverage * 100);

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-zinc-500" />
          )}
          <Icon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">{CATEGORY_LABELS[name] || name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">
            {category.generated.length}/{category.required.length}
          </span>
          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-[10px] font-medium ${
            pct === 100 ? "text-green-400" : pct >= 75 ? "text-amber-400" : "text-red-400"
          }`}>
            {pct}%
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {category.generated.map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-[10px] text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{item}</span>
            </div>
          ))}
          {category.missing.map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-[10px] text-red-400">
              <XCircle className="w-3 h-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CoverageReport({ report }: CoverageReportProps) {
  const pct = Math.round(report.overallCoverage * 100);

  return (
    <div className="p-3 space-y-3">
      {/* Overall coverage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${report.passed ? "bg-green-400" : "bg-amber-400"}`} />
          <span className="text-xs font-medium text-zinc-300">Requirement Coverage</span>
        </div>
        <span className={`text-sm font-bold ${
          pct === 100 ? "text-green-400" : pct >= 75 ? "text-amber-400" : "text-red-400"
        }`}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct === 100 ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Category breakdown */}
      <div className="space-y-1.5">
        {(["pages", "components", "features", "routes", "entities"] as const).map((key) => (
          <CategoryRow key={key} name={key} category={report[key]} />
        ))}
      </div>

      {/* Missing items */}
      {report.missingItems.length > 0 && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-[10px] text-red-400 font-medium mb-1">Missing Items</p>
          {report.missingItems.map((item, i) => (
            <p key={i} className="text-[10px] text-red-400/70">{item}</p>
          ))}
        </div>
      )}
    </div>
  );
}
