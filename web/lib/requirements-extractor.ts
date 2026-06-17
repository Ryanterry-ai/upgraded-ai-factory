/**
 * Extracts structured requirements from a user prompt.
 * Creates a requirement matrix that drives generation and validates output.
 */

export interface Requirement {
  id: string;
  type: "page" | "component" | "feature" | "section" | "style";
  name: string;
  description: string;
  required: boolean;
  route?: string;
  keywords: string[];
}

export interface RequirementMatrix {
  pages: Requirement[];
  components: Requirement[];
  features: Requirement[];
  sections: Requirement[];
  styles: Requirement[];
  all: Requirement[];
}

// Common page patterns
const PAGE_PATTERNS: { pattern: RegExp; name: string; route: string; keywords: string[] }[] = [
  { pattern: /\b(home\s*page?|landing\s*page?|homepage)\b/i, name: "Home Page", route: "/", keywords: ["home", "landing", "homepage"] },
  { pattern: /\b(about\s*page?|about\s*us)\b/i, name: "About Page", route: "/about", keywords: ["about", "about us", "company"] },
  { pattern: /\b(services?\s*page?|what\s*we\s*do)\b/i, name: "Services Page", route: "/services", keywords: ["services", "offerings", "what we do"] },
  { pattern: /\b(contact\s*page?|contact\s*us)\b/i, name: "Contact Page", route: "/contact", keywords: ["contact", "get in touch", "reach us"] },
  { pattern: /\b(portfolio\s*page?|our\s*work)\b/i, name: "Portfolio Page", route: "/portfolio", keywords: ["portfolio", "work", "projects"] },
  { pattern: /\b(blog\s*page?|blogging)\b/i, name: "Blog Page", route: "/blog", keywords: ["blog", "articles", "posts"] },
  { pattern: /\b(pricing\s*page?|plans?)\b/i, name: "Pricing Page", route: "/pricing", keywords: ["pricing", "plans", "packages"] },
  { pattern: /\b(team\s*page?|our\s*team)\b/i, name: "Team Page", route: "/team", keywords: ["team", "people", "staff"] },
  { pattern: /\b(careers?\s*page?|jobs?)\b/i, name: "Careers Page", route: "/careers", keywords: ["careers", "jobs", "hiring"] },
  { pattern: /\b(faq\s*page?|frequently\s*asked)\b/i, name: "FAQ Page", route: "/faq", keywords: ["faq", "questions", "answers"] },
  { pattern: /\b(testimonials?\s*page?|reviews?|case\s*studies?)\b/i, name: "Testimonials Page", route: "/testimonials", keywords: ["testimonials", "reviews", "case studies"] },
  { pattern: /\b(products?\s*page?|shop|store|catalog)\b/i, name: "Products Page", route: "/products", keywords: ["products", "shop", "store", "catalog"] },
];

// Common component patterns
const COMPONENT_PATTERNS: { pattern: RegExp; name: string; keywords: string[] }[] = [
  { pattern: /\b(hero\s*(section|banner|component)?)\b/i, name: "Hero", keywords: ["hero", "banner", "jumbotron"] },
  { pattern: /\b(navigation|navbar|nav\s*bar|menu)\b/i, name: "Header", keywords: ["navigation", "navbar", "menu", "header"] },
  { pattern: /\b(footer)\b/i, name: "Footer", keywords: ["footer", "bottom"] },
  { pattern: /\b(testimonials?\s*(section|component|slider|carousel)?)\b/i, name: "Testimonials", keywords: ["testimonial", "review", "feedback"] },
  { pattern: /\b(pricing\s*(table|section|component|cards?)?)\b/i, name: "Pricing", keywords: ["pricing", "plans", "tiers"] },
  { pattern: /\b(features?\s*(section|grid|list)?)\b/i, name: "Features", keywords: ["features", "benefits", "capabilities"] },
  { pattern: /\b(team\s*(section|grid|members?)?)\b/i, name: "Team", keywords: ["team", "members", "staff"] },
  { pattern: /\b(portfolio\s*(grid|gallery|filter)?)\b/i, name: "Portfolio", keywords: ["portfolio", "gallery", "work"] },
  { pattern: /\b(contact\s*(form|section)?)\b/i, name: "ContactForm", keywords: ["contact form", "get in touch"] },
  { pattern: /\b(newsletter\s*(section|form|signup)?)\b/i, name: "Newsletter", keywords: ["newsletter", "subscribe", "signup"] },
  { pattern: /\b(social\s*(proof|media|links?))\b/i, name: "SocialProof", keywords: ["social proof", "trust signals", "clients"] },
  { pattern: /\b(cta\s*(section|button|banner)?)\b/i, name: "CTA", keywords: ["cta", "call to action", "get started"] },
  { pattern: /\b(stats?\s*(section|counter|numbers?)?)\b/i, name: "Stats", keywords: ["stats", "numbers", "counter", "metrics"] },
  { pattern: /\b(blog\s*(posts?|grid|list|cards?)?)\b/i, name: "BlogList", keywords: ["blog posts", "articles"] },
];

// Common feature patterns
const FEATURE_PATTERNS: { pattern: RegExp; name: string; keywords: string[] }[] = [
  { pattern: /\b(dark\s*mode|dark\s*theme|night\s*mode)\b/i, name: "DarkMode", keywords: ["dark mode", "dark theme", "night mode"] },
  { pattern: /\b(mobile\s*responsive|responsive\s*design|mobile.?friendly)\b/i, name: "Responsive", keywords: ["responsive", "mobile", "adaptive"] },
  { pattern: /\b(animation|animated|motion|transition)\b/i, name: "Animations", keywords: ["animation", "animated", "motion", "transitions"] },
  { pattern: /\b(skeleton\s*loading|loading\s*states?)\b/i, name: "LoadingStates", keywords: ["skeleton", "loading states"] },
  { pattern: /\b(search\s*(bar|functionality|feature)?)\b/i, name: "Search", keywords: ["search", "filter"] },
  { pattern: /\b(auth|authentication|login|signup|register)\b/i, name: "Auth", keywords: ["auth", "login", "signup", "register"] },
  { pattern: /\b(i18n|internationalization|multilingual)\b/i, name: "i18n", keywords: ["i18n", "internationalization", "multilingual"] },
  { pattern: /\b(seo|search\s*engine\s*optimization)\b/i, name: "SEO", keywords: ["seo", "meta tags", "structured data"] },
];

/**
 * Extract requirements from a user prompt
 */
export function extractRequirements(prompt: string): RequirementMatrix {
  const pages: Requirement[] = [];
  const components: Requirement[] = [];
  const features: Requirement[] = [];
  const sections: Requirement[] = [];

  // Always require a home page
  pages.push({
    id: "page-home",
    type: "page",
    name: "Home Page",
    description: "Main landing page",
    required: true,
    route: "/",
    keywords: ["home", "landing"],
  });

  // Extract pages from prompt
  for (const { pattern, name, route, keywords } of PAGE_PATTERNS) {
    if (pattern.test(prompt)) {
      const exists = pages.some(p => p.route === route);
      if (!exists) {
        pages.push({
          id: `page-${name.toLowerCase().replace(/\s+/g, "-")}`,
          type: "page",
          name,
          description: `${name} for the website`,
          required: true,
          route,
          keywords,
        });
      }
    }
  }

  // Extract components from prompt
  for (const { pattern, name, keywords } of COMPONENT_PATTERNS) {
    if (pattern.test(prompt)) {
      const exists = components.some(c => c.name === name);
      if (!exists) {
        components.push({
          id: `comp-${name.toLowerCase().replace(/\s+/g, "-")}`,
          type: "component",
          name,
          description: `${name} component`,
          required: true,
          keywords,
        });
      }
    }
  }

  // Extract features from prompt
  for (const { pattern, name, keywords } of FEATURE_PATTERNS) {
    if (pattern.test(prompt)) {
      const exists = features.some(f => f.name === name);
      if (!exists) {
        features.push({
          id: `feat-${name.toLowerCase().replace(/\s+/g, "-")}`,
          type: "feature",
          name,
          description: `${name} feature`,
          required: true,
          keywords,
        });
      }
    }
  }

  // Infer required sections based on pages
  if (pages.some(p => p.route === "/services")) {
    sections.push({
      id: "section-services-list",
      type: "section",
      name: "Services List",
      description: "Grid or list of services",
      required: true,
      keywords: ["services", "offerings"],
    });
  }

  if (pages.some(p => p.route === "/testimonials") || components.some(c => c.name === "Testimonials")) {
    sections.push({
      id: "section-testimonials",
      type: "section",
      name: "Testimonials",
      description: "Customer testimonials or reviews",
      required: true,
      keywords: ["testimonial", "review"],
    });
  }

  // Check for testimonial requirement in prompt even if not matched by patterns
  if (/\b(testimonials?|reviews?|case\s*studies?|what\s*clients\s*say)\b/i.test(prompt) &&
      !sections.some(s => s.name === "Testimonials")) {
    sections.push({
      id: "section-testimonials",
      type: "section",
      name: "Testimonials",
      description: "Customer testimonials or reviews",
      required: true,
      keywords: ["testimonial", "review"],
    });
  }

  // Check for dark mode requirement even if not matched
  if (/\b(dark\s*mode|dark\s*theme)\b/i.test(prompt) &&
      !features.some(f => f.name === "DarkMode")) {
    features.push({
      id: "feat-dark-mode",
      type: "feature",
      name: "DarkMode",
      description: "Dark mode support",
      required: true,
      keywords: ["dark mode", "dark theme"],
    });
  }

  const all = [...pages, ...components, ...features, ...sections];

  return { pages, components, features, sections, styles: [], all };
}

/**
 * Validate generated files against requirements
 */
export function validateRequirements(
  files: Array<{ path: string; content: string; type: string }>,
  matrix: RequirementMatrix
): { valid: boolean; missing: Requirement[]; warnings: string[] } {
  const missing: Requirement[] = [];
  const warnings: string[] = [];

  // Validate pages exist
  for (const page of matrix.pages) {
    const route = page.route === "/" ? "" : page.route;
    const routePattern = route ? route.replace(/^\//, "").replace(/\//g, "\\/") : "";

    const exists = files.some(f => {
      if (page.route === "/") {
        return f.path.includes("src/app/page.") || f.path.includes("src/app/index.") || f.path === "index.html";
      }
      return f.path.includes(`src/app/${route}/page.`) || f.path.includes(`${route}/index.`);
    });

    if (!exists) {
      missing.push(page);
      warnings.push(`Missing required page: ${page.name} (${page.route})`);
    }
  }

  // Validate components exist (check by name in file paths or content)
  for (const comp of matrix.components) {
    const exists = files.some(f => {
      const pathLower = f.path.toLowerCase();
      const contentLower = f.content.toLowerCase();
      return pathLower.includes(comp.name.toLowerCase()) ||
             contentLower.includes(comp.name.toLowerCase()) ||
             contentLower.includes(comp.keywords[0]?.toLowerCase() || "");
    });

    if (!exists) {
      missing.push(comp);
      warnings.push(`Missing required component: ${comp.name}`);
    }
  }

  // Validate features are implemented
  for (const feat of matrix.features) {
    const exists = files.some(f => {
      const contentLower = f.content.toLowerCase();
      return feat.keywords.some(kw => contentLower.includes(kw.toLowerCase()));
    });

    if (!exists) {
      missing.push(feat);
      warnings.push(`Missing required feature: ${feat.name}`);
    }
  }

  // Validate sections exist in page content
  for (const section of matrix.sections) {
    const exists = files.some(f => {
      const contentLower = f.content.toLowerCase();
      return section.keywords.some(kw => contentLower.includes(kw.toLowerCase()));
    });

    if (!exists) {
      missing.push(section);
      warnings.push(`Missing required section: ${section.name}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get a human-readable summary of requirements
 */
export function summarizeRequirements(matrix: RequirementMatrix): string {
  const lines: string[] = [];

  if (matrix.pages.length > 0) {
    lines.push(`Pages: ${matrix.pages.map(p => p.name).join(", ")}`);
  }
  if (matrix.components.length > 0) {
    lines.push(`Components: ${matrix.components.map(c => c.name).join(", ")}`);
  }
  if (matrix.features.length > 0) {
    lines.push(`Features: ${matrix.features.map(f => f.name).join(", ")}`);
  }
  if (matrix.sections.length > 0) {
    lines.push(`Sections: ${matrix.sections.map(s => s.name).join(", ")}`);
  }

  return lines.join("\n");
}
