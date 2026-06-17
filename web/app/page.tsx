"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Globe, ShoppingCart, LayoutDashboard, Settings, Bot, Wrench } from "lucide-react";

const FACTORIES = [
  { id: "website", label: "Website", icon: Globe, color: "#8b5cf6", desc: "Landing pages, portfolios, blogs" },
  { id: "ecommerce", label: "Ecommerce", icon: ShoppingCart, color: "#ec4899", desc: "Stores, product pages, checkout" },
  { id: "saas", label: "SaaS", icon: LayoutDashboard, color: "#06b6d4", desc: "Dashboards, auth, billing" },
  { id: "admin", label: "Admin", icon: Settings, color: "#f59e0b", desc: "Backoffice, CRM, data panels" },
  { id: "agent", label: "Agent", icon: Bot, color: "#10b981", desc: "AI agents, chatbots, copilots" },
  { id: "tools", label: "Internal Tools", icon: Wrench, color: "#6366f1", desc: "CRUD apps, data views" },
];

const SUGGESTIONS = [
  "Ecommerce store with product grid and cart",
  "SaaS dashboard with charts and billing",
  "Portfolio with blog and contact form",
  "Admin panel with user management",
  "Landing page for AI startup",
  "AI chatbot with conversation history",
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [hoveredFactory, setHoveredFactory] = useState<string | null>(null);

  const handleSubmit = (p: string) => {
    if (!p.trim()) return;
    router.push(`/projects/new?prompt=${encodeURIComponent(p.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">build.same</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</a>
            <a href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign In</a>
            <button onClick={() => handleSubmit(prompt || "Build a landing page")} className="text-sm bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              32 AI agents online
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Build anything
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                with AI.
              </span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
              Describe what you want. Our AI team of 32 agents designs, codes, and validates a production-ready application — in minutes, not months.
            </p>
          </motion.div>

          {/* Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#18181b] border border-white/10 rounded-2xl p-1">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Sparkles className="w-5 h-5 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit(prompt)}
                    placeholder="Describe your app, paste a URL, or upload a design..."
                    className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => handleSubmit(prompt)}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick inputs */}
            <div className="flex items-center justify-center gap-3 mt-4 text-xs text-zinc-500">
              <span>or start with:</span>
              {["Paste URL", "Upload PDF", "Figma file"].map((label) => (
                <button
                  key={label}
                  onClick={() => handleSubmit(`Build a ${label.toLowerCase()}`)}
                  className="px-3 py-1 rounded-full border border-white/10 hover:border-white/20 hover:text-zinc-300 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl mx-auto"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSubmit(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Factory Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-20"
        >
          <div className="rounded-2xl border border-white/10 bg-[#18181b]/50 p-6">
            <div className="text-center mb-6">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">build.same</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FACTORIES.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSubmit(`Build a ${f.label.toLowerCase()}`)}
                    onMouseEnter={() => setHoveredFactory(f.id)}
                    onMouseLeave={() => setHoveredFactory(null)}
                    className="relative p-4 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left group"
                  >
                    <Icon className="w-5 h-5 mb-3" style={{ color: f.color }} />
                    <div className="font-medium text-sm text-white">{f.label}</div>
                    <div className="text-xs text-zinc-500 mt-1">{f.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "AI Team of 32 Agents", desc: "Product managers, engineers, designers, QA, SEO — all working in parallel.", color: "#8b5cf6" },
            { title: "Real-Time Workspace", desc: "Watch agents think, build, and validate your project live.", color: "#ec4899" },
            { title: "Production-Ready Output", desc: "Next.js + TypeScript + Tailwind. Download and deploy instantly.", color: "#06b6d4" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center"
            >
              <div className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${f.color}15` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: f.color }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-24"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to build?</h2>
          <p className="text-zinc-400 mb-6">No credit card. No configuration. Just describe and generate.</p>
          <button
            onClick={() => handleSubmit(prompt || "Build a modern landing page")}
            className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Start Building
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-zinc-600">
          <span>build.same — AI-Native App Builder</span>
          <span>Powered by 32 AI Agents</span>
        </div>
      </footer>
    </div>
  );
}
