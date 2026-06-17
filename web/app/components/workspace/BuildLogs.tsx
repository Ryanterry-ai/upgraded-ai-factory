"use client";

interface BuildLogsProps {
  logs: string[];
}

export function BuildLogs({ logs }: BuildLogsProps) {
  return (
    <div className="p-3 font-mono text-[11px] space-y-0.5">
      {logs.map((log, i) => (
        <div key={i} className="text-zinc-500">
          <span className="text-zinc-600">{log.match(/^\[.*?\]/)?.[0] || ""}</span>{" "}
          <span className="text-zinc-400">{log.replace(/^\[.*?\]\s*/, "")}</span>
        </div>
      ))}
    </div>
  );
}
