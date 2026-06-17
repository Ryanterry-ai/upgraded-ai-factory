import { getSupabase } from "./supabase";
import { callLLMWithFallback, isLLMAvailable, type LLMMessage } from "./llm-adapter";
import { runAgentWorkflow, type WorkflowResult } from "./agent-executor-adapter";
import { retrieveMemory, formatMemoryContext, recordGeneration, type MemoryContext } from "./memory-adapter";
import { validateBuild, type ValidationResult } from "./build-validator";
import { predictQuality, extractPatterns, recordPatterns, type QualityPrediction } from "./pattern-adapter";
import { getOptimizedBlueprintForFactory, type OptimizedBlueprint } from "./blueprint-optimizer";
import { isUrl, scrapeSite, formatScrapedForLLM, type ScrapedSite } from "./url-scraper";

export interface GenerationRequest {
  prompt: string;
  factory?: string;
  name?: string;
}

export interface GenerationResult {
  projectId: string;
  status: "completed" | "failed" | "partial";
  factory: string;
  files: { path: string; content: string; type: string }[];
  blueprint: unknown;
  qualityScore: number;
  buildSuccess: boolean;
  error?: string;
  errors: string[];
  warnings: string[];
  llmUsed: boolean;
  memoryUsed: boolean;
  patternsExtracted: number;
  agentResults?: WorkflowResult;
  memoryContext?: MemoryContext;
  buildValidation?: ValidationResult;
  qualityPrediction?: QualityPrediction;
  optimizedBlueprint?: OptimizedBlueprint;
}

function sanitizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40) || "my-project";
}

function detectFactory(prompt: string, explicit?: string): string {
  if (explicit && explicit !== "auto") return explicit;
  const lower = prompt.toLowerCase();
  if (/shop|store|product|cart|checkout|ecommerce|e-commerce|buy|purchase|stripe|catalog/i.test(lower)) return "ecommerce";
  if (/analytics|dashboard|chart|metrics|kpi|data.?viz/i.test(lower)) return "dashboard";
  if (/saas|subscription|billing|multi-tenant|tenant/i.test(lower)) return "saas";
  if (/admin|cms|manage|user.?management|backoffice/i.test(lower)) return "admin";
  if (/chat|bot|agent|assistant|automation|ai/i.test(lower)) return "agent";
  if (/tool|converter|calculator|utility|hash|encoder/i.test(lower)) return "tools";
  return "website";
}

function extractProjectName(prompt: string, explicitName?: string): string {
  if (explicitName) return sanitizeName(explicitName);
  const match = prompt.match(/(?:called?|named?|titled?|for)\s+["']?([A-Z][^"']+)["']?/i);
  return sanitizeName(match?.[1] || "my-project");
}

function buildBlueprint(prompt: string, factory: string, projectName: string) {
  const pages: Array<{ path: string; name: string; components: string[] }> = [];
  const components: string[] = [];

  pages.push({ path: "/", name: "Home", components: ["Header", "Hero", "Footer"] });
  components.push("Header", "Hero", "Footer");

  if (/about/i.test(prompt)) {
    pages.push({ path: "/about", name: "About", components: ["Header", "AboutContent", "Footer"] });
    components.push("AboutContent");
  }
  if (/contact|form/i.test(prompt)) {
    pages.push({ path: "/contact", name: "Contact", components: ["Header", "ContactForm", "Footer"] });
    components.push("ContactForm");
  }
  if (/pricing/i.test(prompt)) {
    pages.push({ path: "/pricing", name: "Pricing", components: ["Header", "PricingTable", "Footer"] });
    components.push("PricingTable");
  }
  if (/blog|post/i.test(prompt)) {
    pages.push({ path: "/blog", name: "Blog", components: ["Header", "BlogList", "Footer"] });
    components.push("BlogList");
  }

  if (factory === "ecommerce") {
    pages.push(
      { path: "/products", name: "Products", components: ["Header", "ProductGrid", "Footer"] },
      { path: "/cart", name: "Cart", components: ["Header", "CartItems", "CartSummary", "Footer"] }
    );
    components.push("ProductGrid", "CartItems", "CartSummary");
  }
  if (factory === "dashboard" || factory === "admin") {
    pages.push({ path: "/dashboard", name: "Dashboard", components: ["Sidebar", "DashboardContent"] });
    components.push("Sidebar", "DashboardContent");
  }
  if (factory === "saas") {
    pages.push(
      { path: "/login", name: "Login", components: ["LoginForm"] },
      { path: "/register", name: "Register", components: ["RegisterForm"] },
      { path: "/dashboard", name: "Dashboard", components: ["Sidebar", "DashboardContent"] }
    );
    components.push("LoginForm", "RegisterForm", "Sidebar", "DashboardContent");
  }

  if (/feature/i.test(prompt)) components.push("Features");
  if (/testimonial|review/i.test(prompt)) components.push("Testimonials");
  if (/cta|call.?to.?action/i.test(prompt)) components.push("CTA");
  if (/newsletter|subscribe/i.test(prompt)) components.push("Newsletter");

  return {
    project: { name: projectName, description: prompt.slice(0, 200), framework: "nextjs", styling: "tailwind", language: "typescript" },
    pages,
    components: [...new Set(components)],
    factory,
    generatedAt: new Date().toISOString(),
  };
}

function genHeader(name: string, navigation?: string[], colors?: LLMContent["colors"]): string {
  const navLinks = (navigation && navigation.length > 0)
    ? navigation.slice(0, 6)
    : ["Home", "About", "Contact"];
  const links = navLinks.map((n) => {
    const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<Link href="/${slug}" className="text-sm font-medium hover:opacity-80 transition-opacity">${n}</Link>`;
  }).join("\n          ");
  const accent = colors?.primary || "#2563eb";
  return `"use client";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold" style={{ color: "${accent}" }}>${name}</Link>
        <div className="hidden md:flex gap-6">
          ${links}
        </div>
      </nav>
    </header>
  );
}
`;
}

function genFooter(): string {
  return `export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;
}

function genHero(prompt: string): string {
  const isUrlPrompt = /^https?:\/\//i.test(prompt.trim()) || /^www\./i.test(prompt.trim());
  const title = isUrlPrompt
    ? "Welcome"
    : prompt.match(/(?:about|for|called?|named?)\s+["']?([^"'.]+)["']?/i)?.[1]?.trim() || "Welcome";
  const subtitle = isUrlPrompt
    ? "Loading content from source website..."
    : prompt.slice(0, 150);
  return `export function Hero() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          ${title}
        </h1>
        <p className="mt-6 text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
          ${subtitle}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
`;
}

function genFeatures(): string {
  return `export function Features() {
  const features = [
    { title: "Lightning Fast", description: "Optimized for speed and performance." },
    { title: "Secure", description: "Enterprise-grade security built in." },
    { title: "Easy to Use", description: "Intuitive interface for everyone." },
  ];
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genAbout(): string {
  return `export function AboutContent() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        <p className="text-lg text-gray-600 mb-4">
          We are a team dedicated to building amazing products that help people succeed.
        </p>
        <p className="text-lg text-gray-600">
          Our mission is to provide the best tools and experiences for our users.
        </p>
      </div>
    </section>
  );
}
`;
}

function genContactForm(): string {
  return `"use client";
import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return <div className="rounded-lg border bg-green-50 p-6 text-green-800">Thank you! We will get back to you soon.</div>;
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input type="text" required className="w-full border rounded-lg px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" required className="w-full border rounded-lg px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea rows={4} required className="w-full border rounded-lg px-4 py-2" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Send Message</button>
    </form>
  );
}
`;
}

function genPricingTable(): string {
  return `export function PricingTable() {
  const plans = [
    { name: "Free", price: "$0", features: ["1 project", "Basic support"] },
    { name: "Pro", price: "$29/mo", features: ["Unlimited projects", "Priority support", "Advanced analytics"] },
    { name: "Enterprise", price: "Custom", features: ["Custom solutions", "Dedicated support", "SLA"] },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-lg border p-6 text-center">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-3xl font-bold my-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => <li key={f} className="text-sm text-gray-600">{f}</li>)}
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Choose Plan</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genBlogList(): string {
  return `export function BlogList() {
  const posts = [
    { id: "1", title: "Getting Started", excerpt: "Learn how to get started with our platform." },
    { id: "2", title: "Best Practices", excerpt: "Tips and tricks for maximum productivity." },
    { id: "3", title: "Advanced Guide", excerpt: "Deep dive into advanced features." },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{post.excerpt}</p>
              <a href="#" className="mt-4 inline-block text-blue-600 text-sm font-medium">Read more</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genTestimonials(): string {
  return `export function Testimonials() {
  const items = [
    { name: "Alice", role: "CEO", quote: "This product changed our business." },
    { name: "Bob", role: "Developer", quote: "Best tool I have ever used." },
  ];
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {items.map((item) => (
            <div key={item.name} className="rounded-lg border bg-white p-6">
              <p className="text-gray-600 italic mb-4">&quot;{item.quote}&quot;</p>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genCTA(): string {
  return `export function CTA() {
  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of users who are already building amazing things.</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
          Start Free Trial
        </button>
      </div>
    </section>
  );
}
`;
}

function genProductGrid(): string {
  return `export function ProductGrid() {
  const products = [
    { id: "1", name: "Product A", price: 29.99 },
    { id: "2", name: "Product B", price: 49.99 },
    { id: "3", name: "Product C", price: 19.99 },
    { id: "4", name: "Product D", price: 39.99 },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((p) => (
        <div key={p.id} className="group rounded-lg border overflow-hidden">
          <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400">Image</div>
          <div className="p-4">
            <h3 className="font-medium">{p.name}</h3>
            <p className="text-lg font-bold mt-1">\${p.price}</p>
            <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">Add to Cart</button>
          </div>
        </div>
      ))}
    </div>
  );
}
`;
}

function genCartItems(): string {
  return `"use client";
export function CartItems() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div><h3 className="font-medium">Sample Item</h3><p className="text-sm text-gray-500">Qty: 1</p></div>
        <p className="font-semibold">$29.99</p>
      </div>
    </div>
  );
}
`;
}

function genCartSummary(): string {
  return `export function CartSummary() {
  return (
    <div className="rounded-lg bg-gray-50 p-6">
      <h2 className="text-lg font-semibold">Order Summary</h2>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between"><span>Subtotal</span><span>$29.99</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
        <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>$29.99</span></div>
      </div>
      <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Checkout</button>
    </div>
  );
}
`;
}

function genSidebar(): string {
  return `"use client";
import Link from "next/link";

export function Sidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ];
  return (
    <aside className="w-64 border-r min-h-screen p-4">
      <nav className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-sm">{item.label}</Link>
        ))}
      </nav>
    </aside>
  );
}
`;
}

function genDashboardContent(): string {
  return `export function DashboardContent() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg"><p className="text-sm text-gray-500">Users</p><p className="text-2xl font-bold">1,234</p></div>
        <div className="p-4 border rounded-lg"><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold">$12,345</p></div>
        <div className="p-4 border rounded-lg"><p className="text-sm text-gray-500">Growth</p><p className="text-2xl font-bold">+23%</p></div>
      </div>
    </div>
  );
}
`;
}

function genLoginForm(): string {
  return `"use client";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-md space-y-4 p-8 rounded-lg border" onSubmit={(e) => e.preventDefault()}>
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Sign In</button>
      </form>
    </div>
  );
}
`;
}

function genRegisterForm(): string {
  return `"use client";
import { useState } from "react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-md space-y-4 p-8 rounded-lg border" onSubmit={(e) => e.preventDefault()}>
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
        <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create Account</button>
      </form>
    </div>
  );
}
`;
}

function genNewsletter(): string {
  return `"use client";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <div className="text-center py-8"><p className="text-green-600 font-medium">Thanks for subscribing!</p></div>;
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="flex gap-2 max-w-md mx-auto">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 border rounded-lg px-4 py-2" required />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
`;
}

function genStyles(colors?: LLMContent["colors"]): string {
  const bg = colors?.background || "#ffffff";
  const text = colors?.text || "#111827";
  const primary = colors?.primary || "#2563eb";
  const secondary = colors?.secondary || "#1e40af";
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: ${bg};
  --foreground: ${text};
  --primary: ${primary};
  --secondary: ${secondary};
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #030712;
    --foreground: #f9fafb;
    --primary: ${primary};
    --secondary: ${secondary};
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
}

img {
  max-width: 100%;
  height: auto;
}
`;
}

function genLayout(name: string): string {
  return `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${name}',
  description: '${name} application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`;
}

function genConfig(name: string): { filename: string; content: string } {
  return {
    filename: "next.config.mjs",
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
};
export default nextConfig;
`,
  };
}

function genPackageJson(name: string): string {
  const safeName = sanitizeName(name);
  return JSON.stringify({
    name: safeName, version: "0.1.0", private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
    dependencies: { next: "^14.2.0", react: "^18.3.0", "react-dom": "^18.3.0" },
    devDependencies: {
      "@types/node": "^20.14.0", "@types/react": "^18.3.0", "@types/react-dom": "^18.3.0",
      autoprefixer: "^10.4.0", postcss: "^8.4.0", tailwindcss: "^3.4.0", typescript: "^5.5.0",
    },
  }, null, 2);
}

function genTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "es5", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true,
      strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler",
      resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true,
      plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2);
}

function genTailwindConfig(): { filename: string; content: string } {
  return {
    filename: "tailwind.config.mjs",
    content: `/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
`,
  };
}

function genPostcssConfig(): { filename: string; content: string } {
  return {
    filename: "postcss.config.mjs",
    content: `const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };
export default config;
`,
  };
}

// ── LLM-Enhanced Content Generation ──────────────────────

interface LLMContent {
  heroTitle: string;
  heroSubtitle: string;
  features: Array<{ title: string; description: string }>;
  aboutText: string;
  ctaText: string;
  navigation: string[];
  sections: Array<{ title: string; content: string }>;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
}

async function generateLLMContent(
  prompt: string,
  factory: string,
  memoryContext?: MemoryContext,
  scraped?: ScrapedSite
): Promise<LLMContent | null> {
  if (!isLLMAvailable()) return null;

  let memorySection = "";
  if (memoryContext) {
    memorySection = "\n\n" + formatMemoryContext(memoryContext);
  }

  let scrapedSection = "";
  if (scraped) {
    scrapedSection = "\n\n" + formatScrapedForLLM(scraped);
  }

  const isUrlPrompt = !!scraped;

  const systemPrompt = isUrlPrompt
    ? `You are a website cloning expert. You are given the scraped content of a target website. Generate accurate, faithful content that matches the original site as closely as possible.
Return ONLY valid JSON with this exact structure:
{
  "heroTitle": "string - the actual main heading from the site",
  "heroSubtitle": "string - the actual subheading/description from the site",
  "features": [{"title": "string", "description": "string"}] - actual features/sections from the site, up to 6,
  "aboutText": "string - actual about/description text from the site",
  "ctaText": "string - actual CTA button text from the site",
  "navigation": ["string"] - actual nav links from the site,
  "sections": [{"title": "string", "content": "string"}] - actual content sections from the site,
  "colors": {"primary": "hex color", "secondary": "hex color", "accent": "hex color", "background": "hex color", "text": "hex color"}
}
Use the ACTUAL content from the scraped site. Do not invent content. If a section is not present in the scrape, omit it.
No markdown. No explanation. Only JSON.`
    : `You are a web content generator. Given a project description, generate real, specific content for a website.
Return ONLY valid JSON with this exact structure:
{
  "heroTitle": "string - compelling headline (max 60 chars)",
  "heroSubtitle": "string - supporting text (max 150 chars)",
  "features": [{"title": "string", "description": "string"}] - exactly 3 features,
  "aboutText": "string - 2-3 sentences about the project",
  "ctaText": "string - call to action button text",
  "navigation": ["Home", "About", "Contact"],
  "sections": [],
  "colors": {"primary": "#2563eb", "secondary": "#1e40af", "accent": "#3b82f6", "background": "#ffffff", "text": "#111827"}
}
No markdown. No explanation. Only JSON.`;

  const userContent = isUrlPrompt
    ? `Target website to clone: ${scraped!.baseUrl}\nUser instruction: ${prompt.slice(0, 500)}${scrapedSection}${memorySection}`
    : `Project type: ${factory}\nDescription: ${prompt.slice(0, 500)}${memorySection}`;

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const { content, usedFallback } = await callLLMWithFallback(messages, {
    model: "gpt-4o-mini",
    temperature: isUrlPrompt ? 0.3 : 0.7,
    maxTokens: isUrlPrompt ? 1500 : 500,
  });

  if (usedFallback || !content) return null;

  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      heroTitle: typeof parsed.heroTitle === "string" ? parsed.heroTitle : "Welcome",
      heroSubtitle: typeof parsed.heroSubtitle === "string" ? parsed.heroSubtitle : prompt.slice(0, 150),
      features: Array.isArray(parsed.features)
        ? parsed.features.slice(0, 6).map((f: Record<string, string>) => ({
            title: f.title || "Feature",
            description: f.description || "Description",
          }))
        : [],
      aboutText: typeof parsed.aboutText === "string" ? parsed.aboutText : "",
      ctaText: typeof parsed.ctaText === "string" ? parsed.ctaText : "Get Started",
      navigation: Array.isArray(parsed.navigation) ? parsed.navigation.slice(0, 8) : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections.slice(0, 6) : [],
      colors: parsed.colors && typeof parsed.colors === "object" ? {
        primary: parsed.colors.primary || "#2563eb",
        secondary: parsed.colors.secondary || "#1e40af",
        accent: parsed.colors.accent || "#3b82f6",
        background: parsed.colors.background || "#ffffff",
        text: parsed.colors.text || "#111827",
      } : { primary: "#2563eb", secondary: "#1e40af", accent: "#3b82f6", background: "#ffffff", text: "#111827" },
    };
  } catch {
    return null;
  }
}

function genHeroLLM(title: string, subtitle: string, ctaText?: string, colors?: LLMContent["colors"]): string {
  const bg = colors?.background || "#ffffff";
  const textColor = colors?.text || "#111827";
  const accent = colors?.primary || "#2563eb";
  return `export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "${bg}" }}>
      <div className="container mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: "${textColor}" }}>
          ${title}
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto opacity-80" style={{ color: "${textColor}" }}>
          ${subtitle}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg px-8 py-3 text-white font-medium transition-colors hover:opacity-90" style={{ background: "${accent}" }}>
            ${ctaText || "Get Started"}
          </button>
          <button className="rounded-lg border px-8 py-3 font-medium transition-colors hover:opacity-80" style={{ borderColor: "${accent}", color: "${accent}" }}>
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
`;
}

function genFeaturesLLM(features: Array<{ title: string; description: string }>, colors?: LLMContent["colors"]): string {
  const featuresJS = JSON.stringify(features);
  const accent = colors?.primary || "#2563eb";
  return `export function Features() {
  const features = ${featuresJS};
  return (
    <section className="py-16" style={{ background: "rgba(0,0,0,0.02)" }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold" style={{ color: "${accent}" }}>{f.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genAboutLLM(text: string): string {
  return `export function AboutContent() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        <p className="text-lg text-gray-600 mb-4">
          ${text || "We are a team dedicated to building amazing products that help people succeed."}
        </p>
        <p className="text-lg text-gray-600">
          Our mission is to provide the best tools and experiences for our users.
        </p>
      </div>
    </section>
  );
}
`;
}

function genCTALLM(text: string): string {
  return `export function CTA() {
  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of users who are already building amazing things.</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
          ${text || "Start Free Trial"}
        </button>
      </div>
    </section>
  );
}
`;
}

// ── Multi-Page Generation from Scraped Data ────────────────

function generatePageFromScraped(
  page: import("./url-scraper").ScrapedPage,
  componentName: string,
  llmContent?: LLMContent | null
): string {
  const imports = [`import { Header } from "@/components/Header";`, `import { Footer } from "@/components/Footer";`];
  imports.push(`import { ${componentName} } from "@/components/${componentName}";`);

  return `${imports.join("\n")}

export default function ${page.title.replace(/[^a-zA-Z0-9]/g, "")}Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <${componentName} />
      <Footer />
    </main>
  );
}
`;
}

function generateSectionComponent(
  section: { tag: string; text: string; className?: string; html?: string },
  colors?: LLMContent["colors"]
): string {
  const accent = colors?.primary || "#2563eb";
  // Extract meaningful text from the section
  const lines = section.text.split(/\s+/).filter(w => w.length > 0);
  const title = lines.slice(0, 5).join(" ");
  const body = lines.slice(5).join(" ");

  return `export function ContentSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "${accent}" }}>
          ${title.replace(/"/g, '\\"')}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          ${body.slice(0, 500).replace(/"/g, '\\"')}
        </p>
      </div>
    </section>
  );
}
`;
}

const COMPONENT_GENERATORS: Record<string, (prompt?: string) => string> = {
  Header: () => genHeader("Project"),
  Footer: genFooter,
  Hero: (p) => genHero(p || "Welcome"),
  Features: genFeatures,
  AboutContent: genAbout,
  ContactForm: genContactForm,
  PricingTable: genPricingTable,
  BlogList: genBlogList,
  Testimonials: genTestimonials,
  CTA: genCTA,
  Newsletter: genNewsletter,
  ProductGrid: genProductGrid,
  CartItems: genCartItems,
  CartSummary: genCartSummary,
  Sidebar: genSidebar,
  DashboardContent: genDashboardContent,
  LoginForm: genLoginForm,
  RegisterForm: genRegisterForm,
};

async function generateFiles(
  prompt: string,
  factory: string,
  projectName: string,
  llmContent: LLMContent | null,
  scraped?: ScrapedSite
): Promise<{ path: string; content: string; type: string }[]> {
  const files: { path: string; content: string; type: string }[] = [];

  const tailwind = genTailwindConfig();
  const postcss = genPostcssConfig();
  const nextConfig = genConfig(projectName);

  files.push({ path: "package.json", content: genPackageJson(projectName), type: "config" });
  files.push({ path: "tsconfig.json", content: genTsConfig(), type: "config" });
  files.push({ path: tailwind.filename, content: tailwind.content, type: "config" });
  files.push({ path: postcss.filename, content: postcss.content, type: "config" });
  files.push({ path: nextConfig.filename, content: nextConfig.content, type: "config" });
  files.push({ path: "src/app/layout.tsx", content: genLayout(projectName), type: "page" });
  files.push({ path: "src/app/globals.css", content: genStyles(llmContent?.colors), type: "style" });

  const usedComponents = new Set<string>();

  // If we have scraped multi-page data, generate a page for each route
  if (scraped && scraped.pages.length > 0) {
    const navItems = llmContent?.navigation && llmContent.navigation.length > 0
      ? llmContent.navigation
      : scraped.navigation.length > 0
        ? scraped.navigation
        : scraped.pages.map(p => p.title).slice(0, 6);

    for (const page of scraped.pages) {
      const routePath = page.path === "/" ? "src/app/page.tsx" : `src/app${page.path}/page.tsx`;
      const componentName = page.path === "/"
        ? "HomeContent"
        : page.path.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("") + "Content";

      // Generate page content from scraped data
      const pageContent = generatePageFromScraped(page, componentName, llmContent);
      files.push({ path: routePath, content: pageContent, type: "page" });
      usedComponents.add(componentName);
    }

    // Generate Header with actual nav from scraped site
    const headerContent = genHeader(projectName, navItems, llmContent?.colors);
    files.push({ path: "src/components/Header.tsx", content: headerContent, type: "component" });
    usedComponents.add("Header");

    // Generate Footer
    files.push({ path: "src/components/Footer.tsx", content: genFooter(), type: "component" });
    usedComponents.add("Footer");

    // Generate page-specific components from scraped sections
    for (const page of scraped.pages) {
      for (const section of page.sections.slice(0, 4)) {
        const compName = `${page.path === "/" ? "Home" : page.path.split("/").filter(Boolean).join("")}${section.tag.charAt(0).toUpperCase() + section.tag.slice(1)}`;
        if (!usedComponents.has(compName) && section.text.length > 30) {
          const compContent = generateSectionComponent(section, llmContent?.colors);
          files.push({ path: `src/components/${compName}.tsx`, content: compContent, type: "component" });
          usedComponents.add(compName);
        }
      }
    }
  } else {
    // Standard generation without scraped data
    const blueprint = buildBlueprint(prompt, factory, projectName);
    const pages = blueprint.pages;

    for (const page of pages) {
      const pagePath = page.path === "/" ? "src/app/page.tsx" : `src/app${page.path}/page.tsx`;
      const imports = page.components.map((c) => `import { ${c} } from "@/components/${c}";`).join("\n");
      const usage = page.components.map((c) => `      <${c} />`).join("\n");
      const pageContent = `${imports}\n\nexport default function ${page.name}Page() {\n  return (\n    <main className="min-h-screen">\n${usage}\n    </main>\n  );\n}\n`;
      files.push({ path: pagePath, content: pageContent, type: "page" });
      for (const comp of page.components) usedComponents.add(comp);
    }

    const navItems = llmContent?.navigation && llmContent.navigation.length > 0 ? llmContent.navigation : undefined;

    for (const compName of usedComponents) {
      const gen = COMPONENT_GENERATORS[compName];
      if (gen) {
        let content = gen(prompt);
        if (llmContent) {
          if (compName === "Hero") content = genHeroLLM(llmContent.heroTitle, llmContent.heroSubtitle, llmContent.ctaText, llmContent.colors);
          else if (compName === "Features" && llmContent.features.length > 0) content = genFeaturesLLM(llmContent.features, llmContent.colors);
          else if (compName === "AboutContent" && llmContent.aboutText) content = genAboutLLM(llmContent.aboutText);
          else if (compName === "CTA" && llmContent.ctaText) content = genCTALLM(llmContent.ctaText);
          else if (compName === "Header") content = genHeader(projectName, navItems, llmContent.colors);
        }
        files.push({ path: `src/components/${compName}.tsx`, content, type: "component" });
      } else {
        files.push({ path: `src/components/${compName}.tsx`, content: `export function ${compName}() {\n  return <section className="py-12"><div className="container mx-auto px-4"><h2 className="text-2xl font-bold">${compName}</h2></div></section>;\n}\n`, type: "component" });
      }
    }

    const headerFile = files.find((f) => f.path === "src/components/Header.tsx");
    if (headerFile && llmContent) headerFile.content = genHeader(projectName, navItems, llmContent.colors);
  }

  return files;
}

function calculateQualityScore(files: { path: string; content: string; type: string }[]): number {
  let score = 0;
  if (files.length >= 10) score += 0.25;
  else if (files.length >= 5) score += 0.15;
  else if (files.length >= 3) score += 0.1;

  if (files.some((f) => f.path.includes("page.tsx"))) score += 0.15;
  if (files.some((f) => f.path.includes("layout.tsx"))) score += 0.1;
  if (files.some((f) => f.path.includes("globals.css"))) score += 0.1;
  if (files.some((f) => f.path.includes("package.json"))) score += 0.1;
  if (files.some((f) => f.path.includes("tsconfig.json"))) score += 0.05;
  if (files.some((f) => f.path.includes("tailwind.config"))) score += 0.05;
  if (files.some((f) => f.path.includes("components/"))) score += 0.1;
  if (files.some((f) => f.type === "page" && f.path.split("/").length > 3)) score += 0.1;

  return Math.min(1, score);
}

async function createZip(files: { path: string; content: string }[]): Promise<Buffer> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return (await zip.generateAsync({ type: "nodebuffer" })) as Buffer;
}

export async function runGeneration(request: GenerationRequest): Promise<GenerationResult> {
  const supabase = getSupabase();
  const factory = detectFactory(request.prompt, request.factory);
  const projectName = extractProjectName(request.prompt, request.name);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Detect and scrape URL if present
  let scraped: ScrapedSite | undefined;
  // Extract URL from prompt (handles "clone url: https://...", "https://...", etc.)
  const urlMatch = request.prompt.trim().match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    const detectedUrl = urlMatch[1];
    try {
      scraped = await scrapeSite(detectedUrl, 10);
      warnings.push(`Crawled ${scraped.pages.length} pages from ${scraped.baseUrl}: Tech: ${scraped.techStack.join(", ") || "unknown"}`);
    } catch (err) {
      warnings.push(`URL scraping failed: ${err instanceof Error ? err.message : "unknown"}. Generating from prompt only.`);
    }
  }

  const { data: project, error: createError } = await supabase
    .from("projects")
    .insert({
      name: projectName,
      factory,
      prompt: request.prompt,
      quality_score: 0,
      build_success: false,
      file_count: 0,
    })
    .select("id")
    .single();

  if (createError) throw new Error(`Failed to create project: ${createError.message}`);
  const projectId = project.id;

  try {
    const [llmContent, agentResults, memoryContext, qualityPrediction] = await Promise.all([
      generateLLMContent(request.prompt, factory, undefined, scraped),
      runAgentWorkflow(request.prompt, factory, projectName),
      retrieveMemory(request.prompt, factory),
      predictQuality(request.prompt, factory),
    ]);
    const files = await generateFiles(request.prompt, factory, projectName, llmContent, scraped);
    const blueprint = buildBlueprint(request.prompt, factory, projectName);
    const qualityScore = calculateQualityScore(files);
    const buildValidation = validateBuild(files);

    // Optimize blueprint based on feedback
    const optimizedBlueprint = await getOptimizedBlueprintForFactory(factory, {
      pages: blueprint.pages,
      components: blueprint.components,
    }).catch(() => ({ pages: blueprint.pages, components: blueprint.components, optimizations: [] }));

    const { error: bpError } = await supabase.from("blueprints").insert({
      project_id: projectId,
      json: blueprint,
    });
    if (bpError) {
      const msg = `Blueprint insert failed: ${bpError.message}`;
      errors.push(msg);
      console.error(msg);
    }

    const { error: genError } = await supabase.from("generations").insert({
      factory,
      prompt: request.prompt,
      result: { files: files.map((f) => ({ path: f.path, type: f.type })) },
      build_success: false,
      file_count: files.length,
    });
    if (genError) {
      const msg = `Generation record insert failed: ${genError.message}`;
      errors.push(msg);
      console.error(msg);
    }

    const zipBuffer = await createZip(files);
    const { error: storageError } = await supabase.storage
      .from("generated-projects")
      .upload(`${projectId}/project.zip`, zipBuffer, {
        contentType: "application/zip",
        upsert: true,
      });
    if (storageError) {
      const msg = `ZIP upload failed: ${storageError.message}`;
      errors.push(msg);
      console.error(msg);
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        quality_score: qualityScore,
        build_success: buildValidation.buildSuccess,
        file_count: files.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    if (updateError) {
      const msg = `Project update failed: ${updateError.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Add validation warnings
    const failedChecks = buildValidation.checks.filter((c) => !c.passed);
    for (const check of failedChecks) {
      if (check.severity === "warning") {
        warnings.push(check.message);
      } else {
        errors.push(check.message);
      }
    }

    const status = errors.length > 0 ? "partial" : "completed";

    // Record generation for future memory retrieval
    await recordGeneration({
      projectId,
      factory,
      prompt: request.prompt,
      fileCount: files.length,
      qualityScore,
      buildSuccess: buildValidation.buildSuccess,
      llmUsed: llmContent !== null,
      agentCount: agentResults.successCount,
      durationMs: agentResults.totalDuration,
    }).catch((err) => {
      warnings.push(`Failed to record generation: ${err.message}`);
    });

    // Extract and record patterns
    const extractedPatterns = extractPatterns(
      files,
      factory,
      buildValidation.buildSuccess,
      qualityScore
    );
    const patternsRecorded = await recordPatterns(extractedPatterns).catch(
      () => 0
    );

    return {
      projectId,
      status,
      factory,
      files,
      blueprint,
      qualityScore,
      buildSuccess: buildValidation.buildSuccess,
      errors,
      warnings,
      llmUsed: llmContent !== null,
      memoryUsed: memoryContext.recentProjects.length > 0,
      patternsExtracted: patternsRecorded,
      agentResults,
      memoryContext,
      buildValidation,
      qualityPrediction,
      optimizedBlueprint,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    errors.push(message);
    await supabase.from("projects").update({ quality_score: 0, build_success: false }).eq("id", projectId);
    return {
      projectId,
      status: "failed",
      factory,
      files: [],
      blueprint: null,
      qualityScore: 0,
      buildSuccess: false,
      error: message,
      errors,
      warnings,
      llmUsed: false,
      memoryUsed: false,
      patternsExtracted: 0,
    };
  }
}
