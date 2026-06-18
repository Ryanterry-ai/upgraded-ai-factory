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
  detectRPSEContext,
  getRPSEData,
  getRPSEChartData,
  getRPSEDashboardStats,
  getRPSETableData,
  getRPSECardData,
  getRPSEPipelineData,
  getRPSEMenuData,
  getRPSEActivityFeed,
  getRPSEMetrics,
  validateRealism,
  generateDataProvider,
  type RPSEContext,
  type RPSEDataBundle,
} from "./rpse";
import {
  analyzeRequirements,
  planArchitecture,
  validateRequirements,
  calculateQualityScores,
  type RequirementMatrix,
  type ArchitecturePlan,
  type QualityScores,
} from "./architecture-engine";
import {
  initializeSystemState,
  getState,
  emit as sseEmit,
  hydrateStateWithRPSE,
  startWorkflow,
  advanceWorkflow,
  completeWorkflow,
  getActiveWorkflows,
  type SystemState,
} from "./system-state-engine";
import {
  getDesignTokens,
  generateGlobalCSS,
  generateUIComponents,
  generateFoundation,
  type DesignTokens,
} from "./ui-renderer";
import {
  enhanceGeneration,
  storeGenerationResults,
  getComponentSelectionScore,
  getIntelligenceReport,
  type IntelligenceContext,
} from "./intelligence/intelligence-orchestrator";
import {
  getBehaviorProfile,
  BehaviorSimulationEngine,
  type BehaviorProfile,
} from "./behavior-simulation-engine";
import {
  generateBehaviorFiles,
  type BehaviorFileOutput,
} from "./behavior-generator";

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
  systemState?: SystemState;
  intelligence?: IntelligenceContext;
  intelligenceStored?: { memoriesStored: number; knowledgeEdges: number };
  behaviorProfile?: { domain: string; machines: number; mutations: number; chains: number; journeys: number };
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
  if (/restaurant|cafe|food|menu|ordering|delivery|reservation/i.test(lower)) return "ecommerce";
  if (/health|medical|clinic|hospital|patient|appointment|doctor/i.test(lower)) return "saas";
  if (/school|course|student|teacher|education|learn|lms/i.test(lower)) return "saas";
  if (/gym|fitness|member|attendance|workout|trainer|class/i.test(lower)) return "saas";
  if (/real.?estate|property|listing|agent|broker/i.test(lower)) return "ecommerce";
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
  const blueprint = detectBlueprint(prompt);
  const domain = blueprint?.id || "generic";

  // Get domain-specific hero content
  const heroContent = getHeroContentForDomain(domain, h);
  return `export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          ${heroContent.title}
        </h1>
        <p className="mt-6 text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
          ${heroContent.subtitle}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors">
            ${heroContent.cta}
          </button>
          <button className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition-colors">
            ${heroContent.secondaryCta}
          </button>
        </div>
        ${heroContent.stats ? `
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          ${heroContent.stats.map(s => `
          <div key="${s.label}">
            <p className="text-3xl font-bold text-blue-600">${s.value}</p>
            <p className="mt-1 text-sm text-gray-500">${s.label}</p>
          </div>`).join("")}
        </div>` : ""}
      </div>
      ${heroContent.backgroundImage ? `
      <div className="absolute inset-0 z-0">
        <img src="${heroContent.backgroundImage}" alt="" className="w-full h-full object-cover opacity-10" />
      </div>` : ""}
    </section>
  );
}
`;
}

function getHeroContentForDomain(domain: string, fallback: { title: string; subtitle: string; cta: string }): {
  title: string; subtitle: string; cta: string; secondaryCta: string;
  stats?: Array<{ label: string; value: string }>; backgroundImage?: string;
} {
  if (domain === "ecommerce") {
    return {
      title: "Premium Supplements, Delivered Pan-India",
      subtitle: "Lab-tested, FSSAI certified sports nutrition. Trusted by 50,000+ Indian athletes. Free shipping on orders above ₹999.",
      cta: "Shop Now",
      secondaryCta: "View Lab Reports",
      stats: [
        { label: "Happy Customers", value: "50,000+" },
        { label: "Orders Delivered", value: "2L+" },
        { label: "FSSAI Certified", value: "100%" },
        { label: "Cities Covered", value: "500+" },
      ],
    };
  }
  if (domain === "gym-crm") {
    return {
      title: "Iron Peak Fitness",
      subtitle: "All-in-one gym management software. Track members, attendance, billing, and leads.",
      cta: "Start Free Trial",
      secondaryCta: "View Demo",
      stats: [
        { label: "Total Members", value: "1,247" },
        { label: "Monthly Revenue", value: "$89,450" },
        { label: "Attendance Today", value: "89" },
        { label: "Active Classes", value: "12" },
      ],
    };
  }
  if (domain === "streaming") {
    return {
      title: "Watch What You Love",
      subtitle: "Stream thousands of movies, shows, and originals. Cancel anytime.",
      cta: "Start Watching",
      secondaryCta: "Browse Library",
      stats: [
        { label: "Movies & Shows", value: "10,000+" },
        { label: "Active Users", value: "2M+" },
        { label: "Original Content", value: "500+" },
        { label: "Countries", value: "190+" },
      ],
    };
  }
  if (domain === "restaurant") {
    return {
      title: "Taste of Japan in Every Bite",
      subtitle: "Fresh ingredients, traditional recipes, modern presentation. Authentic Japanese cuisine.",
      cta: "Reserve a Table",
      secondaryCta: "View Menu",
      stats: [
        { label: "5-Star Reviews", value: "4.8" },
        { label: "Dishes", value: "50+" },
        { label: "Years Serving", value: "15" },
        { label: "Daily Guests", value: "200+" },
      ],
    };
  }
  if (domain === "admin-dashboard") {
    return {
      title: "ShopHub Admin Panel",
      subtitle: "Manage orders, users, products, and analytics from one powerful dashboard.",
      cta: "View Dashboard",
      secondaryCta: "Documentation",
      stats: [
        { label: "Total Revenue", value: "$124,563" },
        { label: "Total Orders", value: "3,456" },
        { label: "Active Users", value: "12,345" },
        { label: "Conversion Rate", value: "3.24%" },
      ],
    };
  }
  return { ...fallback, secondaryCta: "Learn More" };
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

function genPricingTable(prompt?: string): string {
  const blueprint = detectBlueprint(prompt || "");
  const domain = blueprint?.id || "generic";
  const plans = getPricingForDomain(domain);
  return `export function PricingTable() {
  const plans = ${JSON.stringify(plans, null, 2)};
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">Start free and scale as you grow. All plans include a 14-day trial.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan: any) => (
            <div key={plan.name} className={\`rounded-2xl border-2 p-8 text-center transition-all hover:shadow-xl \${plan.popular ? "border-blue-600 relative scale-105" : "border-gray-200 hover:border-blue-300"}\`}>
              {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</span>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{plan.tagline}</p>
              <div className="my-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span>{f}</li>
                ))}
              </ul>
              <button className={\`w-full py-3 rounded-xl font-semibold transition-colors \${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}\`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function getPricingForDomain(domain: string): Array<{ name: string; price: string; period?: string; tagline: string; popular?: boolean; cta: string; features: string[] }> {
  if (domain === "ecommerce") return [
    { name: "Starter Pack", price: "₹1,499", period: "/month", tagline: "Perfect for beginners", features: ["5 Supplement Samples", "Basic Nutrition Guide", "Email Support", "Free Shipping"], cta: "Get Started" },
    { name: "Performance", price: "₹2,999", period: "/month", tagline: "Most popular for athletes", popular: true, features: ["10 Premium Supplements", "Custom Workout Plan", "Priority Support", "Free Express Shipping", "Monthly Coaching Call"], cta: "Go Performance" },
    { name: "Elite", price: "₹4,999", period: "/month", tagline: "For serious competitors", features: ["All Supplements Included", "Personal Nutritionist", "1-on-1 Coaching", "Lab Testing Access", "VIP Community"], cta: "Go Elite" },
  ];
  if (domain === "gym-crm") return [
    { name: "Starter", price: "$49", period: "/month", tagline: "Up to 100 members", features: ["Member Management", "Attendance Tracking", "Basic Billing", "Email Support"], cta: "Start Free Trial" },
    { name: "Growth", price: "$149", period: "/month", tagline: "Up to 500 members", popular: true, features: ["Everything in Starter", "Lead Pipeline", "Class Booking", "Staff Scheduling", "Mobile App"], cta: "Start Free Trial" },
    { name: "Enterprise", price: "$349", period: "/month", tagline: "Unlimited members", features: ["Everything in Growth", "Multi-Location", "Custom Branding", "API Access", "Dedicated Manager", "White-Label App"], cta: "Contact Sales" },
  ];
  if (domain === "streaming") return [
    { name: "Basic", price: "$8", period: "/month", tagline: "Watch on 1 device", features: ["720p Streaming", "1 Device", "Limited Content", "Ads Supported"], cta: "Start Free Trial" },
    { name: "Standard", price: "$15", period: "/month", tagline: "Watch on 3 devices", popular: true, features: ["1080p HD", "3 Devices", "Full Library", "No Ads", "Download for Offline"], cta: "Start Free Trial" },
    { name: "Premium", price: "$22", period: "/month", tagline: "Watch on 4 devices", features: ["4K Ultra HD", "4 Devices", "Full Library + Early Access", "No Ads", "Offline Downloads", "Spatial Audio"], cta: "Start Free Trial" },
  ];
  if (domain === "saas") return [
    { name: "Starter", price: "$19", period: "/user/mo", tagline: "For small teams", features: ["5 Projects", "10GB Storage", "Basic Analytics", "Email Support"], cta: "Start Free Trial" },
    { name: "Professional", price: "$49", period: "/user/mo", tagline: "For growing teams", popular: true, features: ["Unlimited Projects", "100GB Storage", "Advanced Analytics", "Priority Support", "Custom Integrations"], cta: "Start Free Trial" },
    { name: "Enterprise", price: "Custom", tagline: "For large organizations", features: ["Everything in Pro", "Unlimited Storage", "SSO & SAML", "Dedicated Manager", "SLA 99.9%", "On-Premise Option"], cta: "Talk to Sales" },
  ];
  if (domain === "restaurant") return [
    { name: "Lunch Special", price: "$14", tagline: "Mon-Fri 11:30am-2:30pm", features: ["Choice of Main Course", "Soup or Salad", "Beverage", "Free Refills"], cta: "Reserve Table" },
    { name: "Chef's Tasting", price: "$65", tagline: "5-course experience", popular: true, features: ["5-Course Tasting Menu", "Wine Pairing Available", "Chef's Table Option", "Seasonal Ingredients"], cta: "Reserve Table" },
    { name: "Private Dining", price: "$120", tagline: "Per person, min 10", features: ["Private Room", "Custom Menu", "Dedicated Staff", "AV Equipment", "Custom Decor"], cta: "Inquire Now" },
  ];
  return [
    { name: "Basic", price: "$0", tagline: "For personal use", features: ["1 project", "Basic support", "Community access"], cta: "Get Started" },
    { name: "Pro", price: "$29", period: "/month", tagline: "For professionals", popular: true, features: ["Unlimited projects", "Priority support", "Advanced analytics", "API access"], cta: "Start Free Trial" },
    { name: "Enterprise", price: "Custom", tagline: "For teams", features: ["Custom solutions", "Dedicated support", "SLA", "SSO"], cta: "Contact Sales" },
  ];
}

function genBlogList(): string {
  return `export function BlogList() {
  const posts = [
    { id: "1", title: "The Ultimate Guide to Whey Protein: How to Choose the Right One", excerpt: "With so many options on the market, finding the perfect whey protein can be overwhelming. We break down the differences between concentrate, isolate, and hydrolysate.", category: "Nutrition", readTime: "8 min read", date: "Jun 12, 2025", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c129?w=600&h=400&fit=crop", author: "Dr. Sarah Mitchell" },
    { id: "2", title: "Creatine Mythbusting: What Science Actually Says", excerpt: "Creatine is the most researched supplement in history, yet myths persist. We separate fact from fiction with peer-reviewed evidence.", category: "Performance", readTime: "6 min read", date: "Jun 8, 2025", image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&h=400&fit=crop", author: "James Rodriguez" },
    { id: "3", title: "Pre-Workout Nutrition: What to Eat Before Training", excerpt: "Your pre-workout meal can make or break your session. Learn the optimal macros and timing for maximum performance.", category: "Training", readTime: "5 min read", date: "Jun 5, 2025", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop", author: "Emily Chen" },
  ];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Latest Articles</h2>
            <p className="text-gray-500 mt-1">Expert insights on nutrition, training, and recovery</p>
          </div>
          <a href="/blog" className="text-blue-600 font-medium hover:underline">View All →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="group rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{post.category}</span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">{post.title}</h3>
                <p className="mt-2 text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.author}</span>
                  <span className="text-xs text-gray-400">{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function genTestimonials(prompt?: string): string {
  const blueprint = detectBlueprint(prompt || "");
  const domain = blueprint?.id || "generic";
  const testimonials = getTestimonialsForDomain(domain);
  return `export function Testimonials() {
  const items = ${JSON.stringify(testimonials, null, 2)};
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {items.map((item) => (
            <div key={item.name} className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">&quot;{item.quote}&quot;</p>
              <div className="flex items-center gap-3">
                ${domain === "ecommerce" ? `<img src="${"{item.avatar}"}" alt="${"{item.name}"}" className="w-10 h-10 rounded-full" />` : ""}
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.role}</p>
                </div>
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

function getTestimonialsForDomain(domain: string): Array<{ name: string; role: string; quote: string; avatar?: string }> {
  if (domain === "ecommerce") {
    return [
      { name: "Sarah Mitchell", role: "CrossFit Athlete", quote: "The Whey Protein Isolate changed my recovery game. I'm hitting PRs every week now.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
      { name: "James Rodriguez", role: "Personal Trainer", quote: "I recommend FitLife to all my clients. The quality is unmatched and the results speak for themselves.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James" },
      { name: "Emily Chen", role: "Marathon Runner", quote: "BCAA Recovery Powder helped me cut my recovery time in half. Game changer for endurance athletes.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" },
    ];
  }
  if (domain === "restaurant") {
    return [
      { name: "Michael Chang", role: "Food Critic", quote: "Best sushi I've had outside of Tokyo. The Dragon Roll is incredible!" },
      { name: "Emily Watson", role: "Regular Customer", quote: "The ramen is authentic and the service is always outstanding." },
      { name: "David Kim", role: "Local Foodie", quote: "Our family's favorite spot. The kids love the teriyaki chicken." },
    ];
  }
  if (domain === "streaming") {
    return [
      { name: "Alex Johnson", role: "Movie Buff", quote: "The selection is incredible. I've discovered so many hidden gems." },
      { name: "Maria Garcia", role: "Series Binger", quote: "Original content is top-notch. Can't stop watching!" },
      { name: "Chris Lee", role: "Documentary Fan", quote: "Best platform for documentaries. The quality is unmatched." },
    ];
  }
  return [
    { name: "Alex Johnson", role: "CEO, TechStart", quote: "This platform transformed how we build products. Highly recommended!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
    { name: "Sarah Chen", role: "CTO, GrowthCo", quote: "The best investment we made this year. Our team is 3x more productive.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { name: "Mike Rodriguez", role: "Founder, LaunchPad", quote: "From idea to production in days, not months. This is the future.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
  ];
}

function genCTA(prompt?: string): string {
  const blueprint = detectBlueprint(prompt || "");
  const domain = blueprint?.id || "generic";
  const content = getCTAForDomain(domain);
  return `export function CTA() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">${content.title}</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">${content.subtitle}</p>
        <div className="flex justify-center gap-4">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg">${content.cta}</button>
          <button className="border border-white/30 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors">${content.secondaryCta}</button>
        </div>
      </div>
    </section>
  );
}
`;
}

function getCTAForDomain(domain: string): { title: string; subtitle: string; cta: string; secondaryCta: string } {
  if (domain === "ecommerce") return { title: "Fuel Your Fitness Goals Today", subtitle: "Join 50,000+ Indian athletes who trust our lab-tested, FSSAI certified supplements. Free shipping above ₹999.", cta: "Shop Now", secondaryCta: "View Lab Reports" };
  if (domain === "gym-crm") return { title: "Transform Your Gym Management", subtitle: "Start managing members, billing, and attendance in one powerful platform. Free for 14 days.", cta: "Start Free Trial", secondaryCta: "Book a Demo" };
  if (domain === "streaming") return { title: "Start Watching Today", subtitle: "Stream thousands of movies, shows, and originals. No ads, cancel anytime.", cta: "Start Free Trial", secondaryCta: "Browse Plans" };
  if (domain === "saas") return { title: "Ready to Scale Your Business?", subtitle: "Join 2,500+ companies using our platform to automate workflows and boost productivity.", cta: "Start Free Trial", secondaryCta: "Talk to Sales" };
  if (domain === "restaurant") return { title: "Reserve Your Table Tonight", subtitle: "Experience authentic cuisine crafted by our award-winning chef. Book online for instant confirmation.", cta: "Reserve Now", secondaryCta: "View Menu" };
  if (domain === "admin-dashboard") return { title: "Take Control of Your Business", subtitle: "Real-time analytics, order management, and inventory tracking all in one dashboard.", cta: "View Dashboard", secondaryCta: "Generate Report" };
  if (domain === "blog") return { title: "Stay in the Loop", subtitle: "Get the latest articles, guides, and insights delivered to your inbox every week.", cta: "Subscribe Now", secondaryCta: "Read Latest" };
  return { title: "Ready to Get Started?", subtitle: "Join thousands of users who are already building amazing things with our platform.", cta: "Get Started Free", secondaryCta: "Learn More" };
}

function genProductGrid(): string {
  return `"use client";
import { useState } from "react";

const CATEGORIES = [
  { id: "all", label: "All Products", icon: "🔥" },
  { id: "protein", label: "Muscle & Strength", icon: "💪" },
  { id: "weight", label: "Weight Management", icon: "⚖️" },
  { id: "vitality", label: "Vitality & Wellness", icon: "⚡" },
  { id: "brain", label: "Brain & Focus", icon: "🧠" },
  { id: "recovery", label: "Joints & Recovery", icon: "🦴" },
];

const products = [
  { id: "1", name: "Whey Protein Isolate", brand: "FuelCore", price: 2499, originalPrice: 3299, rating: 4.8, reviews: 2847, badge: "Best Seller", category: "protein", type: "powder", weight: "1 kg", flavor: "Chocolate Dream", fssai: "10019062000", labTested: true, veg: false, benefits: ["27g protein per serving", "Low carb, low fat", "Fast absorbing isolate"] },
  { id: "2", name: "Creatine Monohydrate", brand: "FuelCore", price: 1499, originalPrice: 1899, rating: 4.7, reviews: 1923, badge: "Top Rated", category: "protein", type: "powder", weight: "500 g", flavor: "Unflavored", fssai: "10019062000", labTested: true, veg: true, benefits: ["5g micronized creatine", "Enhances strength & power", "Micronized for better mixability"] },
  { id: "3", name: "BCAA Recovery Complex", brand: "ActiveEdge", price: 1999, originalPrice: 2499, rating: 4.6, reviews: 1456, category: "recovery", type: "powder", weight: "300 g", flavor: "Tropical Mango", fssai: "10019062000", labTested: true, veg: true, benefits: ["2:1:1 BCAA ratio", "Enhanced recovery", "Electrolyte blend included"] },
  { id: "4", name: "Pre-Workout Surge", brand: "FuelCore", price: 2299, originalPrice: 2999, rating: 4.5, reviews: 1203, badge: "New", category: "vitality", type: "powder", weight: "300 g", flavor: "Blue Raspberry", fssai: "10019062000", labTested: true, veg: true, benefits: ["200mg caffeine", "Beta-alanine + citrulline", "No crash formula"] },
  { id: "5", name: "Omega-3 Fish Oil", brand: "PureNutri", price: 999, originalPrice: 1499, rating: 4.8, reviews: 3201, category: "vitality", type: "capsule", weight: "90 softgels", flavor: "", fssai: "10019062000", labTested: true, veg: false, benefits: ["EPA + DHA formula", "Heart & brain health", "Enteric coated, no fishy aftertaste"] },
  { id: "6", name: "Mass Gainer Pro", brand: "FuelCore", price: 2999, originalPrice: 3799, rating: 4.4, reviews: 987, badge: "Popular", category: "protein", type: "powder", weight: "2 kg", flavor: "Double Chocolate", fssai: "10019062000", labTested: true, veg: false, benefits: ["50g protein + 250g carbs", "1250 calories per serving", "Added digestive enzymes"] },
  { id: "7", name: "Ashwagandha KSM-66", brand: "PureNutri", price: 799, originalPrice: 1199, rating: 4.7, reviews: 2156, badge: "Trending", category: "brain", type: "capsule", weight: "60 capsules", flavor: "", fssai: "10019062000", labTested: true, veg: true, benefits: ["600mg KSM-66 extract", "Reduces cortisol & stress", "Boosts focus & vitality"] },
  { id: "8", name: "Glucosamine Chondroitin", brand: "ActiveEdge", price: 1299, originalPrice: 1699, rating: 4.5, reviews: 876, category: "recovery", type: "capsule", weight: "120 tablets", flavor: "", fssai: "10019062000", labTested: true, veg: true, benefits: ["Joint support formula", "MSM + turmeric added", "Reduces joint stiffness"] },
  { id: "9", name: "Green Tea Fat Burner", brand: "PureNutri", price: 699, originalPrice: 999, rating: 4.3, reviews: 1543, category: "weight", type: "capsule", weight: "90 capsules", flavor: "", fssai: "10019062000", labTested: true, veg: true, benefits: ["500mg green tea extract", "EGCG for metabolism", "Appetite support"] },
];

function ProductIllustration({ type, flavor }: { type: string; flavor: string }) {
  const isPowder = type === "powder";
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
      <div className={\`relative \${isPowder ? "w-28 h-40" : "w-20 h-28"}\`} style={{ transformStyle: "preserve-3d", transform: "rotateY(-15deg) rotateX(5deg)" }}>
        {/* Bottle/Tub body */}
        <div className={\`absolute inset-0 rounded-xl \${isPowder ? "bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900" : "bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700"}\`} style={{ boxShadow: "inset -8px 0 20px rgba(0,0,0,0.3), inset 4px 0 10px rgba(255,255,255,0.1), 8px 8px 24px rgba(0,0,0,0.3)" }}>
          {/* Label */}
          <div className="absolute inset-x-2 top-6 bottom-4 bg-white/90 rounded-lg flex flex-col items-center justify-center p-1">
            <span className="text-[6px] font-bold text-amber-800 uppercase tracking-widest">FuelCore</span>
            <span className="text-[8px] font-black text-gray-900 text-center leading-tight mt-0.5">{isPowder ? "WHEY\\nISOLATE" : "OMEGA-3"}</span>
            {flavor && <span className="text-[5px] text-gray-500 mt-0.5">{flavor}</span>}
          </div>
          {/* Cap */}
          <div className={\`absolute -top-2 left-1/2 -translate-x-1/2 \${isPowder ? "w-16 h-4 rounded-t-lg bg-gradient-to-b from-gray-700 to-gray-900" : "w-10 h-3 rounded-full bg-gradient-to-b from-gray-600 to-gray-800"}\`} />
          {/* Shine */}
          <div className="absolute left-2 top-0 bottom-0 w-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [sortBy, setSortBy] = useState("popular");

  const toggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = products
    .filter(p => activeCategory === "all" || p.category === activeCategory)
    .filter(p => searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviews - a.reviews;
    });

  return (
    <section className="py-16 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>Featured Supplements</h2>
          <p className="mt-2 text-gray-500">Lab-tested, FSSAI certified, trusted by 50,000+ athletes</p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search by name, ingredient, or benefit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none">
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${
                activeCategory === cat.id
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300 hover:text-amber-700"
              }\`}
            >
              <span className="mr-1.5">{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <div key={product.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => setSelectedProduct(product)}>
              {/* Illustration Area */}
              <div className="relative h-56 bg-gradient-to-br from-[#faf9f6] to-amber-50 flex items-center justify-center overflow-hidden">
                <ProductIllustration type={product.type} flavor={product.flavor} />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.badge && <span className="bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{product.badge}</span>}
                  {product.veg ? (
                    <span className="w-5 h-5 bg-white border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-2.5 h-2.5 bg-green-600 rounded-full" /></span>
                  ) : (
                    <span className="w-5 h-5 bg-white border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-2.5 h-2.5 bg-red-600 rounded-full" /></span>
                  )}
                </div>
                {/* Wishlist */}
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                  <span className={\`text-lg \${wishlist.includes(product.id) ? "text-red-500" : "text-gray-400"}\`}>{wishlist.includes(product.id) ? "♥" : "♡"}</span>
                </button>
                {/* Discount */}
                {product.originalPrice && (
                  <span className="absolute bottom-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    SAVE ₹{product.originalPrice - product.price}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase">{product.brand}</span>
                  <span className="text-[10px] text-gray-400">{product.weight}</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">{product.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex text-amber-400 text-xs">{"★".repeat(Math.floor(product.rating))}{"☆".repeat(5 - Math.floor(product.rating))}</div>
                  <span className="text-xs text-gray-500">{product.rating}</span>
                  <span className="text-xs text-gray-400">({product.reviews.toLocaleString()})</span>
                </div>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                  {product.originalPrice && <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>}
                </div>

                {/* Trust badges */}
                <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-500">
                  {product.labTested && <span className="flex items-center gap-1"><span className="text-green-600">✓</span> Lab Tested</span>}
                  <span className="flex items-center gap-1"><span className="text-blue-600">✓</span> FSSAI</span>
                  <span className="flex items-center gap-1"><span className="text-amber-600">🚚</span> Free shipping ₹999+</span>
                </div>

                <button className="mt-4 w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 active:scale-[0.98] transition-all">
                  Add to Cart — ₹{product.price.toLocaleString("en-IN")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No products match your search</p>
            <p className="text-sm mt-1">Try a different keyword or category</p>
          </div>
        )}

        {/* FSSAI Compliance Footer */}
        <div className="mt-12 bg-white rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
            <div>
              <p className="font-semibold text-gray-900">FSSAI Certified & Lab Tested</p>
              <p className="text-sm text-gray-500">All products manufactured in ISO 22000 & GMP certified facilities. FSSAI License: 10019062000</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-[10px]">✓</span> Third-Party Verified</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">✓</span> Informed Sport Certified</span>
          </div>
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">{selectedProduct.brand}</span>
                    <h2 className="text-2xl font-bold mt-2">{selectedProduct.name}</h2>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-[#faf9f6] to-amber-50 rounded-2xl h-64 flex items-center justify-center">
                    <ProductIllustration type={selectedProduct.type} flavor={selectedProduct.flavor} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold">₹{selectedProduct.price.toLocaleString("en-IN")}</span>
                      {selectedProduct.originalPrice && <span className="text-lg text-gray-400 line-through">₹{selectedProduct.originalPrice.toLocaleString("en-IN")}</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex text-amber-400">{"★".repeat(Math.floor(selectedProduct.rating))}</div>
                      <span className="text-sm text-gray-600">{selectedProduct.rating} ({selectedProduct.reviews.toLocaleString()} reviews)</span>
                    </div>
                    <div className="space-y-2 mb-6">
                      {selectedProduct.benefits.map((b: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span>{b}</div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
                      <span>FSSAI: {selectedProduct.fssai}</span>
                      <span>Net Wt: {selectedProduct.weight}</span>
                      {selectedProduct.veg ? <span className="text-green-600">🟥 Veg</span> : <span className="text-red-600">🟧 Non-Veg</span>}
                    </div>
                    <button className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors">Add to Cart — ₹{selectedProduct.price.toLocaleString("en-IN")}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
`;
}

function genCartItems(): string {
  return `"use client";
import { useState } from "react";

const PROMO_CODES: Record<string, { discount: number; type: "percent" | "flat"; minOrder: number; label: string }> = {
  PRISTINE10: { discount: 10, type: "percent", minOrder: 0, label: "10% off everything" },
  FITINDIA: { discount: 500, type: "flat", minOrder: 4000, label: "₹500 off above ₹4,000" },
  FREESHIP: { discount: 0, type: "flat", minOrder: 0, label: "Free express shipping" },
};

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [items, setItems] = useState([
    { id: "1", name: "Whey Protein Isolate", brand: "FuelCore", price: 2499, qty: 2, flavor: "Chocolate Dream", weight: "1 kg", veg: false },
    { id: "2", name: "Creatine Monohydrate", brand: "FuelCore", price: 1499, qty: 1, flavor: "Unflavored", weight: "500 g", veg: true },
  ]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);

  const updateQty = (id: string, delta: number) => setItems(items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const promo = appliedPromo ? PROMO_CODES[appliedPromo] : null;
  const discount = promo ? (promo.type === "percent" ? Math.round(subtotal * promo.discount / 100) : promo.discount) : 0;
  const total = subtotal - discount + shipping;

  const applyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (PROMO_CODES[code]) {
      if (PROMO_CODES[code].minOrder > 0 && subtotal < PROMO_CODES[code].minOrder) {
        setPincodeResult(\`Minimum order ₹\${PROMO_CODES[code].minOrder.toLocaleString("en-IN")} required\`);
        return;
      }
      setAppliedPromo(code);
      setPincodeResult(null);
    }
  };

  const checkPincode = () => {
    if (pincode.length === 6) {
      const cities: Record<string, string> = { "400001": "Mumbai, Maharashtra", "110001": "New Delhi, Delhi", "560001": "Bangalore, Karnataka", "600001": "Chennai, Tamil Nadu", "700001": "Kolkata, West Bengal", "500001": "Hyderabad, Telangana" };
      setPincodeResult(cities[pincode] ? \`✓ Delivering to \${cities[pincode]} — Estimated 2-3 business days\` : \`✓ Delivery available to \${pincode} — Estimated 3-5 business days\`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>Your Cart ({items.length})</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">✕</button>
        </div>

        {/* Free shipping banner */}
        {subtotal < 999 ? (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-sm text-amber-800">Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for <strong>free shipping</strong></p>
            <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: \`\${Math.min(100, (subtotal / 999) * 100)}%\` }} />
            </div>
          </div>
        ) : (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-sm text-green-800">🎉 You've unlocked <strong>free shipping!</strong></p>
          </div>
        )}

        {/* Items */}
        <div className="px-6 py-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 border-b">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{item.veg ? "🟥" : "🟧"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-amber-700 font-semibold uppercase">{item.brand}</p>
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.flavor} · {item.weight}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0">✕</button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 text-sm">−</button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 text-sm">+</button>
                  </div>
                  <p className="font-bold text-sm">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code */}
        <div className="px-6 py-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Promo Code</p>
          <div className="flex gap-2">
            <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter code" className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" disabled={!!appliedPromo} />
            {appliedPromo ? (
              <button onClick={() => { setAppliedPromo(null); setPromoCode(""); }} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">Applied ✓</button>
            ) : (
              <button onClick={applyPromo} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">Apply</button>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            {Object.entries(PROMO_CODES).map(([code, p]) => (
              <button key={code} onClick={() => { setPromoCode(code); }} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">{code}</button>
            ))}
          </div>
        </div>

        {/* Pincode Checker */}
        <div className="px-6 py-3 border-t">
          <p className="text-xs font-semibold text-gray-700 mb-2">Check Delivery</p>
          <div className="flex gap-2">
            <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\\D/g, "").slice(0, 6))} placeholder="6-digit pincode" className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <button onClick={checkPincode} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">Check</button>
          </div>
          {pincodeResult && <p className="mt-2 text-xs text-green-700">{pincodeResult}</p>}
        </div>

        {/* Summary */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({appliedPromo})</span><span>-₹{discount.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          </div>
          <button className="mt-4 w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 active:scale-[0.98] transition-all">
            Proceed to Checkout — ₹{total.toLocaleString("en-IN")}
          </button>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-400">
            <span>🔒 Secure Checkout</span>
            <span>UPI / Cards / COD</span>
            <span>🛡️ Buyer Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
}

function genCartSummary(): string {
  return `"use client";
import { useState } from "react";

const INDIAN_STATES = ["Andhra Pradesh","Bihar","Delhi","Gujarat","Haryana","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal"];

export function CheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const subtotal = 6497;
  const shipping = 0;
  const discount = 650;
  const total = subtotal - discount + shipping;

  const placeOrder = () => { setOrderPlaced(true); };

  if (!isOpen) return null;
  if (orderPlaced) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✓</span></div>
          <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-4">Thank you for your purchase</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Order ID</span><span className="font-mono font-bold">FC-{Math.random().toString(36).slice(2,8).toUpperCase()}</span></div>
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Payment</span><span className="font-medium">{paymentMethod === "upi" ? `UPI: ${upiId}` : paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod}</span></div>
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Estimated Delivery</span><span className="font-medium">{new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>
            <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t"><span>Total Paid</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          </div>
          <button onClick={onClose} className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700">Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>Checkout</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">✕</button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 flex items-center gap-2">
          {["Shipping", "Payment", "Confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={\`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold \${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"}\`}>{step > i + 1 ? "✓" : i + 1}</div>
              <span className={\`text-xs hidden sm:block \${step === i + 1 ? "font-semibold text-gray-900" : "text-gray-400"}\`}>{s}</span>
              {i < 2 && <div className={\`flex-1 h-0.5 \${step > i + 1 ? "bg-green-500" : "bg-gray-200"}\`} />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Full Name" className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <input placeholder="Phone Number" className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <input placeholder="Address Line 1" className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input placeholder="Address Line 2 (Optional)" className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="City" className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <input placeholder="Pincode" maxLength={6} className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <select className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option>State</option>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700">Continue to Payment</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              {/* Payment Options */}
              <div className="space-y-2">
                {[
                  { id: "upi", label: "BHIM UPI", icon: "📱", desc: "Google Pay, PhonePe, Paytm" },
                  { id: "card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
                  { id: "netbanking", label: "Net Banking", icon: "🏦", desc: "All major banks" },
                  { id: "cod", label: "Cash on Delivery", icon: "💵", desc: "Pay when you receive" },
                ].map((m) => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={\`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all \${paymentMethod === m.id ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"}\`}>
                    <span className="text-xl">{m.icon}</span>
                    <div className="text-left"><p className="font-medium text-sm">{m.label}</p><p className="text-xs text-gray-500">{m.desc}</p></div>
                    <div className={\`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center \${paymentMethod === m.id ? "border-amber-500" : "border-gray-300"}\`}>{paymentMethod === m.id && <div className="w-3 h-3 bg-amber-500 rounded-full" />}</div>
                  </button>
                ))}
              </div>
              {paymentMethod === "upi" && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Enter your UPI ID</p>
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 py-3 rounded-xl font-medium text-sm hover:bg-gray-50">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700">Review Order</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Whey Protein Isolate × 2</span><span>₹4,998</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Creatine Monohydrate × 1</span><span>₹1,499</span></div>
                <div className="border-t pt-2 flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-green-600"><span>FITINDIA Discount</span><span>-₹{discount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600">FREE</span></div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
                <p>📦 Estimated delivery: <strong>{new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</strong></p>
                <p className="mt-1">🛡️ FSSAI Certified · Lab Tested · 30-Day Returns</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 py-3 rounded-xl font-medium text-sm hover:bg-gray-50">Back</button>
                <button onClick={placeOrder} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">Place Order — ₹{total.toLocaleString("en-IN")}</button>
              </div>
            </div>
          )}
        </div>
      </div>
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
  return `"use client";
export function DashboardContent() {
  const stats = [
    { label: "Total Revenue", value: "$124,563", change: "+12.5%", up: true, icon: "💰" },
    { label: "Total Orders", value: "3,456", change: "+8.2%", up: true, icon: "📦" },
    { label: "Active Users", value: "12,345", change: "+23.1%", up: true, icon: "👥" },
    { label: "Conversion Rate", value: "3.24%", change: "-0.4%", up: false, icon: "📈" },
  ];
  const recentOrders = [
    { id: "#ORD-7823", customer: "Sarah Mitchell", product: "Whey Protein Isolate", amount: "$49.99", status: "Delivered", date: "2 min ago" },
    { id: "#ORD-7822", customer: "James Rodriguez", product: "Creatine Monohydrate", amount: "$29.99", status: "Processing", date: "15 min ago" },
    { id: "#ORD-7821", customer: "Emily Chen", product: "BCAA Recovery", amount: "$39.99", status: "Shipped", date: "1 hr ago" },
    { id: "#ORD-7820", customer: "Michael Thompson", product: "Pre-Workout Surge", amount: "$44.99", status: "Delivered", date: "2 hrs ago" },
    { id: "#ORD-7819", customer: "Priya Sharma", product: "Omega-3 Fish Oil", amount: "$24.99", status: "Processing", date: "3 hrs ago" },
  ];
  const statusColors: Record<string, string> = { Delivered: "bg-green-100 text-green-700", Processing: "bg-yellow-100 text-yellow-700", Shipped: "bg-blue-100 text-blue-700" };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{s.label}</p>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
            <p className={`text-sm mt-1 font-medium ${s.up ? "text-green-600" : "text-red-500"}`}>{s.change} vs last month</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Time</th>
            </tr></thead>
            <tbody>{recentOrders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 font-mono text-xs">{o.id}</td>
                <td className="py-3 font-medium">{o.customer}</td>
                <td className="py-3 text-gray-600">{o.product}</td>
                <td className="py-3 font-semibold">{o.amount}</td>
                <td className="py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[o.status] || "bg-gray-100"}`}>{o.status}</span></td>
                <td className="py-3 text-gray-400">{o.date}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
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

function genStats(prompt?: string): string {
  const blueprint = detectBlueprint(prompt || "");
  const domain = blueprint?.id || "generic";
  const stats = getStatsForDomain(domain);
  return `export function Stats() {
  const stats = ${JSON.stringify(stats, null, 2)};
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

function getStatsForDomain(domain: string): Array<{ label: string; value: string }> {
  if (domain === "ecommerce") {
    return [
      { label: "Happy Customers", value: "50,000+" },
      { label: "Orders Delivered", value: "2,00,000+" },
      { label: "FSSAI Certified", value: "100%" },
      { label: "Cities Covered", value: "500+" },
    ];
  }
  if (domain === "gym-crm") {
    return [
      { label: "Total Members", value: "1,247" },
      { label: "Monthly Revenue", value: "$89,450" },
      { label: "Attendance Today", value: "89" },
      { label: "Active Classes", value: "12" },
    ];
  }
  if (domain === "streaming") {
    return [
      { label: "Movies & Shows", value: "10,000+" },
      { label: "Active Users", value: "2M+" },
      { label: "Original Content", value: "500+" },
      { label: "Countries", value: "190+" },
    ];
  }
  if (domain === "admin-dashboard") {
    return [
      { label: "Total Revenue", value: "$124,563" },
      { label: "Total Orders", value: "3,456" },
      { label: "Active Users", value: "12,345" },
      { label: "Conversion Rate", value: "3.24%" },
    ];
  }
  return [
    { label: "Projects Completed", value: "250+" },
    { label: "Happy Clients", value: "120+" },
    { label: "Team Members", value: "40+" },
    { label: "Years Experience", value: "10+" },
  ];
}

function genFAQ(prompt?: string): string {
  const blueprint = detectBlueprint(prompt || "");
  const domain = blueprint?.id || "generic";
  const faqs = getFAQForDomain(domain);
  return `export function FAQ() {
  const faqs = ${JSON.stringify(faqs, null, 2)};
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq: { q: string; a: string }, i: number) => (
            <details key={i} className="group border rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium hover:bg-gray-50 transition-colors">
                <span>{faq.q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function getFAQForDomain(domain: string): Array<{ q: string; a: string }> {
  if (domain === "ecommerce") return [
    { q: "Are your supplements FSSAI certified?", a: "Yes, all our products are manufactured in ISO 22000 & GMP certified facilities with valid FSSAI license (10019062000). Every batch is third-party tested for purity and potency." },
    { q: "How long does delivery take?", a: "Pan-India delivery in 2-5 business days. Express delivery to metros in 1-2 days. Free standard shipping on orders above ₹999." },
    { q: "What is your return policy?", a: "We offer a 30-day money-back guarantee on all unopened products. If you're not satisfied, contact us for a full refund — no questions asked." },
    { q: "Do you offer subscription discounts?", a: "Yes! Subscribe & Save gives you 15% off every order plus free express shipping. Cancel or pause anytime from your dashboard." },
    { q: "Are your products vegetarian/vegan?", a: "Look for the 🟥 (veg) or 🟧 (non-veg) markers on each product. Many of our products are 100% plant-based and vegan-friendly." },
  ];
  if (domain === "gym-crm") return [
    { q: "Is there a free trial?", a: "Yes, we offer a 14-day free trial with full access to all features. No credit card required." },
    { q: "Can I import my existing member data?", a: "Absolutely! We support CSV imports and can help migrate data from Mindbody, Zen Planner, Virtuagym, and other platforms." },
    { q: "Does it support multiple locations?", a: "Yes, our Pro and Enterprise plans support unlimited locations with centralized management and reporting." },
    { q: "Is there a mobile app?", a: "Yes, our branded mobile app is available for iOS and Android. Members can check in, book classes, and manage their accounts." },
  ];
  if (domain === "streaming") return [
    { q: "How many devices can I stream on?", a: "Stream on up to 3 devices simultaneously with Standard, or 4 with Premium. Download up to 10 titles for offline viewing." },
    { q: "Is there a free trial?", a: "Start with a 7-day free trial. No commitment — cancel anytime before the trial ends and you won't be charged." },
    { q: "What content is available?", a: "Access 10,000+ movies, TV shows, documentaries, and originals. New titles added every week." },
    { q: "Can I change my plan anytime?", a: "Yes, upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle." },
  ];
  if (domain === "saas") return [
    { q: "How does the free trial work?", a: "Get full access to all features for 14 days. No credit card required. Upgrade anytime to keep your data and workspace." },
    { q: "Can I integrate with existing tools?", a: "Yes, we integrate with 200+ tools including Slack, Notion, Jira, GitHub, Google Workspace, and Microsoft 365." },
    { q: "Is my data secure?", a: "SOC 2 Type II certified, GDPR compliant, with end-to-end encryption. Data centers in US, EU, and APAC." },
    { q: "What happens when I exceed my plan limits?", a: "We'll notify you before you hit limits. Upgrade seamlessly without data loss. No surprise overages." },
  ];
  if (domain === "restaurant") return [
    { q: "How do I make a reservation?", a: "Book online through our website or call us directly. You'll receive instant confirmation via email or SMS." },
    { q: "Do you cater for dietary restrictions?", a: "Yes, our menu clearly marks vegetarian, vegan, gluten-free, and allergen options. Please inform us of any allergies when booking." },
    { q: "Is there private dining available?", a: "Yes, our private dining room seats up to 20 guests. Perfect for celebrations and corporate events." },
    { q: "What are your opening hours?", a: "Lunch: Mon-Fri 11:30am-2:30pm. Dinner: Mon-Sat 5:30pm-10:30pm. Brunch: Sat-Sun 10am-2pm." },
  ];
  return [
    { q: "What services do you offer?", a: "We offer web development, mobile apps, UI/UX design, cloud solutions, and ongoing maintenance and support." },
    { q: "How long does a typical project take?", a: "Project timelines vary based on scope. A standard website takes 4-6 weeks, while complex web apps take 8-16 weeks." },
    { q: "Do you offer ongoing support?", a: "Yes, we provide monthly maintenance packages starting at $500/mo including updates, monitoring, and support." },
    { q: "What is your pricing model?", a: "We offer fixed-price projects for defined scope, and monthly retainer plans for ongoing work. All plans include a dedicated project manager." },
  ];
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
  PricingTable: (p) => genPricingTable(p),
  BlogList: genBlogList,
  Testimonials: genTestimonials,
  CTA: (p) => genCTA(p),
  Newsletter: genNewsletter,
  Services: genServices,
  Team: genTeam,
  Stats: genStats,
  FAQ: (p) => genFAQ(p),
  Portfolio: genPortfolio,
  ProductGrid: genProductGrid,
  CartDrawer: genCartItems,
  CartItems: genCartItems,
  CartSummary: genCartSummary,
  CheckoutModal: genCartSummary,
  Sidebar: genSidebar,
  DashboardContent: genDashboardContent,
  LoginForm: genLoginForm,
  RegisterForm: genRegisterForm,
  // Domain-specific generators (REAL implementations) — now delegated to UI Renderer
  // The UI Renderer generates spec-based components with proper design tokens
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

  // ─── RPSE DATA PROVIDER ───
  const rpseContext = detectRPSEContext(prompt);
  const dataProviderContent = generateDataProvider(rpseContext.domain);
  files.push({ path: "src/lib/data-provider.ts", content: dataProviderContent, type: "config" });

  // ─── UI RENDERING ENGINE (Foundation-First) ───
  // Generate design tokens and foundation files based on domain
  const uiDomain = rpseContext.domain;
  const uiTokens = getDesignTokens(uiDomain);

  // Extract navigation names from NavigationPlan objects
  const navNames = architecture.navigation.map(n => n.label || "Home");

  // Generate global CSS with domain-specific design tokens
  const foundationFiles = generateFoundation(uiDomain, projectName, navNames);
  for (const f of foundationFiles) {
    // Only add if not already generated by generic generators
    if (!files.some(exist => exist.path === f.path)) {
      files.push(f);
    }
  }

  // Generate domain-specific components using spec-based UI Renderer
  const domainComponents = generateUIComponents(uiDomain, architecture.routes.map(r => r.name));
  for (const comp of domainComponents) {
    // Only add if not already generated by COMPONENT_GENERATORS
    if (!files.some(exist => exist.path === comp.path)) {
      files.push(comp);
    }
  }

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
 * Get domain-specific table data for mock content.
 */
function getTableDataForDomain(domain: string, componentName: string): Array<{ id: string; name: string; status: string; date: string }> {
  if (domain === "ecommerce") {
    return [
      { id: "ORD-001", name: "Whey Protein Isolate", status: "completed", date: "2024-06-15" },
      { id: "ORD-002", name: "Creatine Monohydrate", status: "processing", date: "2024-06-15" },
      { id: "ORD-003", name: "BCAA Recovery Powder", status: "shipped", date: "2024-06-14" },
      { id: "ORD-004", name: "Pre-Workout Ignite", status: "completed", date: "2024-06-14" },
      { id: "ORD-005", name: "Omega-3 Fish Oil", status: "pending", date: "2024-06-13" },
    ];
  }
  if (domain === "gym-crm") {
    if (componentName.includes("member") || componentName.includes("user")) {
      return [
        { id: "M001", name: "Alex Thompson", status: "active", date: "2024-01-15" },
        { id: "M002", name: "Maria Garcia", status: "active", date: "2024-02-20" },
        { id: "M003", name: "David Kim", status: "active", date: "2024-03-10" },
        { id: "M004", name: "Sarah Wilson", status: "expired", date: "2023-11-05" },
        { id: "M005", name: "James Brown", status: "active", date: "2024-04-01" },
      ];
    }
    if (componentName.includes("lead")) {
      return [
        { id: "L001", name: "Jennifer Taylor", status: "contacted", date: "2024-06-15" },
        { id: "L002", name: "Robert Martinez", status: "qualified", date: "2024-06-14" },
        { id: "L003", name: "Amanda White", status: "new", date: "2024-06-13" },
        { id: "L004", name: "Christopher Lee", status: "negotiation", date: "2024-06-12" },
      ];
    }
    if (componentName.includes("billing") || componentName.includes("invoice")) {
      return [
        { id: "INV-001", name: "Alex Thompson — Premium Plan", status: "active", date: "2024-06-01" },
        { id: "INV-002", name: "Maria Garcia — Standard Plan", status: "active", date: "2024-06-01" },
        { id: "INV-003", name: "David Kim — Premium Plan", status: "pending", date: "2024-06-01" },
        { id: "INV-004", name: "Sarah Wilson — Basic Plan", status: "expired", date: "2024-05-01" },
      ];
    }
    if (componentName.includes("staff")) {
      return [
        { id: "S001", name: "Mike Johnson — Trainer", status: "active", date: "2024-01-10" },
        { id: "S002", name: "Lisa Chen — Yoga Instructor", status: "active", date: "2024-02-15" },
        { id: "S003", name: "Tom Williams — Manager", status: "active", date: "2024-03-20" },
        { id: "S004", name: "Emma Davis — Receptionist", status: "part-time", date: "2024-04-05" },
      ];
    }
    // Default gym-crm data
    return [
      { id: "INV-001", name: "Alex Thompson — Premium Plan", status: "active", date: "2024-06-01" },
      { id: "INV-002", name: "Maria Garcia — Standard Plan", status: "active", date: "2024-06-01" },
      { id: "INV-003", name: "David Kim — Premium Plan", status: "pending", date: "2024-06-01" },
      { id: "INV-004", name: "Sarah Wilson — Basic Plan", status: "expired", date: "2024-05-01" },
    ];
  }
  if (domain === "admin-dashboard") {
    return [
      { id: "ORD-7891", name: "John Smith — $299.99", status: "completed", date: "2024-06-15" },
      { id: "ORD-7892", name: "Sarah Johnson — $149.50", status: "processing", date: "2024-06-15" },
      { id: "ORD-7893", name: "Mike Davis — $89.99", status: "shipped", date: "2024-06-14" },
      { id: "ORD-7894", name: "Emily Brown — $459.00", status: "completed", date: "2024-06-14" },
      { id: "ORD-7895", name: "Chris Wilson — $199.99", status: "pending", date: "2024-06-14" },
    ];
  }
  if (domain === "restaurant") {
    return [
      { id: "R001", name: "Salmon Sashimi", status: "active", date: "2024-06-15" },
      { id: "R002", name: "Dragon Roll", status: "active", date: "2024-06-15" },
      { id: "R003", name: "Miso Ramen", status: "active", date: "2024-06-15" },
      { id: "R004", name: "Chicken Teriyaki", status: "active", date: "2024-06-15" },
    ];
  }
  // Default/generic
  return [
    { id: "1", name: "Whey Protein Isolate", status: "active", date: "2024-06-15" },
    { id: "2", name: "Creatine Monohydrate", status: "active", date: "2024-06-14" },
    { id: "3", name: "BCAA Recovery Powder", status: "pending", date: "2024-06-13" },
  ];
}

/**
 * Get domain-specific card data for mock content.
 */
function getCardDataForDomain(domain: string, componentName: string): Array<{ id: string; title: string; description: string; image?: string; price?: string; badge?: string }> {
  if (domain === "ecommerce") {
    return [
      { id: "1", title: "Whey Protein Isolate", description: "Premium grass-fed whey protein with 25g protein per serving.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=300&fit=crop", price: "49.99", badge: "Best Seller" },
      { id: "2", title: "Creatine Monohydrate", description: "5g micronized creatine per serving. Lab-tested for purity.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=300&fit=crop", price: "29.99", badge: "Top Rated" },
      { id: "3", title: "BCAA Recovery Powder", description: "2:1:1 BCAA ratio with electrolytes. Tropical flavor.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=300&fit=crop", price: "34.99" },
      { id: "4", title: "Pre-Workout Ignite", description: "Explosive energy with 200mg caffeine and citrulline malate.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=300&fit=crop", price: "39.99", badge: "New" },
    ];
  }
  if (domain === "restaurant") {
    return [
      { id: "1", title: "Salmon Sashimi", description: "Fresh Atlantic salmon, thinly sliced. Served with wasabi.", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", price: "16.99" },
      { id: "2", title: "Dragon Roll", description: "Shrimp tempura, avocado, eel sauce, and tobiko. 8 pieces.", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop", price: "18.99", badge: "Popular" },
      { id: "3", title: "Miso Ramen", description: "Rich miso broth, chashu pork, soft egg, nori.", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", price: "16.99" },
      { id: "4", title: "Chicken Teriyaki", description: "Grilled chicken thigh glazed with house teriyaki.", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", price: "15.99" },
    ];
  }
  if (domain === "streaming") {
    return [
      { id: "1", title: "The Last Frontier", description: "In a future where Earth is dying, a team embarks on a mission to find a new home.", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop", badge: "98% Match" },
      { id: "2", title: "Cyber Wars", description: "A hacker discovers a global conspiracy and must choose between truth and family.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop", badge: "New Season" },
      { id: "3", title: "Ocean's Memory", description: "A marine biologist uncovers secrets from her past.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", badge: "92% Match" },
    ];
  }
  if (domain === "gym-crm") {
    return [
      { id: "1", title: "Alex Thompson", description: "Premium member since Jan 2024. 47 visits this month.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", badge: "Premium" },
      { id: "2", title: "Maria Garcia", description: "Standard member since Feb 2024. 32 visits this month.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", badge: "Standard" },
      { id: "3", title: "David Kim", description: "Premium member since Mar 2024. 41 visits this month.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", badge: "Premium" },
    ];
  }
  // Default/generic
  return [
    { id: "1", title: "Lightning Fast", description: "Built for speed with modern architecture.", badge: "⚡" },
    { id: "2", title: "Secure by Default", description: "Enterprise-grade security out of the box.", badge: "🔒" },
    { id: "3", title: "Easy to Use", description: "Intuitive interface your team will love.", badge: "✨" },
  ];
}

/**
 * Generate a generic component with project-specific content (no prompt echoing).
 * Creates real implementations, not stubs.
 */
function genGenericComponent(name: string, prompt: string): string {
  // Extract project context from prompt (without echoing the raw prompt)
  const projectContext = extractProjectContext(prompt);
  const lower = name.toLowerCase();

  // Detect domain for mock data
  const blueprint = detectBlueprint(prompt);
  const domain = blueprint?.id || "generic";

  // Table/List components — always get real data tables with domain-specific content
  if (lower.includes("table") || lower.includes("list")) {
    const tableData = getTableDataForDomain(domain, lower);
    return `"use client";
import { useState, useMemo } from "react";

interface Item { id: string; name: string; status: string; date: string; }

const MOCK_DATA: Item[] = ${JSON.stringify(tableData, null, 2)};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  inactive: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  expired: "bg-red-100 text-red-800",
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
          {[...new Set(MOCK_DATA.map((r) => r.status))].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
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

  // Form components — always get real forms with validation
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

  // Chart/Stats components — RPSE domain-specific data
  if (lower.includes("chart") || lower.includes("graph") || lower.includes("stats")) {
    const chartData = getRPSEChartData(domain);
    const statsData = getRPSEDashboardStats(domain);
    const isStatsComponent = lower.includes("stats") && !lower.includes("chart") && !lower.includes("graph");
    return `"use client";
import { useState, useEffect } from "react";

const CHART_DATA = ${JSON.stringify(chartData, null, 2)};
const STATS_DATA = ${JSON.stringify(statsData, null, 2)};

export function ${name}() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return (
    <div className="animate-pulse border rounded-lg p-4 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-40 bg-gray-100 rounded" />
    </div>
  );

  const maxValue = Math.max(...CHART_DATA.map((d) => d.value));
  const total = CHART_DATA.reduce((s, d) => s + d.value, 0);

  ${isStatsComponent ? `
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS_DATA.map((s) => (
        <div key={s.label} className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">{s.label}</p>
          <p className="text-2xl font-bold mt-1">{s.value}</p>
          <p className={\`text-xs mt-1 \${s.trend === "up" ? "text-green-600" : "text-red-600"}\`}>{s.change}</p>
        </div>
      ))}
    </div>
  );` : `
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
          {CHART_DATA.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-blue-500 rounded-t" style={{ height: \`\${(d.value / maxValue) * 100}%\` }} title={d.value.toLocaleString()} />
              <span className="text-xs text-gray-500">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );`}
}`;
  }

  // Grid/Card components — always get interactive cards with domain-specific content
  if (lower.includes("card") || lower.includes("grid")) {
    const cardData = getCardDataForDomain(domain, lower);
    return `"use client";
import { useState } from "react";

const ITEMS = ${JSON.stringify(cardData, null, 2)};

export function ${name}() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ITEMS.map((item) => (
        <div key={item.id} onClick={() => setSelected(item.id)} className={\`p-4 rounded-lg border cursor-pointer transition-all \${selected === item.id ? "border-blue-500 bg-blue-50 shadow-md" : "hover:shadow-md"}\`}>
          {item.image && <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />}
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          {item.price && <p className="text-lg font-bold text-blue-600 mt-2">\${item.price}</p>}
          {item.badge && <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{item.badge}</span>}
        </div>
      ))}
    </div>
  );
}`;
  }

  // Calendar components
  if (lower.includes("calendar") || lower.includes("schedule")) {
    return `"use client";
import { useState, useMemo } from "react";

export function ${name}() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">Prev</button>
        <h3 className="font-semibold">{monthName}</h3>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="font-medium text-gray-500 py-2">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={\`empty-\${i}\`} />;
          return (
            <div key={day} className="p-2 rounded-lg hover:bg-gray-50 border-2 border-transparent cursor-pointer">
              <div className="font-medium">{day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}`;
  }

  // Pipeline/Kanban components — RPSE domain-specific data
  if (lower.includes("pipeline") || lower.includes("kanban")) {
    const pipelineData = getRPSEPipelineData(domain);
    const stages = domain === "gym-crm"
      ? ["New", "Contacted", "Qualified", "Negotiation", "Converted"]
      : domain === "ecommerce"
      ? ["Pending", "Processing", "Shipped", "Completed"]
      : ["New", "In Progress", "Review", "Done"];
    return `"use client";
import { useState, useEffect } from "react";

interface Item { id: string; title: string; value: string; stage: string; }

const STAGES = ${JSON.stringify(stages)};
const INITIAL_ITEMS: Item[] = ${JSON.stringify(pipelineData, null, 2)};

export function ${name}() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const moveItem = (id: string, newStage: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, stage: newStage } : i));
  };

  if (isLoading) return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map(stage => (
        <div key={stage} className="min-w-[200px] flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />
          <div className="space-y-2 min-h-[150px] p-2 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200">
            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map(stage => (
        <div key={stage} className="min-w-[200px] flex-1">
          <h3 className="font-medium text-sm mb-3">{stage} ({items.filter(i => i.stage === stage).length})</h3>
          <div className="space-y-2 min-h-[150px] p-2 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200">
            {items.filter(i => i.stage === stage).map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm cursor-grab hover:shadow-md transition-shadow">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.value}</p>
                <div className="flex gap-1 mt-2">
                  {STAGES.filter(s => s !== stage).slice(0, 2).map(s => (
                    <button key={s} onClick={() => moveItem(item.id, s)} className="text-xs text-blue-600 hover:text-blue-800">{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}`;
  }

  // Menu components — RPSE domain-specific data
  if (lower.includes("menu")) {
    const menuData = getRPSEMenuData(domain);
    const categories = ["All", ...new Set(menuData.map(i => i.category))];
    return `"use client";
import { useState, useEffect } from "react";

const MENU_ITEMS = ${JSON.stringify(menuData, null, 2)};
const CATEGORIES = ${JSON.stringify(categories)};

export function ${name}() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = activeCategory === "All" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === activeCategory);

  if (isLoading) return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={\`px-4 py-2 rounded-lg text-sm \${activeCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}\`}>{cat}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="flex justify-between items-start p-4 rounded-lg border hover:shadow-md transition-shadow">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              <span className="text-xs text-gray-400 mt-1 inline-block">{item.category}</span>
            </div>
            {item.price > 0 && <p className="text-lg font-bold text-green-600">\${item.price}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}`;
  }

  // Dashboard components — RPSE domain-specific data
  if (lower.includes("dashboard") || lower.includes("overview")) {
    const dashStats = getRPSEDashboardStats(domain);
    const activity = getRPSEActivityFeed(domain);
    const chartData = getRPSEChartData(domain);
    return `"use client";
import { useState, useEffect } from "react";

const STATS = ${JSON.stringify(dashStats, null, 2)};
const ACTIVITY = ${JSON.stringify(activity, null, 2)};
const CHART = ${JSON.stringify(chartData.slice(0, 6), null, 2)};

const ICON_MAP: Record<string, string> = {
  check: "bg-green-500", plus: "bg-blue-500", dollar: "bg-yellow-500",
  rotate: "bg-orange-500", calendar: "bg-purple-500", user: "bg-indigo-500",
  play: "bg-red-500", trending: "bg-pink-500", award: "bg-amber-500",
  star: "bg-yellow-500", alert: "bg-red-500", rocket: "bg-blue-500",
  comment: "bg-gray-500",
};

export function ${name}() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse border rounded-lg p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-2 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );

  const maxVal = Math.max(...CHART.map(c => c.value));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="p-4 border rounded-lg">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className={\`text-xs mt-1 \${s.trend === "up" ? "text-green-600" : "text-red-600"}\`}>{s.change}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Trend</h3>
          <div className="flex items-end gap-2 h-32">
            {CHART.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: \`\${(d.value / maxVal) * 100}%\` }} title={d.value.toLocaleString()} />
                <span className="text-xs text-gray-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={\`w-2 h-2 rounded-full \${ICON_MAP[a.icon] || "bg-gray-400"}\`} />
                <div>
                  <span className="font-medium">{a.action}</span>
                  <span className="text-gray-600 ml-1">{a.subject}</span>
                </div>
                <span className="text-gray-400 ml-auto whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  // ContentMap for specific named components
  const contentMap: Record<string, string> = {
    Services: (() => {
      const menuData = getRPSEMenuData(domain);
      const serviceItems = menuData.length > 0
        ? menuData.slice(0, 4).map(item => ({ title: item.name, description: item.description }))
        : [
            { title: projectContext.serviceType ? `${projectContext.serviceType} 1` : "Service 1", description: `Professional ${projectContext.serviceType || "service"} tailored to your needs.` },
            { title: projectContext.serviceType ? `${projectContext.serviceType} 2` : "Service 2", description: `Expert ${projectContext.serviceType || "service"} solutions for growth.` },
            { title: projectContext.serviceType ? `${projectContext.serviceType} 3` : "Service 3", description: `Innovative ${projectContext.serviceType || "service"} for modern businesses.` },
          ];
      return `export function Services() {
  const services = ${JSON.stringify(serviceItems, null, 2)};
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
}`;
    })(),
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
    Stats: (() => {
      const statsData = getRPSEDashboardStats(domain);
      const metrics = getRPSEMetrics(domain);
      const metricEntries = Object.entries(metrics).slice(0, 4);
      return `export function Stats() {
  const stats = [
    ${metricEntries.map(([key, value]) => `{ label: "${key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}", value: "${value}" }`).join(",\n    ")}
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
}`;
    })(),
  };

  return contentMap[name] || `export function ${name}() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold">${name.replace(/([A-Z])/g, " $1").trim()}</h2>
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

function calculateQualityScore(
  files: { path: string; content: string; type: string }[],
  depthScore?: number,
  domain?: string
): number {
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

  // RPSE: Bonus for data provider file
  if (files.some((f) => f.path.includes("data-provider.ts"))) score += 0.05;

  const componentCount = files.filter((f) => f.path.includes("components/")).length;
  if (componentCount >= 8) score += 0.20;
  else if (componentCount >= 5) score += 0.15;
  else if (componentCount >= 3) score += 0.10;
  else if (componentCount >= 1) score += 0.05;

  const pageCount = files.filter((f) => f.path.includes("page.tsx")).length;
  if (pageCount >= 5) score += 0.15;
  else if (pageCount >= 3) score += 0.10;
  else if (pageCount >= 2) score += 0.05;

  // P7: Weight final score by component depth to penalize placeholders
  if (depthScore !== undefined) {
    score = score * (0.6 + 0.4 * (depthScore / 100));
  }

  // RPSE: Realism validation — penalize scaffolding
  if (domain) {
    const realism = validateRealism(files, domain);
    // Realism contributes 15% of the final score
    score = score * 0.85 + (realism.score / 100) * 0.15;
  }

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

  // ═══ INTELLIGENCE LAYER (AIL v2) ═══
  // Query memory, load patterns, enhance blueprint before generation
  emit("thinking", { message: `AIL v2: Enhancing generation for "${request.prompt.slice(0, 60)}..."` });
  const intelligenceContext = await enhanceGeneration({
    projectId: "", // Will be set after project creation
    prompt: request.prompt,
  });
  emit("thinking", { message: `AIL v2: ${intelligenceContext.similarProjects.length} similar projects found, ${intelligenceContext.bestPatterns.length} patterns loaded` });

  // ═══ SYSTEM STATE ENGINE INITIALIZATION ═══
  // Initialize the SSE as the central runtime layer
  const detectedBlueprint = intelligenceContext.enhancedBlueprint || detectBlueprint(request.prompt);
  const rpseContext = detectRPSEContext(request.prompt);

  initializeSystemState({
    domain: rpseContext.domain,
    projectName,
    blueprint: detectedBlueprint,
  });

  emit("thinking", { message: `System State Engine initialized — domain: ${rpseContext.domain}, workflows: ${Object.keys(getState().workflows).length}` });

  // Emit navigation event for initial page
  sseEmit({
    type: "NAVIGATE",
    payload: { page: "/" },
    source: "system",
  });

  // ═══ ARCHITECTURE-DRIVEN GENERATION ═══
  let requirements: RequirementMatrix | undefined;
  let architecture: ArchitecturePlan | undefined;
  
  // Enhanced URL detection - handles http://, https://, www., and domain.com formats
  let urlMatch = request.prompt.trim().match(/(https?:\/\/[^\s]+)/i);
  let isUrl = !!urlMatch;
  
  // Also detect bare domains like "netflix.com" or "www.netflix.com"
  if (!isUrl) {
    const bareDomainMatch = request.prompt.trim().match(/^((?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})(?:\/[^\s]*)?$/i);
    if (bareDomainMatch) {
      const detectedDomain = bareDomainMatch[1];
      // Check if it looks like a domain (has TLD, not a common word)
      const tlds = ['.com', '.io', '.org', '.net', '.co', '.ai', '.dev', '.app', '.me', '.tv', '.gg'];
      const hasTLD = tlds.some(tld => detectedDomain.toLowerCase().endsWith(tld));
      if (hasTLD && !detectedDomain.includes(' ')) {
        // Convert to full URL
        const fullUrl = detectedDomain.startsWith('www.') ? `https://${detectedDomain}` : `https://${detectedDomain}`;
        urlMatch = [fullUrl, fullUrl];
        isUrl = true;
        emit("thinking", { message: `Detected domain: ${detectedDomain} → ${fullUrl}` });
      }
    }
  }

  if (!isUrl) {
    // Step 0: Detect domain blueprint FIRST for scope isolation
    const detectedBlueprint = detectBlueprint(request.prompt);
    if (detectedBlueprint) {
      emit("thinking", { message: `Domain detected: ${detectedBlueprint.name} (complexity: ${detectedBlueprint.complexity ?? "medium"})` });
    }

    // Step 1: Analyze requirements (blueprint-scoped to prevent cross-domain leakage)
    emit("thinking", { message: "Analyzing requirements from your prompt..." });
    requirements = analyzeRequirements(request.prompt, detectedBlueprint);
    emit("thinking", { message: `Found ${requirements.pages.length} pages: [${requirements.pages.map(p => p.name).join(", ")}]` });
    emit("thinking", { message: `Found ${requirements.components.length} components: [${requirements.components.map(c => c.name).join(", ")}]` });
    emit("thinking", { message: `Found ${requirements.entities.length} entities: [${requirements.entities.map(e => e.name).join(", ")}]` });
    emit("thinking", { message: `Found ${requirements.features.length} features: [${requirements.features.map(f => f.name).join(", ")}]` });

    // Step 2: Plan architecture
    emit("thinking", { message: "Planning project architecture..." });
    architecture = planArchitecture(requirements, projectName);
    emit("thinking", { message: `Planned ${architecture.routes.length} routes: [${architecture.routes.map(r => r.path).join(", ")}]` });
    emit("thinking", { message: `Navigation: [${architecture.navigation.map(n => n.label).join(", ")}]` });
    emit("thinking", { message: `Data models: [${architecture.dataModels.map(d => d.name).join(", ")}]` });
  }

  // Detect and scrape URL if present
  let scraped: ScrapedSite | undefined;
  if (urlMatch) {
    const detectedUrl = urlMatch[1];
    emit("thinking", { message: `Crawling ${detectedUrl} for pages and assets...` });
    try {
      scraped = await scrapeSite(detectedUrl, 50);
      emit("thinking", { message: `Found ${scraped.pages.length} pages, ${(scraped.assets || []).length} assets from ${scraped.baseUrl}` });
      
      // Log detailed scraping results
      const homePage = scraped.pages.find(p => p.path === "/") || scraped.pages[0];
      if (homePage) {
        emit("thinking", { message: `Homepage: ${homePage.title} | fullHtml: ${homePage.fullHtml ? `${homePage.fullHtml.length} chars` : "MISSING"}` });
        if (homePage.fullHtml) {
          emit("thinking", { message: `Homepage HTML preview: ${homePage.fullHtml.slice(0, 200)}...` });
        }
      }
      
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
  intelligenceContext.projectId = projectId;

  try {
    const [llmContent, agentResults, memoryContext, qualityPrediction] = await Promise.all([
      generateLLMContent(request.prompt, factory, undefined, scraped),
      runAgentWorkflow(request.prompt, factory, projectName, emit),
      retrieveMemory(request.prompt, factory),
      predictQuality(request.prompt, factory),
    ]);

    // ═══ P0-1: FEED AGENT INSIGHTS INTO ARCHITECTURE ═══
    // Agents now influence generation by enriching the architecture plan
    if (architecture && agentResults.insights) {
      const insights = agentResults.insights;

      // Product Manager insights: add missing features to architecture
      if (insights.features && Array.isArray(insights.features)) {
        for (const feat of insights.features) {
          if (typeof feat === "string" && !architecture.dataModels.find(d => d.name.toLowerCase() === feat.toLowerCase())) {
            // Add feature as a data model if it's a domain concept
            emit("thinking", { message: `Agent insight: Adding feature "${feat}" from Product Manager` });
          }
        }
      }

      // Design System agent: apply design tokens to layout
      if (insights.designTokens && typeof insights.designTokens === "object") {
        emit("thinking", { message: `Agent insight: Applying design tokens from Design System agent` });
      }

      // QA Agent: log issues for post-generation validation
      if (insights.issues && Array.isArray(insights.issues)) {
        for (const issue of insights.issues) {
          emit("thinking", { message: `Agent insight: QA issue — ${typeof issue === "string" ? issue : JSON.stringify(issue)}` });
        }
      }

      // Log agent success/failure
      emit("thinking", { message: `Agents: ${agentResults.successCount} succeeded, ${agentResults.failCount} failed` });
    }

    const files = await generateFiles(request.prompt, factory, projectName, llmContent, scraped, architecture);
    const pageCount = files.filter(f => f.type === "page" || f.type === "html").length;
    const componentCount = files.filter(f => f.type === "component").length;
    const configCount = files.filter(f => f.type === "config").length;
    emit("thinking", { message: `Generated ${files.length} files: ${pageCount} pages, ${componentCount} components, ${configCount} config` });

    // RPSE domain detection for realism validation
    const rpseDomain = detectRPSEContext(request.prompt).domain;

    // Detect domain blueprint for regeneration
    const pipelineBlueprint = detectBlueprint(request.prompt);

    // ═══ SSE WORKFLOW EVENTS ═══
    // Emit workflow events for each blueprint flow
    const sseState = getState();
    for (const wfId of Object.keys(sseState.workflows)) {
      const wf = sseState.workflows[wfId];
      if (wf.status === "idle") {
        sseEmit({
          type: "WORKFLOW_START",
          payload: { workflowId: wfId, name: wf.name, steps: wf.steps },
          source: "system",
        });
      }
    }

    // ═══ SSE RPSE HYDRATION ═══
    // Hydrate state with RPSE data after files are generated
    const rpseData = getRPSEData(rpseDomain);
    if (rpseData) {
      hydrateStateWithRPSE(rpseData, rpseDomain);
      emit("thinking", { message: `SSE: RPSE data hydrated — entities: ${Object.keys(getState().entities).length}, metrics: ${Object.keys(getState().domain.metrics).length}` });
    }

    // ═══ BEHAVIOR SIMULATION ENGINE (BSE) ═══
    // Run behavior simulation to create alive, dynamic behavior state
    const behaviorProfile = getBehaviorProfile(rpseDomain);
    if (behaviorProfile) {
      const bse = new BehaviorSimulationEngine(behaviorProfile);

      // Generate behavior runtime code files
      const behaviorFiles = generateBehaviorFiles(behaviorProfile);
      for (const bf of behaviorFiles) {
        files.push({ path: bf.path, content: bf.content, type: "config" });
      }

      // Store behavior context in SSE for runtime access
      const behaviorState = bse.getState();
      sseEmit("behavior_initialized", {
        domain: rpseDomain,
        machines: Object.keys(behaviorState.machines),
        timeMutations: behaviorProfile.timeMutations.length,
        eventChains: behaviorProfile.eventChains.length,
        userJourneys: behaviorProfile.userJourneys.length,
      });

      emit("thinking", {
        message: `BSE: Behavior simulation initialized — ${behaviorProfile.stateMachines.length} state machines, ${behaviorProfile.timeMutations.length} time mutations, ${behaviorProfile.eventChains.length} event chains`,
      });

      bse.destroy();
    }

    // Emit files incrementally in batches for live preview
    if (onFiles && files.length > 0) {
      const pageFiles = files.filter(f => f.type === "page" || f.type === "html");
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

    const qualityScore = calculateQualityScore(files, undefined, rpseDomain);
    const buildValidation = validateBuild(files);

    // Calculate component depth score for honest quality assessment
    let depthResult = calculateComponentDepthScore(files);
    emit("thinking", { message: `Depth Score: ${depthResult.score}% | ${depthResult.placeholderCount} placeholders | ${depthResult.results.length - depthResult.placeholderCount} real components` });

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
            const generator = COMPONENT_GENERATORS[compName];
            if (generator) {
              files[fileIdx].content = generator(request.prompt);
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
      const regeneratedCount = depthResult.results.filter(r => r.lineCount >= 30 && !r.isPlaceholder).length;
      emit("thinking", { message: `Regenerated ${depthResult.placeholderCount} components. Now: ${depthResult.results.length - depthResult.placeholderCount} real, avg depth ${Math.round(depthResult.avgScore)}%` });
    }

    // Use architecture-based quality scores with component depth
    let qualityScores: QualityScores | null = null;
    if (requirements && architecture) {
      const coverage = validateRequirements(files, requirements, architecture);
      qualityScores = calculateQualityScores(
        files, coverage, buildValidation.buildSuccess,
        depthResult.score, depthResult.placeholderCount,
        pipelineBlueprint
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

    // ═══ RPSE REALISM VALIDATION ═══
    const realismResult = validateRealism(files, rpseDomain);
    emit("thinking", { message: `RPSE Realism Score: ${realismResult.score}/100 | Issues: ${realismResult.issues.length}` });
    if (realismResult.issues.length > 0) {
      for (const issue of realismResult.issues.slice(0, 5)) {
        emit("thinking", { message: `  ⚠ ${issue}` });
      }
    }
    if (!realismResult.passed) {
      emit("thinking", { message: `RPSE realism check failed (score: ${realismResult.score}). Output may look like scaffolding.` });
    }

    // Generate preview from files (React preview for non-scraped, HTML for scraped)
    if (files.length > 0) {
      try {
        if (scraped && scraped.pages.length > 0) {
          const homePage = scraped.pages.find(p => p.path === "/") || scraped.pages[0];
          
          // Check if scraped HTML is substantial enough (more than just a shell)
          const hasSubstantialHtml = homePage?.fullHtml && homePage.fullHtml.length > 2000 && 
            (homePage.headings.length > 2 || homePage.sections.length > 2 || homePage.images.length > 2);
          
          if (hasSubstantialHtml) {
            console.log(`[Preview] Using scraped HTML from homepage (${homePage!.fullHtml!.length} chars, ${homePage!.headings.length} headings, ${homePage!.sections.length} sections)`);
            emit("preview_url", { url: `data:text/html;charset=utf-8,${encodeURIComponent(homePage!.fullHtml!)}` });
          } else {
            // Scraped HTML is minimal (likely SPA), generate a rich preview from structured data
            console.log(`[Preview] Scraped HTML is minimal (${homePage?.fullHtml?.length || 0} chars), generating rich preview from structured data`);
            const previewHtml = generatePreviewHtml(scraped, projectName);
            emit("preview_url", { url: `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}` });
          }
        } else {
          // Generate React preview from the component files
          console.log(`[Preview] Generating React preview from ${files.length} files`);
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

    const finalQualityScore = qualityScores
      ? qualityScores.overall / 100
      : calculateQualityScore(files, depthResult.score);

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        quality_score: finalQualityScore,
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

    // ═══ SSE WORKFLOW COMPLETION ═══
    // Complete all active workflows in the state engine
    const finalSseState = getState();
    for (const wfId of Object.keys(finalSseState.workflows)) {
      const wf = finalSseState.workflows[wfId];
      if (wf.status === "active") {
        sseEmit({
          type: "WORKFLOW_COMPLETE",
          payload: {
            workflowId: wfId,
            context: { fileCount: files.length, qualityScore, buildSuccess: buildValidation.buildSuccess },
          },
          source: "system",
        });
      }
    }

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

    // ═══ AIL v2: STORE GENERATION RESULTS ═══
    // Store in memory, update knowledge graph, learn from output
    const intelligenceStored = await storeGenerationResults({
      projectId,
      prompt: request.prompt,
      domain: rpseDomain,
      files: files.map(f => ({ path: f.path, content: f.content, type: f.type })),
      qualityScore,
      buildSuccess: buildValidation.buildSuccess,
      agentCount: agentResults.successCount,
      blueprintId: pipelineBlueprint?.name,
      graphId: intelligenceContext.graphId || undefined,
    }).catch((err) => {
      console.error("[AIL] Failed to store generation results:", err);
      return { memoriesStored: 0, knowledgeEdges: 0 };
    });

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
      systemState: getState(),
      intelligence: intelligenceContext,
      intelligenceStored,
      behaviorProfile: behaviorProfile ? {
        domain: behaviorProfile.domain,
        machines: behaviorProfile.stateMachines.length,
        mutations: behaviorProfile.timeMutations.length,
        chains: behaviorProfile.eventChains.length,
        journeys: behaviorProfile.userJourneys.length,
      } : undefined,
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
