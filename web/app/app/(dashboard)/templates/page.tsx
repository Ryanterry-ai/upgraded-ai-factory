"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe, ShoppingCart, LayoutDashboard, Settings, Bot, Code2,
  ArrowRight, Sparkles,
} from "lucide-react";

const TEMPLATES = [
  {
    id: "landing",
    name: "Landing Page",
    desc: "Modern SaaS landing with hero, features, pricing, and CTA",
    factory: "website",
    icon: Globe,
    gradient: "from-blue-500/20 to-purple-500/20",
    prompt: "Build a modern SaaS landing page with hero section, feature grid, pricing table, testimonials, and a call-to-action footer. Include responsive design and smooth scroll.",
  },
  {
    id: "dashboard",
    name: "Analytics Dashboard",
    desc: "Data dashboard with charts, tables, and filters",
    factory: "dashboard",
    icon: LayoutDashboard,
    gradient: "from-green-500/20 to-teal-500/20",
    prompt: "Build an analytics dashboard with sidebar navigation, top stats cards, line chart, bar chart, data table with sorting/filtering, and a date range picker. Include dark mode.",
  },
  {
    id: "ecommerce",
    name: "E-commerce Store",
    desc: "Product grid, cart, checkout flow",
    factory: "ecommerce",
    icon: ShoppingCart,
    gradient: "from-orange-500/20 to-red-500/20",
    prompt: "Build an e-commerce store with product grid, product detail page, shopping cart, checkout form, and order confirmation. Include search and category filters.",
  },
  {
    id: "saas-app",
    name: "SaaS App",
    desc: "Full app with auth, dashboard, settings",
    factory: "saas",
    icon: Sparkles,
    gradient: "from-purple-500/20 to-pink-500/20",
    prompt: "Build a SaaS application with login/register pages, main dashboard with stats, user management table, settings page with profile and billing tabs. Include sidebar navigation.",
  },
  {
    id: "admin",
    name: "Admin Panel",
    desc: "CRUD operations, data management",
    factory: "admin",
    icon: Settings,
    gradient: "from-zinc-500/20 to-slate-500/20",
    prompt: "Build an admin panel with sidebar, user management CRUD table, role-based access, data import/export, and activity log. Include search and pagination.",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    desc: "Personal portfolio with projects and blog",
    factory: "website",
    icon: Code2,
    gradient: "from-cyan-500/20 to-blue-500/20",
    prompt: "Build a developer portfolio with hero section, project showcase grid, about me section, skills list, blog posts, and contact form. Include animations.",
  },
];

export default function TemplatesPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Start from a template or create from scratch</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/projects/new?prompt=${encodeURIComponent(t.prompt)}`}
              className="block p-5 rounded-2xl border border-border hover:border-zinc-600 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <t.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">{t.name}</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t.desc}</p>
              <div className="flex items-center gap-1 text-xs text-brand-light group-hover:gap-2 transition-all">
                Use template <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
