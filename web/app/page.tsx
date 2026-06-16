"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe, ShoppingCart, LayoutDashboard, Bot, Settings, Code2 } from "lucide-react";

const factories = [
  { icon: Globe, label: "Website", desc: "Landing pages, portfolios, blogs" },
  { icon: ShoppingCart, label: "Ecommerce", desc: "Stores, product pages, checkout" },
  { icon: LayoutDashboard, label: "SaaS", desc: "Dashboards, auth, billing" },
  { icon: Settings, label: "Admin", desc: "Backoffice, CRM, data panels" },
  { icon: Bot, label: "Agent", desc: "AI agents, chatbots, copilots" },
  { icon: Code2, label: "Internal Tools", desc: "CRUD apps, data views" },
];

const features = [
  { title: "AI Team of 32 Agents", desc: "Product managers, engineers, designers, QA, SEO — all working in parallel." },
  { title: "Real-Time Workspace", desc: "Watch agents think, build, and validate your project live." },
  { title: "Production-Ready Output", desc: "Next.js + TypeScript + Tailwind. Download and deploy instantly." },
  { title: "Semantic Memory", desc: "The system learns from every generation to improve future outputs." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-light to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">build.same</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/projects/new"
              className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/20 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              32 AI agents ready
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Build anything
              <br />
              <span className="gradient-text">with AI.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Describe what you want. Our AI team of 32 agents designs, codes, and validates
              a production-ready application — in minutes, not months.
            </p>
          </motion.div>

          {/* Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Link href="/projects/new">
              <div className="glass rounded-2xl p-1 cursor-pointer group hover:border-brand-light/50 transition-all duration-300">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-brand-light transition-colors" />
                  <span className="text-muted-foreground text-left flex-1">
                    Describe your app, paste a URL, or upload a design...
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:block">⌘K</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Quick actions */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs text-muted-foreground">or start with:</span>
              {["Paste URL", "Upload PDF", "Figma file"].map((label) => (
                <Link
                  key={label}
                  href="/projects/new"
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-zinc-500 transition-all"
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Browser mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-xl border border-border bg-zinc-900/50 overflow-hidden glow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-zinc-800 text-xs text-muted-foreground">
                    build.same
                  </div>
                </div>
              </div>
              <div className="p-8 md:p-12">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {factories.map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                      className="p-4 rounded-xl border border-border bg-zinc-800/50 hover:border-brand-light/30 transition-all cursor-pointer group"
                    >
                      <f.icon className="w-5 h-5 text-brand-light mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium mb-1">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Not a code generator.
              <br />
              <span className="text-muted-foreground">An AI software team.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border hover:border-zinc-600 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <Zap className="w-5 h-5 text-brand-light" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to build?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              No credit card. No configuration. Just describe and generate.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>build.same — AI-Native App Builder</span>
          <span>Powered by 32 AI Agents</span>
        </div>
      </footer>
    </div>
  );
}
