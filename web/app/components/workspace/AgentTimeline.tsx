"use client";
import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import type { AgentEvent } from "./types";

interface AgentTimelineProps {
  events: AgentEvent[];
}

const AGENT_COLORS: Record<string, string> = {
  Router: "#8b5cf6",
  "Product Manager": "#ec4899",
  "Frontend Engineer": "#06b6d4",
  "SEO Specialist": "#10b981",
  "QA Engineer": "#f59e0b",
  Security: "#ef4444",
  Performance: "#6366f1",
};

export function AgentTimeline({ events }: AgentTimelineProps) {
  return (
    <div className="p-3 space-y-1">
      {events.map((event) => {
        const color = AGENT_COLORS[event.agent] || "#8b5cf6";
        return (
          <div key={event.id} className="flex items-center gap-2 text-xs py-0.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-zinc-500 w-20 shrink-0 truncate">{event.agent}</span>
            <span className="text-zinc-400 flex-1 truncate">{event.action}</span>
            <span className="shrink-0">
              {event.status === "running" && <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />}
              {event.status === "completed" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {event.status === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
