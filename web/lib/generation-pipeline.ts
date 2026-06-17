import { getSupabase } from "./supabase";
import { callLLMWithFallback, isLLMAvailable, type LLMMessage } from "./llm-adapter";
import { runAgentWorkflow, type WorkflowResult } from "./agent-executor-adapter";
import { retrieveMemory, formatMemoryContext, recordGeneration, type MemoryContext } from "./memory-adapter";
import { validateBuild, type ValidationResult } from "./build-validator";
import { predictQuality, extractPatterns, recordPatterns, type QualityPrediction } from "./pattern-adapter";
import { getOptimizedBlueprintForFactory, type OptimizedBlueprint } from "./blueprint-optimizer";
import { isUrl, scrapeSite, formatScrapedForLLM, type ScrapedSite } from "./url-scraper";
import { storeSite } from "./clone-store";
import { generatePreviewHtml } from "./preview-renderer";
import { detectBlueprint, type DomainBlueprint } from "./domain-blueprints";
import { calculateComponentDepthScore } from "./component-depth-validator";
import {
  analyzeRequirements,
  planArchitecture,
  validateRequirements,
  calculateQualityScores,
  type RequirementMatrix,
  type ArchitecturePlan,
  type QualityScores,
} from "./architecture-engine";

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
  scraped?: ScrapedSite;
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
  // Try explicit patterns first
  const explicitMatch = prompt.match(/(?:called?|named?|titled?|for)\s+["']?([A-Z][^"'.]+)["']?/i);
  if (explicitMatch) return sanitizeName(explicitMatch[1]);
  // Try to extract a brand-like name (capitalized words before "website"/"app"/"platform"/"system")
  const brandMatch = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:website|app|platform|system|site|store|shop)/i);
  if (brandMatch) return sanitizeName(brandMatch[1]);
  // Try "a X agency/business/company" pattern
  const typeMatch = prompt.match(/(?:a|an|the)\s+(?:modern\s+|professional\s+|creative\s+)?(\w+(?:\s+\w+)?)\s+(?:website|app|platform|agency|business|company|store|shop|system|project)/i);
  if (typeMatch) return sanitizeName(typeMatch[1]);
  return "my-project";
}

function buildBlueprint(prompt: string, factory: string, projectName: string, requirements?: RequirementMatrix) {
  const pages: Array<{ path: string; name: string; components: string[] }> = [];
  const components: string[] = [];

  // Use extracted requirements if available
  if (requirements) {
    // Build pages from requirements
    for (const page of requirements.pages) {
      const route = page.route === "/" ? "" : page.route;
      const pageComponents: string[] = ["Header"];

      // Add page-specific components
      if (page.name === "Home") {
        pageComponents.push("Hero");
        if (requirements.components.some(c => c.name === "Testimonials")) pageComponents.push("Testimonials");
        if (requirements.components.some(c => c.name === "Services")) pageComponents.push("Services");
        if (requirements.components.some(c => c.name === "Features")) pageComponents.push("Features");
        if (requirements.components.some(c => c.name === "CTA")) pageComponents.push("CTA");
        if (requirements.components.some(c => c.name === "Stats")) pageComponents.push("Stats");
      } else if (page.name === "Services") {
        pageComponents.push("Services");
      } else if (page.name === "About") {
        pageComponents.push("AboutContent");
        if (requirements.components.some(c => c.name === "Team")) pageComponents.push("Team");
      } else if (page.name === "Contact Page") {
        pageComponents.push("ContactForm");
      } else if (page.name === "Blog Page") {
        pageComponents.push("BlogList");
      } else if (page.name === "Testimonials Page") {
        pageComponents.push("Testimonials");
      } else if (page.name === "Pricing Page") {
        pageComponents.push("PricingTable");
      } else if (page.name === "Portfolio Page") {
        pageComponents.push("Portfolio");
      } else if (page.name === "FAQ Page") {
        pageComponents.push("FAQ");
      } else if (page.name === "Team Page") {
        pageComponents.push("Team");
      }

      pageComponents.push("Footer");
      pages.push({ path: route || "/", name: page.name.replace(" Page", ""), components: pageComponents });
      components.push(...pageComponents);
    }

    // Add components from requirements that aren't page-specific
    for (const comp of requirements.components) {
      if (!components.includes(comp.name)) {
        components.push(comp.name);
      }
    }
  } else {
    // Fallback to regex-based detection
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
    if (/services?/i.test(prompt)) {
      pages.push({ path: "/services", name: "Services", components: ["Header", "Services", "Footer"] });
      components.push("Services");
    }
    if (/pricing/i.test(prompt)) {
      pages.push({ path: "/pricing", name: "Pricing", components: ["Header", "PricingTable", "Footer"] });
      components.push("PricingTable");
    }
    if (/blog|post/i.test(prompt)) {
      pages.push({ path: "/blog", name: "Blog", components: ["Header", "BlogList", "Footer"] });
      components.push("BlogList");
    }
    if (/testimonial|review/i.test(prompt)) components.push("Testimonials");
    if (/feature/i.test(prompt)) components.push("Features");
    if (/cta|call.?to.?action/i.test(prompt)) components.push("CTA");
    if (/newsletter|subscribe/i.test(prompt)) components.push("Newsletter");
    if (/team/i.test(prompt)) components.push("Team");
  }

  // Factory-specific pages
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

function getHeroContent(prompt: string): { title: string; subtitle: string; cta: string } {
  const ctx = extractProjectContext(prompt);
  const isUrlPrompt = /^https?:\/\//i.test(prompt.trim()) || /^www\./i.test(prompt.trim());
  if (isUrlPrompt) return { title: "Welcome", subtitle: "Loading content from source website...", cta: "Get Started" };
  const map: Record<string, { title: string; subtitle: string; cta: string }> = {
    "health & fitness": { title: "Transform Your Body, Transform Your Life", subtitle: "Personalized fitness programs and expert coaching to help you achieve your health goals.", cta: "Start Your Journey" },
    "digital marketing": { title: "Grow Your Business With Data-Driven Marketing", subtitle: "We craft strategies that deliver measurable results and accelerate your online growth.", cta: "Get a Free Audit" },
    "technology": { title: "Innovation That Drives Results", subtitle: "Cutting-edge solutions built for scalability, performance, and the modern web.", cta: "See Our Work" },
    "ecommerce": { title: "Sell More, Scale Faster", subtitle: "Beautiful storefronts, seamless checkout, and tools to grow your online sales.", cta: "Shop Now" },
  };
  if (ctx.industry && map[ctx.industry]) return map[ctx.industry];
  const nameMatch = prompt.match(/(?:for|called|named)\s+(?:a\s+)?(?:the\s+)?["']?([^"'.]+?)["']?\s*(?:\.|,|$)/i);
  const name = nameMatch?.[1]?.trim() || "Your Project";
  return { title: `Welcome to ${name}`, subtitle: "A modern solution built with care and precision.", cta: "Learn More" };
}

function genHero(prompt: string): string {
  const h = getHeroContent(prompt);
  return `export function Hero() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          ${h.title}
        </h1>
        <p className="mt-6 text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
          ${h.subtitle}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors">
            ${h.cta}
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

function getProjectFeatures(prompt: string): Array<{ title: string; description: string; icon: string }> {
  const ctx = extractProjectContext(prompt);
  const featureMap: Record<string, Array<{ title: string; description: string; icon: string }>> = {
    "health & fitness": [
      { title: "Personalized Plans", description: "Custom workout and nutrition plans tailored to your goals.", icon: "target" },
      { title: "Expert Coaching", description: "Certified trainers guide you every step of the way.", icon: "users" },
      { title: "Progress Tracking", description: "Track your workouts, measurements, and milestones.", icon: "chart" },
    ],
    "digital marketing": [
      { title: "SEO Optimization", description: "Rank higher on Google with our proven strategies.", icon: "search" },
      { title: "Social Media Growth", description: "Engage your audience and grow across platforms.", icon: "trending" },
      { title: "Analytics Dashboard", description: "Real-time insights into campaign performance.", icon: "chart" },
    ],
    "technology": [
      { title: "Cloud Architecture", description: "Scalable infrastructure built for performance.", icon: "cloud" },
      { title: "API Integration", description: "Seamless connections with your existing tools.", icon: "code" },
      { title: "Real-time Analytics", description: "Monitor and optimize with live dashboards.", icon: "chart" },
    ],
    "ecommerce": [
      { title: "Beautiful Storefronts", description: "Eye-catching designs that convert browsers into buyers.", icon: "shopping" },
      { title: "Secure Checkout", description: "PCI-compliant payment processing your customers trust.", icon: "lock" },
      { title: "Inventory Management", description: "Track stock levels, orders, and fulfillment in real time.", icon: "box" },
    ],
  };
  return featureMap[ctx.industry || ""] || [
    { title: "Modern Design", description: "Clean, professional interface built with latest standards.", icon: "palette" },
    { title: "Fast Performance", description: "Optimized for speed and efficiency.", icon: "zap" },
    { title: "Secure & Reliable", description: "Enterprise-grade security and uptime.", icon: "shield" },
  ];
}

function genFeatures(prompt?: string): string {
  const features = getProjectFeatures(prompt || "Welcome");
  return `export function Features() {
  const features = [
    { title: "${features[0].title}", description: "${features[0].description}" },
    { title: "${features[1].title}", description: "${features[1].description}" },
    { title: "${features[2].title}", description: "${features[2].description}" },
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

function genServices(): string {
  return `export function Services() {
  const services = [
    { title: "Web Development", description: "Custom websites built with modern technologies for optimal performance." },
    { title: "Mobile Apps", description: "Native and cross-platform mobile applications for iOS and Android." },
    { title: "UI/UX Design", description: "User-centered design that creates engaging and intuitive experiences." },
    { title: "Cloud Solutions", description: "Scalable cloud infrastructure and deployment solutions." },
    { title: "Digital Marketing", description: "Data-driven marketing strategies to grow your business." },
    { title: "Consulting", description: "Expert technical consulting to guide your digital transformation." },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.title} className="p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genTeam(): string {
  return `export function Team() {
  const members = [
    { name: "Sarah Johnson", role: "CEO & Founder", bio: "Visionary leader with 15+ years in tech." },
    { name: "Michael Chen", role: "CTO", bio: "Full-stack architect passionate about scalable systems." },
    { name: "Emily Davis", role: "Design Director", bio: "Award-winning designer focused on user experience." },
    { name: "James Wilson", role: "Lead Engineer", bio: "Expert in React, Node.js, and cloud architecture." },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map((member) => (
            <div key={member.name} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                {member.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-sm text-blue-600 mb-2">{member.role}</p>
              <p className="text-sm text-gray-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genStats(): string {
  return `export function Stats() {
  const stats = [
    { label: "Projects Completed", value: "250+" },
    { label: "Happy Clients", value: "120+" },
    { label: "Team Members", value: "40+" },
    { label: "Years Experience", value: "10+" },
  ];
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genFAQ(): string {
  return `export function FAQ() {
  const faqs = [
    { q: "What services do you offer?", a: "We offer web development, mobile apps, UI/UX design, and cloud solutions." },
    { q: "How long does a project take?", a: "Project timelines vary based on scope, typically 4-12 weeks." },
    { q: "Do you offer ongoing support?", a: "Yes, we provide maintenance and support packages." },
    { q: "What is your pricing model?", a: "We offer flexible pricing based on project requirements." },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genPortfolio(): string {
  return `export function Portfolio() {
  const projects = [
    { title: "E-commerce Platform", category: "Web Development", description: "Full-stack e-commerce solution with React and Node.js." },
    { title: "Fitness App", category: "Mobile", description: "iOS and Android app for tracking workouts and nutrition." },
    { title: "SaaS Dashboard", category: "UI/UX Design", description: "Analytics dashboard with real-time data visualization." },
    { title: "Corporate Website", category: "Web Design", description: "Modern responsive website for a Fortune 500 company." },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div key={project.title} className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">Project Image</div>
              <div className="p-6">
                <p className="text-sm text-blue-600 mb-1">{project.category}</p>
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-gray-600">{project.description}</p>
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

// ═══════════════════════════════════════════════════════════
// DOMAIN-SPECIFIC COMPONENT GENERATORS (Real implementations)
// ═══════════════════════════════════════════════════════════

function genAttendanceCalendar(): string {
  return `"use client";
import { useState, useMemo } from "react";

interface AttendanceRecord {
  memberId: string;
  memberName: string;
  date: string;
  status: "present" | "absent" | "late";
}

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { memberId: "1", memberName: "John Smith", date: new Date().toISOString().split("T")[0], status: "present" },
  { memberId: "2", memberName: "Sarah Johnson", date: new Date().toISOString().split("T")[0], status: "late" },
  { memberId: "3", memberName: "Mike Wilson", date: new Date().toISOString().split("T")[0], status: "absent" },
];

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
};

export function AttendanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [filterMember, setFilterMember] = useState("");
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
    return attendance.filter((a) => a.date === dateStr && (!filterMember || a.memberName.toLowerCase().includes(filterMember.toLowerCase())));
  };

  const markAttendance = (day: number, status: "present" | "absent" | "late") => {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
    const newRecord: AttendanceRecord = {
      memberId: String(attendance.length + 1),
      memberName: "New Member",
      date: dateStr,
      status,
    };
    setAttendance((prev) => [...prev, newRecord]);
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const selectedDayRecords = getAttendanceForDay(parseInt(selectedDate.split("-")[2]) || 0);
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Filter */}
      <input
        type="text"
        placeholder="Filter by member name..."
        value={filterMember}
        onChange={(e) => setFilterMember(e.target.value)}
        className="w-full md:w-64 px-4 py-2 border rounded-lg text-sm"
      />

      {/* Calendar */}
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
                className={\`p-2 rounded-lg cursor-pointer transition-colors \${isSelected ? "bg-blue-100 border-2 border-blue-500" : "hover:bg-gray-50 border-2 border-transparent"}\`}
              >
                <div className="font-medium">{day}</div>
                {records.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {records.slice(0, 3).map((r, j) => (
                      <div key={j} className={\`w-1.5 h-1.5 rounded-full \${r.status === "present" ? "bg-green-500" : r.status === "late" ? "bg-yellow-500" : "bg-red-500"}\`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayRecords.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Member</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedDayRecords.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.memberName}</td>
                  <td className="px-4 py-2">
                    <span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_COLORS[r.status]}\`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={r.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as "present" | "absent" | "late";
                        setAttendance((prev) => prev.map((a, idx) => (idx === i ? { ...a, status: newStatus } : a)));
                      }}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Mark */}
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

function genAttendanceTable(): string {
  return `"use client";
import { useState, useMemo } from "react";

interface AttendanceRecord {
  id: string;
  memberName: string;
  checkIn: string;
  checkOut: string | null;
  date: string;
  status: "present" | "absent" | "late";
  duration: string;
}

const MOCK_DATA: AttendanceRecord[] = [
  { id: "1", memberName: "John Smith", checkIn: "08:00", checkOut: "09:30", date: "2025-01-15", status: "present", duration: "1h 30m" },
  { id: "2", memberName: "Sarah Johnson", checkIn: "08:15", checkOut: "09:45", date: "2025-01-15", status: "late", duration: "1h 30m" },
  { id: "3", memberName: "Mike Wilson", checkIn: "07:50", checkOut: "09:20", date: "2025-01-15", status: "present", duration: "1h 30m" },
  { id: "4", memberName: "Emily Davis", checkIn: "08:05", checkOut: null, date: "2025-01-15", status: "present", duration: "Ongoing" },
  { id: "5", memberName: "James Brown", checkIn: "08:30", checkOut: "09:00", date: "2025-01-14", status: "late", duration: "30m" },
];

const STATUS_BADGE: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
};

export function AttendanceTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<keyof AttendanceRecord>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...MOCK_DATA];
    if (search) result = result.filter((r) => r.memberName.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (dateFilter) result = result.filter((r) => r.date === dateFilter);
    result.sort((a, b) => {
      const aVal = String(a[sortField]);
      const bVal = String(b[sortField]);
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [search, statusFilter, dateFilter, sortField, sortDir]);

  const toggleSort = (field: keyof AttendanceRecord) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 border rounded-lg text-sm flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 border rounded-lg text-sm" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[{ key: "memberName", label: "Member" }, { key: "date", label: "Date" }, { key: "checkIn", label: "Check In" }, { key: "checkOut", label: "Check Out" }, { key: "duration", label: "Duration" }, { key: "status", label: "Status" }].map((col) => (
                <th key={col.key} onClick={() => toggleSort(col.key as keyof AttendanceRecord)} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  {col.label} {sortField === col.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.memberName}</td>
                <td className="px-4 py-3 text-gray-600">{r.date}</td>
                <td className="px-4 py-3">{r.checkIn}</td>
                <td className="px-4 py-3">{r.checkOut || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.duration}</td>
                <td className="px-4 py-3"><span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_BADGE[r.status]}\`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500">Showing {filtered.length} of {MOCK_DATA.length} records</p>
    </div>
  );
}
`;
}

function genMemberTable(): string {
  return `"use client";
import { useState, useMemo } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: "basic" | "premium" | "vip";
  status: "active" | "inactive" | "expired";
  joinDate: string;
  lastVisit: string;
}

const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "John Smith", email: "john@email.com", phone: "555-0101", membershipType: "premium", status: "active", joinDate: "2024-06-15", lastVisit: "2025-01-15" },
  { id: "2", name: "Sarah Johnson", email: "sarah@email.com", phone: "555-0102", membershipType: "vip", status: "active", joinDate: "2024-03-10", lastVisit: "2025-01-14" },
  { id: "3", name: "Mike Wilson", email: "mike@email.com", phone: "555-0103", membershipType: "basic", status: "inactive", joinDate: "2024-09-01", lastVisit: "2024-12-20" },
  { id: "4", name: "Emily Davis", email: "emily@email.com", phone: "555-0104", membershipType: "premium", status: "active", joinDate: "2024-01-20", lastVisit: "2025-01-15" },
  { id: "5", name: "James Brown", email: "james@email.com", phone: "555-0105", membershipType: "basic", status: "expired", joinDate: "2023-11-05", lastVisit: "2024-08-10" },
];

const STATUS_COLORS: Record<string, string> = { active: "bg-green-100 text-green-800", inactive: "bg-gray-100 text-gray-800", expired: "bg-red-100 text-red-800" };
const PLAN_COLORS: Record<string, string> = { basic: "bg-blue-100 text-blue-800", premium: "bg-purple-100 text-purple-800", vip: "bg-amber-100 text-amber-800" };

export function MemberTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    let result = [...MOCK_MEMBERS];
    if (search) result = result.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") result = result.filter((m) => m.status === statusFilter);
    if (planFilter !== "all") result = result.filter((m) => m.membershipType === planFilter);
    return result;
  }, [search, statusFilter, planFilter]);

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border rounded-lg text-sm flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
        <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border rounded-lg text-sm">
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{m.name.split(" ").map((n) => n[0]).join("")}</div>
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3"><span className={\`px-2 py-1 rounded-full text-xs font-medium \${PLAN_COLORS[m.membershipType]}\`}>{m.membershipType}</span></td>
                <td className="px-4 py-3"><span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_COLORS[m.status]}\`}>{m.status}</span></td>
                <td className="px-4 py-3 text-gray-600">{m.joinDate}</td>
                <td className="px-4 py-3 text-gray-600">{m.lastVisit}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                    <button className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
}

function genLeadPipeline(): string {
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

const MOCK_LEADS: Lead[] = [
  { id: "1", name: "Acme Corp", email: "info@acme.com", value: 15000, stage: "new", source: "Website" },
  { id: "2", name: "TechStart Inc", email: "hello@techstart.io", value: 8500, stage: "contacted", source: "Referral" },
  { id: "3", name: "Global Solutions", email: "contact@globalsol.com", value: 22000, stage: "qualified", source: "LinkedIn" },
  { id: "4", name: "NextGen Labs", email: "sales@nextgen.dev", value: 12000, stage: "proposal", source: "Cold Email" },
  { id: "5", name: "Prime Holdings", email: "info@primeholdings.com", value: 35000, stage: "closed-won", source: "Conference" },
  { id: "6", name: "SkyHigh Media", email: "team@skyhigh.co", value: 6000, stage: "new", source: "Google Ads" },
  { id: "7", name: "OceanTrade", email: "biz@oceantrade.com", value: 18000, stage: "closed-lost", source: "Cold Call" },
];

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
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-xs text-purple-600">Win Rate</p>
          <p className="text-xl font-bold text-purple-700">{leads.length > 0 ? Math.round((leads.filter((l) => l.stage === "closed-won").length / leads.length) * 100) : 0}%</p>
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

function genRevenueChart(): string {
  return `"use client";
import { useState, useMemo } from "react";

const MOCK_DATA = [
  { month: "Jan", revenue: 12500, expenses: 8200 },
  { month: "Feb", revenue: 15800, expenses: 9100 },
  { month: "Mar", revenue: 18200, expenses: 10500 },
  { month: "Apr", revenue: 14600, expenses: 8800 },
  { month: "May", revenue: 21300, expenses: 11200 },
  { month: "Jun", revenue: 19800, expenses: 10800 },
  { month: "Jul", revenue: 23500, expenses: 12000 },
  { month: "Aug", revenue: 20100, expenses: 10500 },
  { month: "Sep", revenue: 24800, expenses: 13000 },
  { month: "Oct", revenue: 22400, expenses: 11800 },
  { month: "Nov", revenue: 26100, expenses: 13500 },
  { month: "Dec", revenue: 28900, expenses: 14200 },
];

export function RevenueChart() {
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [showExpenses, setShowExpenses] = useState(true);

  const chartData = useMemo(() => {
    if (period === "quarterly") {
      const quarters: { label: string; revenue: number; expenses: number }[] = [];
      for (let i = 0; i < MOCK_DATA.length; i += 3) {
        const q = MOCK_DATA.slice(i, i + 3);
        quarters.push({
          label: \`Q\${Math.floor(i / 3) + 1}\`,
          revenue: q.reduce((s, d) => s + d.revenue, 0),
          expenses: q.reduce((s, d) => s + d.expenses, 0),
        });
      }
      return quarters;
    }
    return MOCK_DATA.map((d) => ({ label: d.month, revenue: d.revenue, expenses: d.expenses }));
  }, [period]);

  const maxValue = Math.max(...chartData.map((d) => Math.max(d.revenue, showExpenses ? d.expenses : 0)));
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = chartData.reduce((s, d) => s + d.expenses, 0);
  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(["monthly", "quarterly", "yearly"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={\`px-3 py-1 rounded-lg text-sm \${period === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}\`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showExpenses} onChange={(e) => setShowExpenses(e.target.checked)} className="rounded" />
          Show Expenses
        </label>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex-1">
          <p className="text-xs text-green-600">Total Revenue</p>
          <p className="text-xl font-bold text-green-700">\${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex-1">
          <p className="text-xs text-red-600">Total Expenses</p>
          <p className="text-xl font-bold text-red-700">\${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex-1">
          <p className="text-xs text-blue-600">Net Profit</p>
          <p className="text-xl font-bold text-blue-700">\${profit.toLocaleString()}</p>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="flex items-end gap-2 h-48">
          {chartData.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: "160px" }}>
                <div className="flex-1 bg-green-500 rounded-t" style={{ height: \`\${(d.revenue / maxValue) * 100}%\` }} title={\`Revenue: \${d.revenue.toLocaleString()}\`} />
                {showExpenses && (
                  <div className="flex-1 bg-red-400 rounded-t" style={{ height: \`\${(d.expenses / maxValue) * 100}%\` }} title={\`Expenses: \${d.expenses.toLocaleString()}\`} />
                )}
              </div>
              <span className="text-xs text-gray-500">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" /><span className="text-xs text-gray-600">Revenue</span></div>
          {showExpenses && <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" /><span className="text-xs text-gray-600">Expenses</span></div>}
        </div>
      </div>
    </div>
  );
}
`;
}

function genInvoiceTable(): string {
  return `"use client";
import { useState, useMemo } from "react";

interface Invoice {
  id: string;
  memberName: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  paidDate: string | null;
  plan: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: "INV-001", memberName: "John Smith", amount: 49.99, status: "paid", dueDate: "2025-01-01", paidDate: "2024-12-28", plan: "Premium" },
  { id: "INV-002", memberName: "Sarah Johnson", amount: 99.99, status: "paid", dueDate: "2025-01-01", paidDate: "2025-01-01", plan: "VIP" },
  { id: "INV-003", memberName: "Mike Wilson", amount: 29.99, status: "overdue", dueDate: "2025-01-01", paidDate: null, plan: "Basic" },
  { id: "INV-004", memberName: "Emily Davis", amount: 49.99, status: "pending", dueDate: "2025-02-01", paidDate: null, plan: "Premium" },
  { id: "INV-005", memberName: "James Brown", amount: 29.99, status: "paid", dueDate: "2025-01-01", paidDate: "2024-12-30", plan: "Basic" },
];

const STATUS_COLORS: Record<string, string> = { paid: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800", overdue: "bg-red-100 text-red-800" };

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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
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
                <td className="px-4 py-3"><span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_COLORS[inv.status]}\`}>{inv.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {inv.status !== "paid" && <button className="text-green-600 hover:text-green-800 text-xs">Mark Paid</button>}
                    <button className="text-blue-600 hover:text-blue-800 text-xs">View</button>
                  </div>
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

function genClassSchedule(): string {
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
  { id: "6", name: "Boxing", instructor: "Mike Torres", day: "Wednesday", time: "18:00", duration: "60min", capacity: 16, booked: 14, category: "Combat" },
  { id: "7", name: "CrossFit", instructor: "James Park", day: "Thursday", time: "06:30", duration: "60min", capacity: 20, booked: 19, category: "Functional" },
  { id: "8", name: "Zumba", instructor: "Sarah Kim", day: "Friday", time: "17:00", duration: "45min", capacity: 30, booked: 25, category: "Dance" },
];

const CATEGORY_COLORS: Record<string, string> = { Yoga: "bg-purple-100 text-purple-800", Cardio: "bg-red-100 text-red-800", Strength: "bg-blue-100 text-blue-800", Flexibility: "bg-green-100 text-green-800", Combat: "bg-orange-100 text-orange-800", Functional: "bg-yellow-100 text-yellow-800", Dance: "bg-pink-100 text-pink-800" };

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
          <button key={day} onClick={() => setSelectedDay(day)} className={\`px-4 py-2 rounded-lg text-sm whitespace-nowrap \${selectedDay === day ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}\`}>{day}</button>
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

function genDashboardStats(): string {
  return `"use client";
import { useState } from "react";

const MOCK_STATS = {
  totalMembers: 342,
  activeToday: 89,
  revenue: 24850,
  newLeads: 18,
  classesBooked: 156,
  attendanceRate: 78,
};

const MOCK_ACTIVIVITY = [
  { id: "1", text: "John Smith checked in", time: "2 min ago", type: "checkin" },
  { id: "2", text: "New lead: Acme Corp", time: "15 min ago", type: "lead" },
  { id: "3", text: "Sarah Johnson booked Yoga", time: "30 min ago", type: "booking" },
  { id: "4", text: "Invoice INV-003 marked overdue", time: "1 hour ago", type: "payment" },
  { id: "5", text: "Mike Wilson renewed membership", time: "2 hours ago", type: "renewal" },
];

const ACTIVITY_ICONS: Record<string, string> = { checkin: "🟢", lead: "🔵", booking: "📅", payment: "💰", renewal: "🔄" };

export function DashboardStats() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  const stats = [
    { label: "Total Members", value: MOCK_STATS.totalMembers, change: "+12%", up: true, color: "blue" },
    { label: "Active Today", value: MOCK_STATS.activeToday, change: "+5%", up: true, color: "green" },
    { label: "Revenue", value: \`$\${MOCK_STATS.revenue.toLocaleString()}\`, change: "+18%", up: true, color: "purple" },
    { label: "New Leads", value: MOCK_STATS.newLeads, change: "+3", up: true, color: "amber" },
    { label: "Classes Booked", value: MOCK_STATS.classesBooked, change: "+22%", up: true, color: "pink" },
    { label: "Attendance Rate", value: \`\${MOCK_STATS.attendanceRate}%\`, change: "+2%", up: true, color: "emerald" },
  ];

  const COLOR_MAP: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
    pink: "bg-pink-50 border-pink-200",
    emerald: "bg-emerald-50 border-emerald-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["today", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={\`px-3 py-1 rounded-md text-sm \${period === p ? "bg-white shadow text-gray-900" : "text-gray-500"}\`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={\`p-4 rounded-xl border \${COLOR_MAP[s.color]}\`}>
            <p className="text-xs text-gray-600 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-green-600 mt-1">{s.change} vs last {period}</p>
          </div>
        ))}
      </div>
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {MOCK_ACTIVITY.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <span>{ACTIVITY_ICONS[a.type]}</span>
              <span className="flex-1">{a.text}</span>
              <span className="text-gray-400 text-xs">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
}

function genFilterSidebar(): string {
  return `"use client";
import { useState } from "react";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  ratings: number;
  inStock: boolean;
}

interface FilterSidebarProps {
  onFilter: (filters: FilterState) => void;
}

const CATEGORIES = ["Supplements", "Protein", "Vitamins", "Pre-Workout", "Recovery", "Accessories"];
const BRANDS = ["Optimum Nutrition", "MyProtein", "BSN", "Dymatize", "MuscleTech"];

export function FilterSidebar({ onFilter }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 200],
    brands: [],
    ratings: 0,
    inStock: false,
  });

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-white">
      <h3 className="font-semibold">Filters</h3>

      <div>
        <h4 className="text-sm font-medium mb-2">Category</h4>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filters.categories.includes(cat)} onChange={() => updateFilter("categories", toggleArrayItem(filters.categories, cat))} className="rounded" />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Price Range</h4>
        <div className="flex gap-2 items-center">
          <input type="number" value={filters.priceRange[0]} onChange={(e) => updateFilter("priceRange", [Number(e.target.value), filters.priceRange[1]])} className="w-20 px-2 py-1 border rounded text-sm" min={0} />
          <span className="text-gray-400">—</span>
          <input type="number" value={filters.priceRange[1]} onChange={(e) => updateFilter("priceRange", [filters.priceRange[0], Number(e.target.value)])} className="w-20 px-2 py-1 border rounded text-sm" min={0} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Brand</h4>
        <div className="space-y-1">
          {BRANDS.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => updateFilter("brands", toggleArrayItem(filters.brands, brand))} className="rounded" />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Minimum Rating</h4>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => updateFilter("ratings", filters.ratings === star ? 0 : star)} className={\`text-lg \${star <= filters.ratings ? "text-yellow-400" : "text-gray-300"}\`}>★</button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filters.inStock} onChange={(e) => updateFilter("inStock", e.target.checked)} className="rounded" />
          In Stock Only
        </label>
      </div>

      <button onClick={() => setFilters({ categories: [], priceRange: [0, 200], brands: [], ratings: 0, inStock: false })} className="w-full py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
        Clear All Filters
      </button>
    </div>
  );
}
`;
}

function genProductGallery(): string {
  return `"use client";
import { useState } from "react";

const MOCK_IMAGES = [
  { id: "1", url: "/api/placeholder/600/600", alt: "Product front view" },
  { id: "2", url: "/api/placeholder/600/600", alt: "Product side view" },
  { id: "3", url: "/api/placeholder/600/600", alt: "Product back view" },
  { id: "4", url: "/api/placeholder/600/600", alt: "Nutrition label" },
];

export function ProductGallery() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-xl overflow-hidden border bg-gray-100">
        <img src={MOCK_IMAGES[activeImage].url} alt={MOCK_IMAGES[activeImage].alt} className="w-full h-full object-cover" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MOCK_IMAGES.map((img, i) => (
          <button key={img.id} onClick={() => setActiveImage(i)} className={\`aspect-square rounded-lg overflow-hidden border-2 transition-colors \${i === activeImage ? "border-blue-500" : "border-transparent hover:border-gray-300"}\`}>
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
`;
}

/**
 * Generate a detailed generic component when no domain-specific generator exists.
 * Creates a real implementation with data, state, and UI — not a stub.
 */
function genDetailedComponent(name: string, prompt: string, blueprint?: DomainBlueprint | null): string {
  const lower = name.toLowerCase();

  if (lower.includes("table") || lower.includes("list")) {
    return `"use client";
import { useState, useMemo } from "react";

interface Item { id: string; name: string; status: string; date: string; }

const MOCK_DATA: Item[] = [
  { id: "1", name: "Item Alpha", status: "active", date: "2025-01-15" },
  { id: "2", name: "Item Beta", status: "pending", date: "2025-01-14" },
  { id: "3", name: "Item Gamma", status: "inactive", date: "2025-01-13" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  inactive: "bg-red-100 text-red-800",
};

export function ${name}() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = useMemo(() => {
    let result = [...MOCK_DATA];
    if (search) result = result.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    return result;
  }, [search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 border rounded-lg text-sm flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3"><span className={\`px-2 py-1 rounded-full text-xs font-medium \${STATUS_COLORS[item.status] || "bg-gray-100"}\`}>{item.status}</span></td>
                <td className="px-4 py-3 text-gray-600">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500">Showing {filtered.length} of {MOCK_DATA.length} records</p>
    </div>
  );
}`;
  }

  if (lower.includes("form") || lower.includes("input")) {
    return `"use client";
import { useState } from "react";

export function ${name}() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <div className="rounded-lg border bg-green-50 p-6 text-green-800">Submitted successfully!</div>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea rows={4} required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Submit</button>
    </form>
  );
}`;
  }

  if (lower.includes("chart") || lower.includes("graph") || lower.includes("stats")) {
    return `"use client";
import { useState } from "react";

const MOCK_DATA = [
  { label: "Jan", value: 120 }, { label: "Feb", value: 180 }, { label: "Mar", value: 150 },
  { label: "Apr", value: 220 }, { label: "May", value: 190 }, { label: "Jun", value: 280 },
];

export function ${name}() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const maxValue = Math.max(...MOCK_DATA.map((d) => d.value));
  const total = MOCK_DATA.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["monthly", "yearly"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={\`px-3 py-1 rounded-lg text-sm \${period === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}\`}>{p}</button>
        ))}
      </div>
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-600">Total</p>
        <p className="text-xl font-bold text-blue-700">{total.toLocaleString()}</p>
      </div>
      <div className="border rounded-lg p-4">
        <div className="flex items-end gap-2 h-40">
          {MOCK_DATA.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-blue-500 rounded-t" style={{ height: \`\${(d.value / maxValue) * 100}%\` }} title={d.value.toLocaleString()} />
              <span className="text-xs text-gray-500">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;
  }

  if (lower.includes("card") || lower.includes("grid")) {
    return `"use client";
import { useState } from "react";

const ITEMS = [
  { id: "1", title: "Item One", description: "Description for the first item in the collection." },
  { id: "2", title: "Item Two", description: "Description for the second item in the collection." },
  { id: "3", title: "Item Three", description: "Description for the third item in the collection." },
];

export function ${name}() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ITEMS.map((item) => (
        <div key={item.id} onClick={() => setSelected(item.id)} className={\`p-4 rounded-lg border cursor-pointer transition-all \${selected === item.id ? "border-blue-500 bg-blue-50 shadow-md" : "hover:shadow-md"}\`}>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
        </div>
      ))}
    </div>
  );
}`;
  }

  // Default: section with heading and content
  return `export function ${name}() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">${name.replace(/([A-Z])/g, " $1").trim()}</h2>
        <p className="text-gray-600 leading-relaxed">This section provides ${name.replace(/([A-Z])/g, " $1").trim().toLowerCase()} functionality for the application.</p>
      </div>
    </section>
  );
}`;
}

const COMPONENT_GENERATORS: Record<string, (prompt?: string) => string> = {
  Header: () => genHeader("Project"),
  Footer: genFooter,
  Hero: (p) => genHero(p || "Welcome"),
  Features: (p) => genFeatures(p),
  AboutContent: genAbout,
  ContactForm: genContactForm,
  PricingTable: genPricingTable,
  BlogList: genBlogList,
  Testimonials: genTestimonials,
  CTA: genCTA,
  Newsletter: genNewsletter,
  Services: genServices,
  Team: genTeam,
  Stats: genStats,
  FAQ: genFAQ,
  Portfolio: genPortfolio,
  ProductGrid: genProductGrid,
  CartItems: genCartItems,
  CartSummary: genCartSummary,
  Sidebar: genSidebar,
  DashboardContent: genDashboardContent,
  LoginForm: genLoginForm,
  RegisterForm: genRegisterForm,
  // Domain-specific generators (REAL implementations)
  AttendanceCalendar: genAttendanceCalendar,
  AttendanceTable: genAttendanceTable,
  MemberTable: genMemberTable,
  LeadPipeline: genLeadPipeline,
  RevenueChart: genRevenueChart,
  InvoiceTable: genInvoiceTable,
  ClassSchedule: genClassSchedule,
  DashboardStats: genDashboardStats,
  FilterSidebar: genFilterSidebar,
  ProductGallery: genProductGallery,
};

async function generateFiles(
  prompt: string,
  factory: string,
  projectName: string,
  llmContent: LLMContent | null,
  scraped?: ScrapedSite,
  architecture?: ArchitecturePlan
): Promise<{ path: string; content: string; type: string }[]> {
  const files: { path: string; content: string; type: string }[] = [];

  // If we have scraped data, generate ACTUAL HTML files (static site)
  if (scraped && scraped.pages.length > 0) {
    for (const page of scraped.pages) {
      if (!page.fullHtml) continue;
      const filePath = page.path === "/"
        ? "index.html"
        : `${page.path.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
      files.push({ path: filePath, content: page.fullHtml, type: "html" });
    }

    files.push({
      path: "README.md",
      content: `# ${projectName}\n\nCloned from: ${scraped.baseUrl}\nPages: ${scraped.pages.length}\nAssets: ${(scraped.assets || []).length}\n\n## Deployment\n\nThis is a static HTML site. Deploy to any static hosting:\n- Netlify: drag & drop this folder\n- Vercel: \`vercel deploy\`\n- GitHub Pages: push to gh-pages branch\n- Any web server: copy files to public_html/\n`,
      type: "config"
    });

    return files;
  }

  // ═══ ARCHITECTURE-DRIVEN GENERATION ═══
  if (!architecture) return files;

  // ═══ DOMAIN BLUEPRINT OVERLAY ═══
  // Detect blueprint and merge its required components into the architecture
  const blueprint = detectBlueprint(prompt);
  if (blueprint) {
    // Add blueprint-specific pages that aren't in architecture yet
    for (const bpPage of blueprint.requiredPages) {
      const existingRoute = architecture.routes.find(r => r.path === bpPage.route);
      if (existingRoute) {
        // Merge blueprint components into existing route
        for (const compName of bpPage.components) {
          if (!existingRoute.components.includes(compName)) {
            existingRoute.components.push(compName);
          }
        }
      } else {
        // Add new route from blueprint
        architecture.routes.push({
          path: bpPage.route,
          name: bpPage.name,
          components: bpPage.components,
          description: `${bpPage.name} page`,
        });
      }
    }

    // Add blueprint-specific components to architecture
    for (const bpComp of blueprint.requiredComponents) {
      const exists = architecture.components.some(c => c.name === bpComp.name);
      if (!exists) {
        architecture.components.push({
          name: bpComp.name,
          type: "feature",
          props: [],
          description: bpComp.description,
        });
      }
    }
  }

  const navItems = architecture.navigation.map(n => n.label);

  // ─── GENERATE PAGES FROM ARCHITECTURE ───
  for (const route of architecture.routes) {
    const pagePath = route.path === "/" ? "src/app/page.tsx" : `src/app${route.path}/page.tsx`;
    const imports = route.components.map(c => `import { ${c} } from "@/components/${c}";`).join("\n");
    const usage = route.components.map(c => `      <${c} />`).join("\n");
    const pageName = route.name.replace(/\s+/g, "");

    const pageContent = `${imports}

export default function ${pageName}Page() {
  return (
    <main className="min-h-screen">
${usage}
    </main>
  );
}
`;
    files.push({ path: pagePath, content: pageContent, type: "page" });
  }

  // ─── GENERATE COMPONENTS FROM ARCHITECTURE ───
  const generatedComponents = new Set<string>();

  // Generate page-specific components
  for (const route of architecture.routes) {
    for (const compName of route.components) {
      if (generatedComponents.has(compName)) continue;
      generatedComponents.add(compName);

      const gen = COMPONENT_GENERATORS[compName];
      if (gen) {
        let content = gen(prompt);
        // Use LLM content for Hero and Features
        if (llmContent) {
          if (compName === "Hero") content = genHeroLLM(llmContent.heroTitle, llmContent.heroSubtitle, llmContent.ctaText, llmContent.colors);
          else if (compName === "Features" && llmContent.features.length > 0) content = genFeaturesLLM(llmContent.features, llmContent.colors);
          else if (compName === "CTA" && llmContent.ctaText) content = genCTALLM(llmContent.ctaText);
          else if (compName === "Header") content = genHeader(projectName, navItems, llmContent.colors);
        }
        files.push({ path: `src/components/${compName}.tsx`, content, type: "component" });
      } else {
        // Generate a generic component for missing ones
        files.push({
          path: `src/components/${compName}.tsx`,
          content: genGenericComponent(compName, prompt),
          type: "component",
        });
      }
    }
  }

  // Generate additional components from architecture that aren't page-specific
  for (const comp of architecture.components) {
    if (generatedComponents.has(comp.name)) continue;
    generatedComponents.add(comp.name);

    const gen = COMPONENT_GENERATORS[comp.name];
    if (gen) {
      files.push({ path: `src/components/${comp.name}.tsx`, content: gen(prompt), type: "component" });
    } else {
      files.push({
        path: `src/components/${comp.name}.tsx`,
        content: genGenericComponent(comp.name, prompt),
        type: "component",
      });
    }
  }

  // ─── HEADER WITH CORRECT NAVIGATION ───
  const headerFile = files.find(f => f.path === "src/components/Header.tsx");
  if (headerFile) {
    headerFile.content = genHeaderWithNav(projectName, architecture.navigation, llmContent?.colors);
  } else {
    files.push({
      path: "src/components/Header.tsx",
      content: genHeaderWithNav(projectName, architecture.navigation, llmContent?.colors),
      type: "component",
    });
  }

  // ─── CONFIG FILES ───
  files.push({ path: "src/app/layout.tsx", content: genLayout(projectName), type: "config" });
  files.push({ path: "src/app/globals.css", content: genStyles(llmContent?.colors), type: "config" });

  const config = genConfig(projectName);
  files.push({ path: config.filename, content: config.content, type: "config" });

  files.push({
    path: "package.json",
    content: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
      dependencies: { next: "14.2.0", react: "^18", "react-dom": "^18" },
      devDependencies: { "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", autoprefixer: "^10", postcss: "^8", tailwindcss: "^3.4", typescript: "^5" },
    }, null, 2),
    type: "config",
  });

  files.push({
    path: "tsconfig.json",
    content: JSON.stringify({
      compilerOptions: { lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", increment: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] } },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2),
    type: "config",
  });

  files.push({
    path: "tailwind.config.ts",
    content: `import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: {} }, plugins: [] };
export default config;`,
    type: "config",
  });

  files.push({
    path: "postcss.config.mjs",
    content: `const config = { plugins: { tailwindcss: {}, autoprefixer: {} } }; export default config;`,
    type: "config",
  });

  files.push({ path: "README.md", content: `# ${projectName}\n\nGenerated by build.same\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`, type: "config" });

  return files;
}

/**
 * Generate a generic component with project-specific content (no prompt echoing).
 */
function genGenericComponent(name: string, prompt: string): string {
  // Extract project context from prompt (without echoing the raw prompt)
  const projectContext = extractProjectContext(prompt);

  const contentMap: Record<string, string> = {
    Services: `export function Services() {
  const services = [
    { title: "${projectContext.serviceType || "Service"} 1", description: "Professional ${projectContext.serviceType || "service"} tailored to your needs." },
    { title: "${projectContext.serviceType || "Service"} 2", description: "Expert ${projectContext.serviceType || "service"} solutions for growth." },
    { title: "${projectContext.serviceType || "Service"} 3", description: "Innovative ${projectContext.serviceType || "service"} for modern businesses." },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s) => (
            <div key={s.title} className="p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-gray-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    Team: `export function Team() {
  const members = [
    { name: "Sarah Johnson", role: "CEO & Founder" },
    { name: "Michael Chen", role: "CTO" },
    { name: "Emily Davis", role: "Design Director" },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {members.map((m) => (
            <div key={m.name} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                {m.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h3 className="text-lg font-semibold">{m.name}</h3>
              <p className="text-sm text-blue-600">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    Stats: `export function Stats() {
  const stats = [
    { label: "Projects", value: "250+" },
    { label: "Clients", value: "120+" },
    { label: "Team", value: "40+" },
    { label: "Experience", value: "10+" },
  ];
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-blue-600 mb-2">{s.value}</p>
              <p className="text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  };

  return contentMap[name] || `export function ${name}() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold">${name}</h2>
      </div>
    </section>
  );
}`;
}

/**
 * Extract project context from prompt without echoing raw text.
 */
function extractProjectContext(prompt: string): Record<string, string> {
  const lower = prompt.toLowerCase();
  const context: Record<string, string> = {};

  if (/\b(gym|fitness|health|wellness)\b/.test(lower)) {
    context.serviceType = "fitness";
    context.industry = "health & fitness";
  } else if (/\b(marketing|agency|digital)\b/.test(lower)) {
    context.serviceType = "marketing";
    context.industry = "digital marketing";
  } else if (/\b(saas|software|tech)\b/.test(lower)) {
    context.serviceType = "software";
    context.industry = "technology";
  } else if (/\b(ecommerce|shop|store)\b/.test(lower)) {
    context.serviceType = "product";
    context.industry = "ecommerce";
  } else {
    context.serviceType = "professional";
    context.industry = "business";
  }

  // Extract the project name (usually after "for", "called", "named")
  const nameMatch = prompt.match(/(?:for|called|named)\s+(?:a\s+)?(?:the\s+)?["']?([^"'.]+?)["']?\s*(?:\.|,|$)/i);
  if (nameMatch) {
    context.projectName = nameMatch[1].trim();
  }

  return context;
}

/**
 * Generate Header with actual navigation routes (fixes /home bug).
 */
function genHeaderWithNav(name: string, navigation: Array<{ label: string; href: string }>, colors?: LLMContent["colors"]): string {
  const links = navigation.map(n => {
    const href = n.href === "/" ? "/" : n.href;
    return `<Link href="${href}" className="text-sm font-medium hover:opacity-80 transition-opacity">${n.label}</Link>`;
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

function calculateQualityScore(files: { path: string; content: string; type: string }[]): number {
  let score = 0;

  if (files.length >= 20) score += 0.25;
  else if (files.length >= 15) score += 0.20;
  else if (files.length >= 10) score += 0.15;
  else if (files.length >= 5) score += 0.10;

  if (files.some((f) => f.path.includes("page.tsx"))) score += 0.10;
  if (files.some((f) => f.path === "src/app/layout.tsx")) score += 0.05;
  if (files.some((f) => f.path === "src/app/globals.css")) score += 0.05;
  if (files.some((f) => f.path === "package.json")) score += 0.05;
  if (files.some((f) => f.path === "tsconfig.json")) score += 0.03;
  if (files.some((f) => f.path.includes("tailwind.config"))) score += 0.02;

  const componentCount = files.filter((f) => f.path.includes("components/")).length;
  if (componentCount >= 8) score += 0.20;
  else if (componentCount >= 5) score += 0.15;
  else if (componentCount >= 3) score += 0.10;
  else if (componentCount >= 1) score += 0.05;

  const pageCount = files.filter((f) => f.path.includes("page.tsx")).length;
  if (pageCount >= 5) score += 0.15;
  else if (pageCount >= 3) score += 0.10;
  else if (pageCount >= 2) score += 0.05;

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

export type ProgressCallback = (event: string, data: Record<string, unknown>) => void;
export type FilesCallback = (files: { path: string; content: string; type: string }[]) => void;

export async function runGeneration(
  request: GenerationRequest,
  onProgress?: ProgressCallback,
  onFiles?: FilesCallback
): Promise<GenerationResult> {
  const supabase = getSupabase();
  const factory = detectFactory(request.prompt, request.factory);
  const projectName = extractProjectName(request.prompt, request.name);
  const errors: string[] = [];
  const warnings: string[] = [];

  const emit = (event: string, data: Record<string, unknown>) => {
    onProgress?.(event, data);
  };

  // ═══ ARCHITECTURE-DRIVEN GENERATION ═══
  let requirements: RequirementMatrix | undefined;
  let architecture: ArchitecturePlan | undefined;
  const urlMatch = request.prompt.trim().match(/(https?:\/\/[^\s]+)/i);
  const isUrl = !!urlMatch;

  if (!isUrl) {
    // Step 1: Analyze requirements
    emit("thinking", { message: "Analyzing requirements from your prompt..." });
    requirements = analyzeRequirements(request.prompt);
    emit("thinking", { message: `Found ${requirements.pages.length} pages, ${requirements.components.length} components, ${requirements.features.length} features, ${requirements.entities.length} entities` });

    // Step 2: Plan architecture
    emit("thinking", { message: "Planning project architecture..." });
    architecture = planArchitecture(requirements, projectName);
    emit("thinking", { message: `Planned ${architecture.routes.length} routes, ${architecture.navigation.length} nav items, ${architecture.dataModels.length} data models` });
  }

  // Detect and scrape URL if present
  let scraped: ScrapedSite | undefined;
  if (urlMatch) {
    const detectedUrl = urlMatch[1];
    emit("thinking", { message: `Crawling ${detectedUrl} for pages and assets...` });
    try {
      scraped = await scrapeSite(detectedUrl, 50);
      emit("thinking", { message: `Found ${scraped.pages.length} pages, ${(scraped.assets || []).length} assets from ${scraped.baseUrl}` });
      warnings.push(`Crawled ${scraped.pages.length} pages from ${scraped.baseUrl}: Tech: ${scraped.techStack.join(", ") || "unknown"}`);
    } catch (err) {
      emit("thinking", { message: `Scraping failed: ${err instanceof Error ? err.message : "unknown"}. Generating from prompt only.` });
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
      runAgentWorkflow(request.prompt, factory, projectName, emit),
      retrieveMemory(request.prompt, factory),
      predictQuality(request.prompt, factory),
    ]);
    const files = await generateFiles(request.prompt, factory, projectName, llmContent, scraped, architecture);
    emit("thinking", { message: `Generated ${files.length} files. Validating against requirements...` });

    // Detect domain blueprint for regeneration
    const pipelineBlueprint = detectBlueprint(request.prompt);

    // Emit files incrementally in batches for live preview
    if (onFiles && files.length > 0) {
      const pageFiles = files.filter(f => f.type === "page");
      const componentFiles = files.filter(f => f.type === "component");
      const configFiles = files.filter(f => f.type === "config");

      // Batch 1: Pages
      if (pageFiles.length > 0) {
        emit("thinking", { message: `Emitting ${pageFiles.length} page files...` });
        onFiles(pageFiles);
        await new Promise(r => setTimeout(r, 50));
      }

      // Batch 2: Components (in chunks of 5)
      for (let i = 0; i < componentFiles.length; i += 5) {
        const batch = componentFiles.slice(i, i + 5);
        emit("thinking", { message: `Emitting components ${i + 1}-${Math.min(i + 5, componentFiles.length)} of ${componentFiles.length}...` });
        onFiles(batch);
        await new Promise(r => setTimeout(r, 50));
      }

      // Batch 3: Config files
      if (configFiles.length > 0) {
        emit("thinking", { message: `Emitting ${configFiles.length} config files...` });
        onFiles(configFiles);
        await new Promise(r => setTimeout(r, 50));
      }
    }

    const qualityScore = calculateQualityScore(files);
    const buildValidation = validateBuild(files);

    // Calculate component depth score for honest quality assessment
    let depthResult = calculateComponentDepthScore(files);
    if (depthResult.placeholderCount > 0) {
      emit("thinking", { message: `Found ${depthResult.placeholderCount} placeholder components (avg depth: ${Math.round(depthResult.avgScore)}%). Regenerating...` });

      // ═══ REGENERATION LOOP: Replace stubs with real implementations ═══
      for (const dr of depthResult.results) {
        if (!dr.isPlaceholder) continue;
        const compName = dr.componentName;
        const filePath = dr.filePath;

        // Find the component in files array
        const fileIdx = files.findIndex(f => f.path === filePath);
        if (fileIdx === -1) continue;

        // Try blueprint-specific generator first
        let regenerated = false;
        if (pipelineBlueprint) {
          const bpSpec = pipelineBlueprint.requiredComponents.find(c => c.name === compName);
          if (bpSpec) {
            // Blueprint component exists but was still a stub — try the domain generator
            const gen = COMPONENT_GENERATORS[compName];
            if (gen) {
              files[fileIdx].content = gen(prompt);
              regenerated = true;
              emit("thinking", { message: `Regenerated ${compName} from domain generator (${files[fileIdx].content.split("\n").length} lines)` });
            }
          }
        }

        // If not regenerated, use a detailed generic generator
        if (!regenerated) {
          files[fileIdx].content = genDetailedComponent(compName, request.prompt, pipelineBlueprint);
          regenerated = true;
          emit("thinking", { message: `Regenerated ${compName} with detailed template (${files[fileIdx].content.split("\n").length} lines)` });
        }
      }

      // Re-calculate depth after regeneration
      depthResult = calculateComponentDepthScore(files);
      emit("thinking", { message: `After regeneration: ${depthResult.placeholderCount} placeholders remaining, avg depth ${Math.round(depthResult.avgScore)}%` });
    }

    // Use architecture-based quality scores with component depth
    let qualityScores: QualityScores | null = null;
    if (requirements && architecture) {
      const coverage = validateRequirements(files, requirements, architecture);
      qualityScores = calculateQualityScores(
        files, coverage, buildValidation.buildSuccess,
        depthResult.score, depthResult.placeholderCount
      );
      emit("coverage_report", {
        overallCoverage: coverage.overallCoverage,
        passed: coverage.passed,
        pages: coverage.pages,
        components: coverage.components,
        features: coverage.features,
        routes: coverage.routes,
        entities: coverage.entities,
        missingItems: coverage.missingItems,
        qualityScores,
        componentDepth: depthResult,
      });
    }

    // Generate preview from files (React preview for non-scraped, HTML for scraped)
    if (files.length > 0) {
      try {
        if (scraped && scraped.pages.length > 0) {
          const homePage = scraped.pages.find(p => p.path === "/") || scraped.pages[0];
          if (homePage?.fullHtml) {
            emit("preview_url", { url: `data:text/html;charset=utf-8,${encodeURIComponent(homePage.fullHtml)}` });
          } else {
            const previewHtml = generatePreviewHtml(scraped, projectName);
            emit("preview_url", { url: `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}` });
          }
        } else {
          // Generate React preview from the component files
          const { generateReactPreview } = await import("./preview-renderer");
          const previewHtml = generateReactPreview(files, projectName);
          emit("preview_url", { url: `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}` });
        }
      } catch (err) {
        console.error("Preview generation failed:", err);
      }
    }

    // Store architecture plan in blueprints table
    if (architecture) {
      const { error: bpError } = await supabase.from("blueprints").insert({
        project_id: projectId,
        json: architecture,
      });
      if (bpError) {
        const msg = `Blueprint insert failed: ${bpError.message}`;
        errors.push(msg);
        console.error(msg);
      }
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

    // Create and upload static site clone zip (actual HTML + assets)
    if (scraped && scraped.pages.length > 0) {
      try {
        const { default: JSZip } = await import("jszip");
        const cloneZip = new JSZip();

        // Build URL-to-localPath mapping from assets
        const urlToLocal = new Map<string, string>();
        for (const asset of scraped.assets || []) {
          urlToLocal.set(asset.url, asset.localPath.startsWith("/") ? asset.localPath.slice(1) : asset.localPath);
        }

        console.log(`[Clone ZIP] Creating ZIP with ${scraped.pages.length} pages, ${urlToLocal.size} assets`);

        // Add all HTML pages with rewritten asset URLs
        let pagesAdded = 0;
        for (const page of scraped.pages) {
          if (!page.fullHtml) {
            console.log(`[Clone ZIP] Skipping page ${page.path} — no fullHtml`);
            continue;
          }
          const filePath = page.path === "/"
            ? "index.html"
            : `${page.path.replace(/^\//, "").replace(/\/$/, "")}/index.html`;

          let html = page.fullHtml;
          // Rewrite absolute asset URLs to relative local paths
          for (const [absoluteUrl, localPath] of urlToLocal) {
            html = html.split(absoluteUrl).join(localPath);
          }
          // Remove base tag (no longer needed with relative paths)
          html = html.replace(/<base[^>]*>/gi, "");

          cloneZip.file(filePath, html);
          pagesAdded++;
        }

        // Add all assets
        let assetsAdded = 0;
        for (const asset of scraped.assets || []) {
          try {
            const cleanPath = asset.localPath.startsWith("/") ? asset.localPath.slice(1) : asset.localPath;
            cloneZip.file(cleanPath, Buffer.from(asset.buffer));
            assetsAdded++;
          } catch (err) {
            console.error(`[Clone ZIP] Failed to add asset ${asset.url}:`, err);
          }
        }

        // Add README
        cloneZip.file("README.md", `# Cloned Website\n\nSource: ${scraped.baseUrl}\nPages: ${pagesAdded}\nAssets: ${assetsAdded}\n\n## Deployment\n\nDeploy to any static hosting:\n- Netlify: drag & drop this folder\n- Vercel: \`vercel deploy\`\n- GitHub Pages: push to gh-pages branch\n- Any web server: copy to public_html/\n`);

        console.log(`[Clone ZIP] ZIP contents: ${pagesAdded} pages, ${assetsAdded} assets`);

        const cloneBuffer = await cloneZip.generateAsync({ type: "uint8array" });
        console.log(`[Clone ZIP] ZIP size: ${cloneBuffer.byteLength} bytes`);

        const { error: uploadErr } = await supabase.storage
          .from("generated-projects")
          .upload(`${projectId}/clone.zip`, Buffer.from(cloneBuffer), {
            contentType: "application/zip",
            upsert: true,
          });

        if (uploadErr) {
          console.error(`[Clone ZIP] Upload failed:`, uploadErr);
          errors.push(`Clone ZIP upload failed: ${uploadErr.message}`);
        } else {
          console.log(`[Clone ZIP] Upload successful: ${projectId}/clone.zip`);
        }
      } catch (err) {
        console.error("[Clone ZIP] Creation failed:", err);
        errors.push(`Clone ZIP creation failed: ${err instanceof Error ? err.message : "unknown"}`);
      }
    } else {
      console.log(`[Clone ZIP] Skipping — scraped: ${!!scraped}, pages: ${scraped?.pages.length || 0}`);
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

    // Store scraped pages + assets for clone preview/download
    if (scraped && scraped.pages.length > 0) {
      storeSite(
        projectId,
        scraped.baseUrl,
        scraped.rootDomain,
        scraped.pages
          .filter(p => p.fullHtml)
          .map(p => ({ path: p.path, title: p.title, fullHtml: p.fullHtml! })),
        scraped.assets || []
      );
    }

    return {
      projectId,
      status,
      factory,
      files,
      blueprint: architecture,
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
      optimizedBlueprint: undefined,
      scraped,
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
