"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setSupabaseStatus(d.status === "ok" ? "connected" : "error"))
      .catch(() => setSupabaseStatus("error"));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Settings</h1>

      <div className="space-y-6">
        {/* LLM Provider */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border border-border"
        >
          <h2 className="text-sm font-medium mb-4">LLM Provider</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl border border-border"
        >
          <h2 className="text-sm font-medium mb-4">Connection Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Supabase</span>
              <span className={`flex items-center gap-1.5 text-xs ${supabaseStatus === "connected" ? "text-green-500" : supabaseStatus === "checking" ? "text-yellow-500" : "text-red-500"}`}>
                {supabaseStatus === "connected" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {supabaseStatus === "connected" ? "Connected" : supabaseStatus === "checking" ? "Checking..." : "Error"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">LLM Provider</span>
              <span className="text-xs text-muted-foreground capitalize">{provider}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
