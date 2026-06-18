/**
 * UI Rendering Engine — Pixel-Realistic Component Generation
 *
 * Inspired by ai-website-cloner-template's approach:
 * - Foundation-First: Design tokens → TypeScript types → Components
 * - Component Specs: Detailed specifications before generation
 * - Small Tasks: Break complex sections into focused builders
 * - Design Token System: Colors, fonts, spacing extracted per domain
 *
 * This engine runs AFTER RPSE and generates the visual skin layer.
 * It does NOT participate in architecture, workflow, or business logic.
 */

import { detectBlueprint, type DomainBlueprint } from "./domain-blueprints";
import { detectRPSEContext, type RPSEContext } from "./rpse";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    card: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ComponentSpec {
  name: string;
  type: "layout" | "data-display" | "form" | "navigation" | "feedback" | "chart";
  description: string;
  props: Array<{ name: string; type: string; required: boolean; description: string }>;
  states: string[];
  responsive: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  interactions: string[];
  accessibility: string[];
  dependencies: string[];
}

export interface SectionSpec {
  name: string;
  components: ComponentSpec[];
  layout: "stack" | "grid" | "sidebar" | "hero" | "card-group";
  columns?: number;
  gap?: string;
}

export interface UIRenderingPlan {
  tokens: DesignTokens;
  sections: SectionSpec[];
  globalStyles: string;
  layoutFile: string;
  headerFile: string;
  footerFile: string;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN-SPECIFIC DESIGN TOKENS
// ═══════════════════════════════════════════════════════════

const DOMAIN_TOKENS: Record<string, DesignTokens> = {
  "gym-crm": {
    colors: {
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#3b82f6",
      background: "#f8fafc",
      foreground: "#0f172a",
      muted: "#64748b",
      card: "#ffffff",
      border: "#e2e8f0",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
    borderRadius: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", full: "9999px" },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
  },
  ecommerce: {
    colors: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#a78bfa",
      background: "#fafafa",
      foreground: "#18181b",
      muted: "#71717a",
      card: "#ffffff",
      border: "#e4e4e7",
      success: "#16a34a",
      warning: "#ea580c",
      error: "#dc2626",
    },
    fonts: {
      heading: "'Plus Jakarta Sans', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'Fira Code', monospace",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
    borderRadius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", full: "9999px" },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
  },
  streaming: {
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#f87171",
      background: "#0a0a0a",
      foreground: "#fafafa",
      muted: "#a1a1aa",
      card: "#18181b",
      border: "#27272a",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444",
    },
    fonts: {
      heading: "'Bebas Neue', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
    borderRadius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", full: "9999px" },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.4)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.4)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.5)",
    },
  },
  restaurant: {
    colors: {
      primary: "#dc2626",
      secondary: "#991b1b",
      accent: "#fbbf24",
      background: "#fffbeb",
      foreground: "#1c1917",
      muted: "#78716c",
      card: "#ffffff",
      border: "#e7e5e4",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
    },
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Lora', serif",
      mono: "'JetBrains Mono', monospace",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
    borderRadius: { sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
  },
  "admin-dashboard": {
    colors: {
      primary: "#2563eb",
      secondary: "#1d4ed8",
      accent: "#60a5fa",
      background: "#f1f5f9",
      foreground: "#0f172a",
      muted: "#64748b",
      card: "#ffffff",
      border: "#e2e8f0",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
    borderRadius: { sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
  },
};

const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    primary: "#2563eb",
    secondary: "#1e40af",
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#6b7280",
    card: "#ffffff",
    border: "#e5e7eb",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'Fira Code', monospace",
  },
  spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
  borderRadius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", full: "9999px" },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
  },
};

// ═══════════════════════════════════════════════════════════
// COMPONENT SPEC TEMPLATES
// ═══════════════════════════════════════════════════════════

const COMPONENT_SPECS: Record<string, ComponentSpec[]> = {
  "gym-crm": [
    {
      name: "DashboardStats",
      type: "data-display",
      description: "Key metrics row showing total members, revenue, attendance, retention",
      props: [
        { name: "stats", type: "Array<{label: string, value: string, change: string, trend: 'up'|'down'}>", required: true, description: "Stats to display" },
        { name: "period", type: "'today' | 'week' | 'month'", required: false, description: "Time period filter" },
      ],
      states: ["loading", "loaded", "error"],
      responsive: { mobile: "grid-cols-2", tablet: "grid-cols-3", desktop: "grid-cols-6" },
      interactions: ["Period toggle changes displayed data"],
      accessibility: ["Role=status for each stat", "ARIA labels for trend indicators"],
      dependencies: [],
    },
    {
      name: "MemberTable",
      type: "data-display",
      description: "Sortable, filterable table of gym members with search",
      props: [
        { name: "members", type: "Member[]", required: true, description: "Member data array" },
        { name: "onEdit", type: "(member: Member) => void", required: false, description: "Edit handler" },
        { name: "onRemove", type: "(member: Member) => void", required: false, description: "Remove handler" },
      ],
      states: ["idle", "searching", "filtering", "paginating"],
      responsive: { mobile: "stack cards", tablet: "condensed table", desktop: "full table" },
      interactions: ["Search by name/email", "Filter by status/plan", "Sort by column", "Pagination"],
      accessibility: ["Sortable column headers", "Row selection", "Keyboard navigation"],
      dependencies: [],
    },
    {
      name: "LeadPipeline",
      type: "data-display",
      description: "Kanban-style lead pipeline with drag-and-drop stages",
      props: [
        { name: "leads", type: "Lead[]", required: true, description: "Lead data array" },
        { name: "stages", type: "Stage[]", required: false, description: "Pipeline stages" },
        { name: "onMove", type: "(leadId: string, stage: string) => void", required: false, description: "Move handler" },
      ],
      states: ["idle", "dragging", "dropping"],
      responsive: { mobile: "vertical stack", tablet: "horizontal scroll", desktop: "full kanban" },
      interactions: ["Drag and drop between stages", "Click to view details", "Quick add lead"],
      accessibility: ["ARIA roles for drag-and-drop", "Keyboard alternative for moving cards"],
      dependencies: [],
    },
    {
      name: "AttendanceCalendar",
      type: "data-display",
      description: "Monthly calendar view with attendance tracking per day",
      props: [
        { name: "records", type: "AttendanceRecord[]", required: true, description: "Attendance records" },
        { name: "onMark", type: "(date: string, status: string) => void", required: false, description: "Mark attendance handler" },
      ],
      states: ["viewing", "marking", "filtering"],
      responsive: { mobile: "compact calendar", tablet: "standard calendar", desktop: "full calendar with sidebar" },
      interactions: ["Navigate months", "Select day", "Mark attendance", "Filter by member"],
      accessibility: ["Calendar grid role", "Day selection keyboard support"],
      dependencies: [],
    },
    {
      name: "InvoiceTable",
      type: "data-display",
      description: "Billing invoices with status, amount, and payment actions",
      props: [
        { name: "invoices", type: "Invoice[]", required: true, description: "Invoice data" },
        { name: "onMarkPaid", type: "(invoice: Invoice) => void", required: false, description: "Mark paid handler" },
      ],
      states: ["idle", "searching", "filtering"],
      responsive: { mobile: "card view", tablet: "condensed table", desktop: "full table" },
      interactions: ["Search by member", "Filter by status", "Mark as paid", "View details"],
      accessibility: ["Status badges with ARIA labels", "Action buttons"],
      dependencies: [],
    },
    {
      name: "ClassSchedule",
      type: "data-display",
      description: "Weekly class schedule with booking and capacity tracking",
      props: [
        { name: "classes", type: "ClassItem[]", required: true, description: "Class data" },
        { name: "onBook", type: "(classId: string) => void", required: false, description: "Book class handler" },
      ],
      states: ["viewing", "booking", "filtering"],
      responsive: { mobile: "day list", tablet: "day tabs", desktop: "week grid" },
      interactions: ["Select day", "Filter by category", "Book class", "View waitlist"],
      accessibility: ["Day navigation", "Capacity indicators"],
      dependencies: [],
    },
  ],
  ecommerce: [
    {
      name: "ProductGrid",
      type: "data-display",
      description: "Responsive product grid with quick-view and add-to-cart",
      props: [
        { name: "products", type: "Product[]", required: true, description: "Product data" },
        { name: "onAddToCart", type: "(product: Product) => void", required: false, description: "Add to cart handler" },
      ],
      states: ["loading", "loaded", "filtering"],
      responsive: { mobile: "1 column", tablet: "2 columns", desktop: "4 columns" },
      interactions: ["Quick view hover", "Add to cart", "Filter by category", "Sort by price/rating"],
      accessibility: ["Product cards with ARIA labels", "Cart count announcement"],
      dependencies: [],
    },
  ],
  streaming: [
    {
      name: "ContentCarousel",
      type: "data-display",
      description: "Horizontal scrolling content carousel for movies/shows",
      props: [
        { name: "items", type: "ContentItem[]", required: true, description: "Content items" },
        { name: "title", type: "string", required: true, description: "Carousel section title" },
      ],
      states: ["scrolling", "hovering", "focused"],
      responsive: { mobile: "2 items visible", tablet: "4 items visible", desktop: "6 items visible" },
      interactions: ["Horizontal scroll", "Hover preview", "Click to play", "Keyboard navigation"],
      accessibility: ["Scrollable region", "Item count announcement"],
      dependencies: [],
    },
  ],
  restaurant: [
    {
      name: "MenuSection",
      type: "data-display",
      description: "Categorized menu with prices and dietary indicators",
      props: [
        { name: "items", type: "MenuItem[]", required: true, description: "Menu items" },
        { name: "categories", type: "string[]", required: false, description: "Category filters" },
      ],
      states: ["viewing", "filtering", "ordering"],
      responsive: { mobile: "stacked cards", tablet: "2 columns", desktop: "3 columns" },
      interactions: ["Filter by category", "Add to order", "View item details"],
      accessibility: ["Category navigation", "Price announcement"],
      dependencies: [],
    },
  ],
  "admin-dashboard": [
    {
      name: "DataTable",
      type: "data-display",
      description: "Sortable data table with search, filter, and pagination",
      props: [
        { name: "columns", type: "Column[]", required: true, description: "Table columns" },
        { name: "data", type: "Record<string, unknown>[]", required: true, description: "Table data" },
      ],
      states: ["loading", "loaded", "searching", "sorting"],
      responsive: { mobile: "card view", tablet: "condensed table", desktop: "full table" },
      interactions: ["Sort by column", "Search", "Filter", "Pagination", "Row selection"],
      accessibility: ["Sortable headers", "Row count", "Keyboard navigation"],
      dependencies: [],
    },
  ],
};

// ═══════════════════════════════════════════════════════════
// DESIGN TOKEN GENERATION
// ═══════════════════════════════════════════════════════════

export function getDesignTokens(domain: string): DesignTokens {
  return DOMAIN_TOKENS[domain] || DEFAULT_TOKENS;
}

export function generateGlobalCSS(tokens: DesignTokens, domain: string): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: ${tokens.colors.background};
  --foreground: ${tokens.colors.foreground};
  --primary: ${tokens.colors.primary};
  --secondary: ${tokens.colors.secondary};
  --accent: ${tokens.colors.accent};
  --muted: ${tokens.colors.muted};
  --card: ${tokens.colors.card};
  --border: ${tokens.colors.border};
  --success: ${tokens.colors.success};
  --warning: ${tokens.colors.warning};
  --error: ${tokens.colors.error};

  --font-heading: ${tokens.fonts.heading};
  --font-body: ${tokens.fonts.body};
  --font-mono: ${tokens.fonts.mono};

  --radius-sm: ${tokens.borderRadius.sm};
  --radius-md: ${tokens.borderRadius.md};
  --radius-lg: ${tokens.borderRadius.lg};
  --radius-xl: ${tokens.borderRadius.xl};

  --shadow-sm: ${tokens.shadows.sm};
  --shadow-md: ${tokens.shadows.md};
  --shadow-lg: ${tokens.shadows.lg};
  --shadow-xl: ${tokens.shadows.xl};
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

* {
  box-sizing: border-box;
}

img {
  max-width: 100%;
  height: auto;
}

/* Domain: ${domain} */
`;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT GENERATION (Foundation-First)
// ═══════════════════════════════════════════════════════════

export function generateComponent(
  spec: ComponentSpec,
  domain: string,
  tokens: DesignTokens,
  mockData: Record<string, unknown>
): string {
  const accentColor = tokens.colors.primary;

  switch (spec.name) {
    case "DashboardStats":
      return generateDashboardStats(spec, tokens, mockData);
    case "MemberTable":
      return generateMemberTable(spec, tokens, mockData);
    case "LeadPipeline":
      return generateLeadPipeline(spec, tokens, mockData);
    case "AttendanceCalendar":
      return generateAttendanceCalendar(spec, tokens, mockData);
    case "InvoiceTable":
      return generateInvoiceTable(spec, tokens, mockData);
    case "ClassSchedule":
      return generateClassSchedule(spec, tokens, mockData);
    case "ProductGrid":
      return generateProductGrid(spec, tokens, mockData);
    case "ContentCarousel":
      return generateContentCarousel(spec, tokens, mockData);
    case "MenuSection":
      return generateMenuSection(spec, tokens, mockData);
    case "DataTable":
      return generateDataTable(spec, tokens, mockData);
    default:
      return generateGenericComponent(spec, tokens, mockData);
  }
}

function generateDashboardStats(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  const stats = (mockData.stats as Array<{label: string; value: string; change: string; trend: string}>) || [
    { label: "Total Members", value: "1,524", change: "+12%", trend: "up" },
    { label: "Monthly Revenue", value: "$89,450", change: "+8.2%", trend: "up" },
    { label: "Avg Attendance", value: "92/day", change: "+5.1%", trend: "up" },
    { label: "Retention Rate", value: "78.3%", change: "-1.2%", trend: "down" },
  ];

  const colorMap: Record<string, string> = {
    "Total Members": "blue",
    "Monthly Revenue": "green",
    "Avg Attendance": "purple",
    "Retention Rate": "amber",
  };

  return `"use client";
import { useState } from "react";

const STATS = ${JSON.stringify(stats, null, 2)};

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200",
  amber: "bg-amber-50 border-amber-200",
};

export function DashboardStats() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={\`px-3 py-1 rounded-md text-sm \${
                period === p ? "bg-white shadow text-gray-900" : "text-gray-500"
              }\`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className={\`p-4 rounded-xl border \${COLOR_MAP[s.label] || "bg-gray-50 border-gray-200"}\`}
          >
            <p className="text-xs text-gray-600 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className={\`text-xs mt-1 \${
              s.trend === "up" ? "text-green-600" : "text-red-600"
            }\`}>
              {s.change} vs last {period}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
}

function generateMemberTable(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  const members = (mockData.members as Array<Record<string, string>>) || [
    { id: "1", name: "Alex Thompson", email: "alex@email.com", membership: "Premium", status: "Active", joinDate: "Jan 2024", lastVisit: "2 days ago" },
    { id: "2", name: "Maria Garcia", email: "maria@email.com", membership: "Standard", status: "Active", joinDate: "Feb 2024", lastVisit: "Today" },
    { id: "3", name: "David Kim", email: "david@email.com", membership: "Premium", status: "Active", joinDate: "Mar 2024", lastVisit: "Yesterday" },
  ];

  return `"use client";
import { useState, useMemo } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  membership: string;
  status: string;
  joinDate: string;
  lastVisit: string;
}

const MOCK_MEMBERS: Member[] = ${JSON.stringify(members, null, 2)};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Expired: "bg-red-100 text-red-800",
};

const PLAN_COLORS: Record<string, string> = {
  Premium: "bg-purple-100 text-purple-800",
  Standard: "bg-blue-100 text-blue-800",
  Basic: "bg-gray-100 text-gray-800",
};

export function MemberTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    let result = [...MOCK_MEMBERS];
    if (search) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") result = result.filter((m) => m.status === statusFilter);
    if (planFilter !== "all") result = result.filter((m) => m.membership === planFilter);
    return result;
  }, [search, statusFilter, planFilter]);

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Expired">Expired</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          <option value="all">All Plans</option>
          <option value="Premium">Premium</option>
          <option value="Standard">Standard</option>
          <option value="Basic">Basic</option>
        </select>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">
                  <span className={\`px-2 py-1 rounded-full text-xs font-medium \${PLAN_COLORS[m.membership] || "bg-gray-100"}\`}>
                    {m.membership}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_COLORS[m.status] || "bg-gray-100"}\`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.joinDate}</td>
                <td className="px-4 py-3 text-gray-600">{m.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
}

function generateLeadPipeline(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  const leads = (mockData.leads as Array<Record<string, unknown>>) || [
    { id: "1", name: "Jennifer Taylor", email: "jennifer@email.com", value: 1200, stage: "new", source: "Website" },
    { id: "2", name: "Robert Martinez", email: "robert@email.com", value: 2400, stage: "qualified", source: "Referral" },
    { id: "3", name: "Amanda White", email: "amanda@email.com", value: 1800, stage: "contacted", source: "Social" },
  ];

  return `"use client";
import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  email: string;
  value: number;
  stage: "new" | "contacted" | "qualified" | "proposal" | "closed-won" | "closed-lost";
  source: string;
}

const STAGES = [
  { id: "new", label: "New Leads", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", label: "Qualified", color: "bg-purple-500" },
  { id: "proposal", label: "Proposal", color: "bg-orange-500" },
  { id: "closed-won", label: "Closed Won", color: "bg-green-500" },
  { id: "closed-lost", label: "Closed Lost", color: "bg-red-500" },
];

const MOCK_LEADS: Lead[] = ${JSON.stringify(leads, null, 2)};

export function LeadPipeline() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const moveLead = (leadId: string, newStage: Lead["stage"]) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
  };

  const totalValue = leads.filter((l) => l.stage !== "closed-lost").reduce((sum, l) => sum + l.value, 0);
  const wonValue = leads.filter((l) => l.stage === "closed-won").reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-600">Total Pipeline</p>
          <p className="text-xl font-bold text-blue-700">\${totalValue.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-xs text-green-600">Won Deals</p>
          <p className="text-xl font-bold text-green-700">\${wonValue.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          return (
            <div key={stage.id} className="min-w-[250px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={\`w-2 h-2 rounded-full \${stage.color}\`} />
                <h3 className="font-medium text-sm">{stage.label}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 rounded">{stageLeads.length}</span>
              </div>
              <div
                className="space-y-2 min-h-[200px] p-2 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedLead) moveLead(draggedLead.id, stage.id as Lead["stage"]);
                  setDraggedLead(null);
                }}
              >
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedLead(lead)}
                    className="bg-white p-3 rounded-lg border shadow-sm cursor-grab hover:shadow-md transition-shadow"
                  >
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{lead.email}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-semibold text-green-600">\${lead.value.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">{lead.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`;
}

function generateAttendanceCalendar(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";
import { useState, useMemo } from "react";

interface AttendanceRecord {
  memberId: string;
  memberName: string;
  date: string;
  status: "present" | "absent" | "late";
}

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { memberId: "1", memberName: "Alex Thompson", date: new Date().toISOString().split("T")[0], status: "present" },
  { memberId: "2", memberName: "Maria Garcia", date: new Date().toISOString().split("T")[0], status: "late" },
  { memberId: "3", memberName: "David Kim", date: new Date().toISOString().split("T")[0], status: "absent" },
];

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
};

export function AttendanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [daysInMonth, firstDayOfWeek]);

  const getAttendanceForDay = (day: number) => {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
    return attendance.filter((a) => a.date === dateStr);
  };

  const markAttendance = (day: number, status: "present" | "absent" | "late") => {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
    setAttendance((prev) => [
      ...prev,
      { memberId: String(prev.length + 1), memberName: "New Member", date: dateStr, status },
    ]);
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-bold text-green-700">{presentCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-600">Late</p>
          <p className="text-2xl font-bold text-yellow-700">{lateCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-bold text-red-700">{absentCount}</p>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">&larr; Prev</button>
          <h3 className="font-semibold">{monthName}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">Next &rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-medium text-gray-500 py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            if (day === null) return <div key={\`empty-\${i}\`} />;
            const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
            const records = getAttendanceForDay(day);
            const isSelected = dateStr === selectedDate;
            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={\`p-2 rounded-lg cursor-pointer transition-colors \${
                  isSelected ? "bg-blue-100 border-2 border-blue-500" : "hover:bg-gray-50 border-2 border-transparent"
                }\`}
              >
                <div className="font-medium">{day}</div>
                {records.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {records.slice(0, 3).map((r, j) => (
                      <div
                        key={j}
                        className={\`w-1.5 h-1.5 rounded-full \${
                          r.status === "present" ? "bg-green-500" : r.status === "late" ? "bg-yellow-500" : "bg-red-500"
                        }\`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Quick Mark for {selectedDate}</h4>
        <div className="flex gap-2">
          <button onClick={() => markAttendance(parseInt(selectedDate.split("-")[2]) || 0, "present")} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Mark Present</button>
          <button onClick={() => markAttendance(parseInt(selectedDate.split("-")[2]) || 0, "late")} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">Mark Late</button>
          <button onClick={() => markAttendance(parseInt(selectedDate.split("-")[2]) || 0, "absent")} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Mark Absent</button>
        </div>
      </div>
    </div>
  );
}
`;
}

function generateInvoiceTable(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  const invoices = (mockData.invoices as Array<Record<string, unknown>>) || [
    { id: "INV-001", memberName: "Alex Thompson", amount: 49.99, status: "paid", dueDate: "2025-01-01", plan: "Premium" },
    { id: "INV-002", memberName: "Maria Garcia", amount: 99.99, status: "paid", dueDate: "2025-01-01", plan: "VIP" },
    { id: "INV-003", memberName: "David Kim", amount: 29.99, status: "overdue", dueDate: "2025-01-01", plan: "Basic" },
  ];

  return `"use client";
import { useState, useMemo } from "react";

interface Invoice {
  id: string;
  memberName: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  plan: string;
}

const MOCK_INVOICES: Invoice[] = ${JSON.stringify(invoices, null, 2)};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

export function InvoiceTable() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...MOCK_INVOICES];
    if (statusFilter !== "all") result = result.filter((i) => i.status === statusFilter);
    if (search) result = result.filter((i) => i.memberName.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [statusFilter, search]);

  const totalPaid = MOCK_INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = MOCK_INVOICES.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex-1">
          <p className="text-xs text-green-600">Total Paid</p>
          <p className="text-xl font-bold text-green-700">\${totalPaid.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex-1">
          <p className="text-xs text-yellow-600">Pending/Overdue</p>
          <p className="text-xl font-bold text-yellow-700">\${totalPending.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <input type="text" placeholder="Search member..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 border rounded-lg text-sm flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                <td className="px-4 py-3 font-medium">{inv.memberName}</td>
                <td className="px-4 py-3 text-gray-600">{inv.plan}</td>
                <td className="px-4 py-3 font-semibold">\${inv.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{inv.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_COLORS[inv.status]}\`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
}

function generateClassSchedule(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";
import { useState } from "react";

interface ClassItem {
  id: string;
  name: string;
  instructor: string;
  day: string;
  time: string;
  duration: string;
  capacity: number;
  booked: number;
  category: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MOCK_CLASSES: ClassItem[] = [
  { id: "1", name: "Morning Yoga", instructor: "Lisa Chen", day: "Monday", time: "07:00", duration: "60min", capacity: 20, booked: 15, category: "Yoga" },
  { id: "2", name: "HIIT Blast", instructor: "Mike Torres", day: "Monday", time: "08:00", duration: "45min", capacity: 25, booked: 22, category: "Cardio" },
  { id: "3", name: "Strength Training", instructor: "James Park", day: "Monday", time: "10:00", duration: "60min", capacity: 15, booked: 12, category: "Strength" },
  { id: "4", name: "Spin Class", instructor: "Sarah Kim", day: "Tuesday", time: "07:00", duration: "45min", capacity: 30, booked: 28, category: "Cardio" },
  { id: "5", name: "Pilates", instructor: "Lisa Chen", day: "Tuesday", time: "09:00", duration: "60min", capacity: 18, booked: 10, category: "Flexibility" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Yoga: "bg-purple-100 text-purple-800",
  Cardio: "bg-red-100 text-red-800",
  Strength: "bg-blue-100 text-blue-800",
  Flexibility: "bg-green-100 text-green-800",
};

export function ClassSchedule() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const dayClasses = MOCK_CLASSES.filter(
    (c) => c.day === selectedDay && (selectedCategory === "all" || c.category === selectedCategory)
  );

  const categories = [...new Set(MOCK_CLASSES.map((c) => c.category))];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={\`px-4 py-2 rounded-lg text-sm whitespace-nowrap \${
              selectedDay === day ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }\`}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setSelectedCategory("all")} className={\`px-3 py-1 rounded-full text-xs \${selectedCategory === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}\`}>All</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={\`px-3 py-1 rounded-full text-xs \${selectedCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}\`}>{cat}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {dayClasses.map((cls) => {
          const spotsLeft = cls.capacity - cls.booked;
          const isFull = spotsLeft === 0;
          return (
            <div key={cls.id} className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{cls.name}</h3>
                  <span className={\`px-2 py-0.5 rounded-full text-xs \${CATEGORY_COLORS[cls.category] || "bg-gray-100"}\`}>{cls.category}</span>
                </div>
                <p className="text-sm text-gray-600">with {cls.instructor}</p>
                <p className="text-sm text-gray-500">{cls.time} · {cls.duration}</p>
              </div>
              <div className="text-right">
                <div className={\`text-sm font-medium \${isFull ? "text-red-600" : spotsLeft <= 3 ? "text-orange-600" : "text-green-600"}\`}>
                  {isFull ? "Full" : \`\${spotsLeft} spots left\`}
                </div>
                <button disabled={isFull} className={\`mt-2 px-4 py-1.5 rounded-lg text-sm \${isFull ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}\`}>
                  {isFull ? "Waitlist" : "Book"}
                </button>
              </div>
            </div>
          );
        })}
        {dayClasses.length === 0 && <p className="text-center text-gray-500 py-8">No classes scheduled for {selectedDay}</p>}
      </div>
    </div>
  );
}
`;
}

function generateProductGrid(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Whey Protein Isolate", price: 54.99, image: "https://images.unsplash.com/photo-1593095948071-474c5cc2f0e3?w=400", category: "Protein", rating: 4.8, reviews: 234 },
  { id: "2", name: "Creatine Monohydrate", price: 29.99, image: "https://images.unsplash.com/photo-1622485831930-6961e42a6e9f?w=400", category: "Performance", rating: 4.7, reviews: 189 },
  { id: "3", name: "BCAA Energy", price: 34.99, image: "https://images.unsplash.com/photo-1597303877115-8a3e7ce7c4e0?w=400", category: "Recovery", rating: 4.6, reviews: 156 },
  { id: "4", name: "Pre-Workout Formula", price: 42.99, image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400", category: "Performance", rating: 4.9, reviews: 312 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Protein: "bg-blue-100 text-blue-800",
  Performance: "bg-orange-100 text-orange-800",
  Recovery: "bg-green-100 text-green-800",
};

export function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categories = ["all", ...new Set(MOCK_PRODUCTS.map((p) => p.category))];

  const filtered = selectedCategory === "all" ? MOCK_PRODUCTS : MOCK_PRODUCTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={\`px-4 py-2 rounded-full text-sm \${
            selectedCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }\`}>
            {cat === "all" ? "All Products" : cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <div key={product.id} className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium">{product.category}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{product.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500">{"★".repeat(Math.floor(product.rating))}</span>
                <span className="text-sm text-gray-500">({product.reviews})</span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-lg font-bold text-blue-600">\${product.price}</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
}

function generateContentCarousel(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";
import { useRef } from "react";

interface ContentItem {
  id: string;
  title: string;
  image: string;
  category: string;
  duration: string;
}

const MOCK_ITEMS: ContentItem[] = [
  { id: "1", title: "The Last Kingdom", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400", category: "Action", duration: "2h 15min" },
  { id: "2", title: "Ocean Mysteries", image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400", category: "Documentary", duration: "1h 45min" },
  { id: "3", title: "City Lights", image: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400", category: "Drama", duration: "2h 05min" },
  { id: "4", title: "Laugh Out Loud", image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400", category: "Comedy", duration: "1h 30min" },
  { id: "5", title: "Space Odyssey", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400", category: "Sci-Fi", duration: "2h 30min" },
  { id: "6", title: "Love in Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400", category: "Romance", duration: "1h 50min" },
];

export function ContentCarousel({ title }: { title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700">&larr;</button>
          <button onClick={() => scroll("right")} className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700">&rarr;</button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {MOCK_ITEMS.map((item) => (
          <div key={item.id} className="min-w-[200px] group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <img src={item.image} alt={item.title} className="w-full h-[280px] object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm font-medium">{item.duration}</p>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-medium text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
}

function generateMenuSection(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";
import { useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  dietary: string[];
}

const MOCK_MENU: MenuItem[] = [
  { id: "1", name: "Salmon Sashimi", price: 18.99, description: "Fresh Atlantic salmon, thinly sliced", category: "Sashimi", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400", dietary: ["gluten-free"] },
  { id: "2", name: "Dragon Roll", price: 16.99, description: "Shrimp tempura, avocado, eel sauce", category: "Rolls", image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400", dietary: [] },
  { id: "3", name: "Miso Soup", price: 4.99, description: "Traditional fermented soybean broth", category: "Starters", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400", dietary: ["vegan"] },
  { id: "4", name: "Chicken Teriyaki", price: 15.99, description: "Grilled chicken with sweet teriyaki glaze", category: "Mains", image: "https://images.unsplash.com/photo-1609183480237-ccf9872981c2?w=400", dietary: [] },
];

const CATEGORIES = ["All", "Sashimi", "Rolls", "Starters", "Mains"];

export function MenuSection() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = selectedCategory === "All" ? MOCK_MENU : MOCK_MENU.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={\`px-4 py-2 rounded-full text-sm whitespace-nowrap \${
              selectedCategory === cat ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }\`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
            <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{item.name}</h3>
                <span className="text-lg font-bold text-red-600">\${item.price}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              <div className="flex gap-2 mt-2">
                {item.dietary.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{d}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
}

function generateDataTable(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";
import { useState, useMemo } from "react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, string>[];
}

export function DataTable({ columns, data }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>(columns[0]?.key || "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    let result = [...data];
    if (search) {
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(search.toLowerCase()))
      );
    }
    result.sort((a, b) => {
      const aVal = String(a[sortField] || "");
      const bVal = String(b[sortField] || "");
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [data, search, sortField, sortDir]);

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        className="px-4 py-2 border rounded-lg text-sm w-full md:w-64"
      />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => {
                    if (col.sortable !== false) {
                      if (sortField === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortField(col.key); setSortDir("asc"); }
                    }
                  }}
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                >
                  {col.label} {sortField === col.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border disabled:opacity-50">Prev</button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
}

function generateGenericComponent(spec: ComponentSpec, tokens: DesignTokens, mockData: Record<string, unknown>): string {
  return `"use client";

export function ${spec.name}() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold">${spec.name}</h2>
        <p className="text-gray-600 mt-2">${spec.description}</p>
      </div>
    </section>
  );
}
`;
}

// ═══════════════════════════════════════════════════════════
// MAIN PIPELINE INTEGRATION
// ═══════════════════════════════════════════════════════════

export function generateUIComponents(
  domain: string,
  pageNames: string[],
  rpseData?: Record<string, unknown>
): Array<{ path: string; content: string; type: string }> {
  const tokens = getDesignTokens(domain);
  const specs = COMPONENT_SPECS[domain] || [];
  const files: Array<{ path: string; content: string; type: string }> = [];

  // Generate each component from its spec
  for (const spec of specs) {
    const mockData = (rpseData as Record<string, Record<string, unknown>>)?.[spec.name.toLowerCase()] || {};
    const content = generateComponent(spec, domain, tokens, mockData);
    files.push({
      path: `src/components/${spec.name}.tsx`,
      content,
      type: "component",
    });
  }

  return files;
}

export function generateFoundation(
  domain: string,
  projectName: string,
  navigation: string[]
): Array<{ path: string; content: string; type: string }> {
  const tokens = getDesignTokens(domain);
  const files: Array<{ path: string; content: string; type: string }> = [];

  // 1. Global CSS with design tokens
  files.push({
    path: "src/app/globals.css",
    content: generateGlobalCSS(tokens, domain),
    type: "css",
  });

  // 2. Header with domain-specific navigation
  const navLinks = navigation.length > 0 ? navigation.slice(0, 8) : ["Home", "About", "Contact"];
  const links = navLinks.map((n) => {
    const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<Link href="/${slug}" className="text-sm font-medium hover:opacity-80 transition-opacity">${n}</Link>`;
  }).join("\n          ");

  files.push({
    path: "src/components/Header.tsx",
    content: `"use client";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold" style={{ color: "${tokens.colors.primary}" }}>${projectName}</Link>
        <div className="hidden md:flex gap-6">
          ${links}
        </div>
      </nav>
    </header>
  );
}
`,
    type: "component",
  });

  // 3. Footer
  files.push({
    path: "src/components/Footer.tsx",
    content: `export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} ${projectName}. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
`,
    type: "component",
  });

  return files;
}
