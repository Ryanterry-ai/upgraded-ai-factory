/**
 * Architecture Engine — Requirements-to-Architecture pipeline.
 * Replaces template-driven generation with architecture-driven generation.
 */

import type { DomainBlueprint } from "./domain-blueprints";

// ═══════════════════════════════════════════════════════════
// STEP 1: REQUIREMENT ANALYZER
// ═══════════════════════════════════════════════════════════

export interface Requirement {
  id: string;
  type: "page" | "component" | "feature" | "entity" | "role" | "workflow" | "integration";
  name: string;
  description: string;
  keywords: string[];
  required: boolean;
  route?: string;
  components?: string[]; // Page-specific components from blueprint
}

export interface RequirementMatrix {
  projectType: string;
  pages: Requirement[];
  components: Requirement[];
  features: Requirement[];
  entities: Requirement[];
  roles: Requirement[];
  workflows: Requirement[];
  integrations: Requirement[];
  all: Requirement[];
}

// ═══════════════════════════════════════════════════════════
// STEP 2: ARCHITECTURE PLANNER
// ═══════════════════════════════════════════════════════════

export interface RoutePlan {
  path: string;
  name: string;
  components: string[];
  description: string;
}

export interface LayoutPlan {
  name: string;
  type: "root" | "dashboard" | "auth" | "public";
  components: string[];
}

export interface NavigationPlan {
  label: string;
  href: string;
  icon?: string;
  children?: NavigationPlan[];
}

export interface ComponentPlan {
  name: string;
  type: "page" | "feature" | "ui" | "layout" | "data" | "form";
  props: string[];
  description: string;
  route?: string;
}

export interface DataModelPlan {
  name: string;
  fields: { name: string; type: string; required: boolean; description: string }[];
  relationships: { type: "hasMany" | "belongsTo" | "manyToMany"; target: string; foreignKey?: string }[];
}

export interface APIRoutePlan {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  entity?: string;
}

export interface ArchitecturePlan {
  routes: RoutePlan[];
  layouts: LayoutPlan[];
  navigation: NavigationPlan[];
  components: ComponentPlan[];
  dataModels: DataModelPlan[];
  apiRoutes: APIRoutePlan[];
}

// ═══════════════════════════════════════════════════════════
// STEP 6: REQUIREMENT VALIDATOR
// ═══════════════════════════════════════════════════════════

export interface ValidationCoverage {
  type: string;
  required: string[];
  generated: string[];
  missing: string[];
  coverage: number;
}

export interface ValidationResult {
  pages: ValidationCoverage;
  components: ValidationCoverage;
  features: ValidationCoverage;
  routes: ValidationCoverage;
  entities: ValidationCoverage;
  workflows: ValidationCoverage;
  overallCoverage: number;
  passed: boolean;
  missingItems: string[];
}

// ═══════════════════════════════════════════════════════════
// STEP 7: QUALITY SCORES
// ═══════════════════════════════════════════════════════════

export interface QualityScores {
  coverage: number;      // Requirement coverage %
  architecture: number;  // Architecture quality %
  feature: number;       // Feature completeness %
  build: number;         // Build success %
  ux: number;            // UX quality %
  intentAlignment: number; // Intent alignment %
  overall: number;       // Weighted overall %
}

// ═══════════════════════════════════════════════════════════
// STEP 1: REQUIREMENT ANALYZER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Analyze a user prompt and extract structured requirements.
 * When a blueprint is provided, pages/components are scoped to the blueprint domain only.
 */
export function analyzeRequirements(prompt: string, blueprint?: DomainBlueprint | null): RequirementMatrix {
  const lower = prompt.toLowerCase();
  const pages: Requirement[] = [];
  const components: Requirement[] = [];
  const features: Requirement[] = [];
  const entities: Requirement[] = [];
  const roles: Requirement[] = [];
  const workflows: Requirement[] = [];

  // ─── PROJECT TYPE DETECTION ───
  let projectType = "website";
  if (blueprint) {
    // When blueprint is detected, project type comes from the blueprint ID
    projectType = blueprint.id === "ecommerce" ? "ecommerce"
      : blueprint.id === "gym-crm" ? "saas"
      : blueprint.id === "admin-dashboard" ? "saas"
      : blueprint.id === "streaming" ? "saas"
      : blueprint.id === "saas" ? "saas"
      : blueprint.id === "blog" ? "blog"
      : blueprint.id === "portfolio" ? "portfolio"
      : blueprint.id === "restaurant" ? "ecommerce"
      : blueprint.id === "startup-landing" ? "landing"
      : "website";
  } else {
    if (/\b(ecommerce|e-commerce|shop|store|marketplace|product|cart|checkout)\b/.test(lower)) {
      projectType = "ecommerce";
    } else if (/\b(crm|dashboard|admin|saas|dashboard|analytics|manage|management)\b/.test(lower)) {
      projectType = "saas";
    } else if (/\b(blog|news|magazine|content|article|editorial)\b/.test(lower)) {
      projectType = "blog";
    } else if (/\b(portfolio|agency|freelance|showcase)\b/.test(lower)) {
      projectType = "portfolio";
    } else if (/\b(landing|marketing|promotional)\b/.test(lower)) {
      projectType = "landing";
    }
  }

  // ─── ALWAYS: HOME PAGE ───
  pages.push({ id: "page-home", type: "page", name: "Home", description: "Main landing page", required: true, route: "/", keywords: ["home", "landing", "homepage"] });

  // ─── PAGE DETECTION (DOMAIN-ISOLATED) ───
  if (blueprint) {
    // BLUEPRINT MODE: Only add pages from the matched blueprint — no cross-domain leakage
    for (const bpPage of blueprint.requiredPages) {
      if (bpPage.route === "/") continue; // Home already added
      // Create meaningful keywords from page name and components
      const keywords = [
        bpPage.name.toLowerCase(),
        ...bpPage.components.map(c => c.toLowerCase()),
      ];
      // Add domain-specific keywords based on page name
      if (bpPage.name === "Members") {
        keywords.push("member", "membership", "member management");
      } else if (bpPage.name === "Leads") {
        keywords.push("lead", "pipeline", "prospect", "lead management");
      } else if (bpPage.name === "Attendance") {
        keywords.push("attendance", "check-in", "checkin", "tracking");
      } else if (bpPage.name === "Billing") {
        keywords.push("billing", "invoice", "payment", "billing management");
      } else if (bpPage.name === "Staff") {
        keywords.push("staff", "employee", "team", "staff management");
      } else if (bpPage.name === "Classes") {
        keywords.push("class", "schedule", "booking", "class management");
      } else if (bpPage.name === "Reports") {
        keywords.push("report", "analytics", "chart", "reporting");
      }
      pages.push({
        id: `page-${bpPage.name.toLowerCase().replace(/\s+/g, "-")}`,
        type: "page",
        name: bpPage.name,
        description: `${bpPage.name} page`,
        required: true,
        route: bpPage.route,
        keywords,
        components: bpPage.components, // Pass blueprint components through
      });
    }
    
    // ═══ BLUEPRINT-BASED COMPONENT DETECTION ═══
    // Add domain-specific components from blueprint requiredComponents
    for (const bpComp of blueprint.requiredComponents) {
      const exists = components.some(c => c.name === bpComp.name);
      if (!exists) {
        components.push({
          id: `comp-${bpComp.name.toLowerCase().replace(/\s+/g, "-")}`,
          type: "component",
          name: bpComp.name,
          description: bpComp.description,
          required: true,
          keywords: [bpComp.name.toLowerCase()],
        });
      }
    }
    
    // Add common domain-specific components based on blueprint ID
    const domainComponents: Record<string, string[]> = {
      "gym-crm": ["DashboardStats", "Charts", "RecentActivity", "QuickActions", "MemberTable", "AttendanceCalendar", "RevenueChart", "ClassSchedule", "StaffTable"],
      "ecommerce": ["Hero", "FeaturedProducts", "CategoryGrid", "Testimonials", "CTA", "ProductGrid", "FilterSidebar", "CartItems", "CheckoutForm"],
      "restaurant": ["Hero", "FeaturedProducts", "CategoryGrid", "MenuGrid", "ReservationForm", "OrderCart", "CheckoutForm", "ContactForm"],
      "healthcare-clinic": ["Hero", "Features", "Testimonials", "CTA", "Stats", "PatientTable", "AppointmentCalendar", "DoctorTable", "PrescriptionForm", "BillingTable"],
      "saas-platform": ["DashboardStats", "Charts", "RecentActivity", "QuickActions", "UserTable", "RevenueChart", "SettingsForm", "SubscriptionTable", "AnalyticsChart", "TenantManager"],
      "real-estate-crm": ["Hero", "Features", "Testimonials", "CTA", "Stats", "PropertyGrid", "LeadPipeline", "DealPipeline", "VisitScheduler", "DocumentManager"],
      "admin-dashboard": ["DashboardStats", "Charts", "RecentActivity", "QuickActions", "DataTable", "Sidebar"],
      "streaming": ["Hero", "FeaturedProducts", "CategoryGrid", "Testimonials", "CTA", "ProductGrid", "FilterSidebar"],
    };
    
    const domainId = blueprint.id;
    const domainSpecificComps = domainComponents[domainId] || [];
    for (const compName of domainSpecificComps) {
      const exists = components.some(c => c.name === compName);
      if (!exists) {
        components.push({
          id: `comp-${compName.toLowerCase().replace(/\s+/g, "-")}`,
          type: "component",
          name: compName,
          description: `${compName} component`,
          required: true,
          keywords: [compName.toLowerCase()],
        });
      }
    }
  } else {
    // NO BLUEPRINT: Fall back to regex keyword matching (legacy behavior)
    const pagePatterns: { pattern: RegExp; name: string; route: string; keywords: string[] }[] = [
      { pattern: /\b(about\s*(page|us|company)?)\b/i, name: "About", route: "/about", keywords: ["about", "about us", "company"] },
      { pattern: /\b(services?\s*(page)?)\b/i, name: "Services", route: "/services", keywords: ["services", "offerings", "what we do"] },
      { pattern: /\b(contact\s*(page|us|form)?)\b/i, name: "Contact", route: "/contact", keywords: ["contact", "get in touch", "contact form"] },
      { pattern: /\b(blog\s*(page|section|listing)?)\b/i, name: "Blog", route: "/blog", keywords: ["blog", "articles", "posts"] },
      { pattern: /\b(pricing\s*(page|table|section)?)\b/i, name: "Pricing", route: "/pricing", keywords: ["pricing", "plans", "tiers", "packages"] },
      { pattern: /\b(portfolio\s*(page|gallery|section)?)\b/i, name: "Portfolio", route: "/portfolio", keywords: ["portfolio", "work", "projects"] },
      { pattern: /\b(team\s*(page|section)?)\b/i, name: "Team", route: "/team", keywords: ["team", "members", "staff"] },
      { pattern: /\b(careers?\s*(page|section)?)\b/i, name: "Careers", route: "/careers", keywords: ["careers", "jobs", "hiring"] },
      { pattern: /\b(faq\s*(page|section)?)\b/i, name: "FAQ", route: "/faq", keywords: ["faq", "questions", "answers"] },
      { pattern: /\b(testimonials?\s*(page|section|reviews?|case\s*studies)?)\b/i, name: "Testimonials", route: "/testimonials", keywords: ["testimonials", "reviews", "case studies"] },
      { pattern: /\b(products?\s*(page|catalog|listing|listings|grid)?)\b/i, name: "Products", route: "/products", keywords: ["products", "catalog", "listing"] },
      { pattern: /\b(cart|shopping\s*cart|bag)\b/i, name: "Cart", route: "/cart", keywords: ["cart", "shopping cart"] },
      { pattern: /\b(checkout\s*(page|section)?)\b/i, name: "Checkout", route: "/checkout", keywords: ["checkout", "payment", "purchase"] },
      { pattern: /\b(account\s*(page|section|settings)?)\b/i, name: "Account", route: "/account", keywords: ["account", "my account"] },
      { pattern: /\b(admin\s*(dashboard|panel|page)?)\b/i, name: "Admin", route: "/admin", keywords: ["admin", "admin panel"] },
      { pattern: /\b(wishlist|wish\s*list)\b/i, name: "Wishlist", route: "/wishlist", keywords: ["wishlist", "saved"] },
      { pattern: /\b(reviews?\s*(page|section)?)\b/i, name: "Reviews", route: "/reviews", keywords: ["reviews", "ratings"] },
      { pattern: /\b(reports?|reporting|analytics|insights?)\s*(page|dashboard)?\b/i, name: "Reports", route: "/reports", keywords: ["reports", "analytics"] },
      { pattern: /\b(members?|memberships?)\b/i, name: "Members", route: "/members", keywords: ["members", "membership"] },
      { pattern: /\b(attendance|check.?in)\b/i, name: "Attendance", route: "/attendance", keywords: ["attendance", "check-in"] },
      { pattern: /\b(billing|invoices?|payments?)\b/i, name: "Billing", route: "/billing", keywords: ["billing", "invoices"] },
      { pattern: /\b(staff|employees?|team\s*manage)\b/i, name: "Staff", route: "/staff", keywords: ["staff", "employees"] },
      { pattern: /\b(leads?|prospects?|clients?)\b/i, name: "Leads", route: "/leads", keywords: ["leads", "prospects", "pipeline"] },
      { pattern: /\b(orders?)\b/i, name: "Orders", route: "/orders", keywords: ["orders", "order management"] },
      { pattern: /\b(brand\s*(pages?|section)?)\b/i, name: "Brands", route: "/brands", keywords: ["brands", "brand pages"] },
      { pattern: /\b(settings?\s*(page|section)?)\b/i, name: "Settings", route: "/settings", keywords: ["settings", "preferences"] },
      { pattern: /\b(profile\s*(page|section)?)\b/i, name: "Profile", route: "/profile", keywords: ["profile", "user profile"] },
      { pattern: /\b(login|sign.?in)\b/i, name: "Login", route: "/login", keywords: ["login", "sign in"] },
      { pattern: /\b(register|sign.?up|create\s*account)\b/i, name: "Register", route: "/register", keywords: ["register", "sign up"] },
      { pattern: /\b(dashboard)\b/i, name: "Dashboard", route: "/dashboard", keywords: ["dashboard", "overview"] },
      { pattern: /\b(menu|food\s*items?|dishes?|eat\b)/i, name: "Menu", route: "/menu", keywords: ["menu", "food", "dishes"] },
      { pattern: /\b(reservations?|table\s*reservation|book\s*table)/i, name: "Reservations", route: "/reservations", keywords: ["reservations", "booking"] },
      { pattern: /\b(appointments?|book\s*appointment)/i, name: "Appointments", route: "/appointments", keywords: ["appointments", "booking"] },
      { pattern: /\b(patients?|patient\s*record)/i, name: "Patients", route: "/patients", keywords: ["patients", "records"] },
      { pattern: /\b(doctors?|physicians?|providers?)/i, name: "Doctors", route: "/doctors", keywords: ["doctors", "physicians"] },
      { pattern: /\b(courses?|class\s*listing|lessons?)/i, name: "Courses", route: "/courses", keywords: ["courses", "classes"] },
      { pattern: /\b(students?|learners?)/i, name: "Students", route: "/students", keywords: ["students", "learners"] },
      { pattern: /\b(teachers?|instructors?|faculty)/i, name: "Teachers", route: "/teachers", keywords: ["teachers", "instructors"] },
      { pattern: /\b(properties?|listings?|real\s*estate)/i, name: "Properties", route: "/properties", keywords: ["properties", "listings"] },
      { pattern: /\b(schedule|calendar|timetable)/i, name: "Schedule", route: "/schedule", keywords: ["schedule", "calendar"] },
    ];

    for (const { pattern, name, route, keywords } of pagePatterns) {
      if (pattern.test(lower)) {
        pages.push({ id: `page-${name.toLowerCase()}`, type: "page", name, description: `${name} page`, required: true, route, keywords });
      }
    }
  }

  // ─── COMPONENT DETECTION ───
  const componentPatterns: { pattern: RegExp; name: string; keywords: string[] }[] = [
    { pattern: /\b(hero\s*(section|banner)?)\b/i, name: "Hero", keywords: ["hero", "banner"] },
    { pattern: /\b(testimonials?\s*(section|slider|carousel)?)\b/i, name: "Testimonials", keywords: ["testimonial", "review"] },
    { pattern: /\b(pricing\s*(table|cards?|section)?)\b/i, name: "Pricing", keywords: ["pricing", "plans"] },
    { pattern: /\b(features?\s*(section|grid|list)?)\b/i, name: "Features", keywords: ["features", "benefits"] },
    { pattern: /\b(cta\s*(section|banner|button)?)\b/i, name: "CTA", keywords: ["cta", "call to action"] },
    { pattern: /\b(stats?\s*(section|counter|numbers?)?)\b/i, name: "Stats", keywords: ["stats", "numbers", "counter"] },
    { pattern: /\b(newsletter\s*(section|form|signup)?)\b/i, name: "Newsletter", keywords: ["newsletter", "subscribe"] },
    { pattern: /\b(contact\s*form)\b/i, name: "ContactForm", keywords: ["contact form"] },
    { pattern: /\b(team\s*(section|grid|members?)?)\b/i, name: "Team", keywords: ["team", "members"] },
    { pattern: /\b(portfolio\s*(grid|gallery|filter)?)\b/i, name: "Portfolio", keywords: ["portfolio", "gallery"] },
    { pattern: /\b(blog\s*(posts?|grid|list|cards?)?)\b/i, name: "BlogList", keywords: ["blog posts", "articles"] },
    { pattern: /\b(faq\s*(accordion|section|list)?)\b/i, name: "FAQ", keywords: ["faq", "questions"] },
  ];

  for (const { pattern, name, keywords } of componentPatterns) {
    if (pattern.test(lower)) {
      components.push({ id: `comp-${name.toLowerCase()}`, type: "component", name, description: `${name} component`, required: true, keywords });
    }
  }

  // ─── FEATURE DETECTION ───
  const featurePatterns: { pattern: RegExp; name: string; keywords: string[] }[] = [
    { pattern: /\b(dark\s*mode|dark\s*theme|night\s*mode)\b/i, name: "DarkMode", keywords: ["dark mode", "dark theme"] },
    { pattern: /\b(mobile\s*responsive|responsive\s*design|mobile.?friendly)\b/i, name: "Responsive", keywords: ["responsive", "mobile"] },
    { pattern: /\b(animation|animated|motion|transition)\b/i, name: "Animations", keywords: ["animation", "motion"] },
    { pattern: /\b(search\s*(bar|functionality|feature)?)\b/i, name: "Search", keywords: ["search", "filter"] },
    { pattern: /\b(auth|authentication|login|signup)\b/i, name: "Auth", keywords: ["auth", "login", "signup"] },
    { pattern: /\b(filter|filtering)\b/i, name: "Filtering", keywords: ["filter", "filtering"] },
    { pattern: /\b(sort|sorting)\b/i, name: "Sorting", keywords: ["sort", "sorting"] },
    { pattern: /\b(pagination)\b/i, name: "Pagination", keywords: ["pagination", "paging"] },
    { pattern: /\b(export|download)\b/i, name: "Export", keywords: ["export", "download"] },
    { pattern: /\b(import|upload)\b/i, name: "Import", keywords: ["import", "upload"] },
  ];

  for (const { pattern, name, keywords } of featurePatterns) {
    if (pattern.test(lower)) {
      features.push({ id: `feat-${name.toLowerCase()}`, type: "feature", name, description: `${name} feature`, required: true, keywords });
    }
  }

  // ─── ENTITY DETECTION ───
  const entityPatterns: { pattern: RegExp; name: string; keywords: string[] }[] = [
    { pattern: /\b(leads?|prospects?)\b/i, name: "Lead", keywords: ["lead", "prospect"] },
    { pattern: /\b(members?|subscribers?)\b/i, name: "Member", keywords: ["member", "subscriber"] },
    { pattern: /\b(products?|items?)\b/i, name: "Product", keywords: ["product", "item"] },
    { pattern: /\b(orders?|purchases?)\b/i, name: "Order", keywords: ["order", "purchase"] },
    { pattern: /\b(users?|accounts?)\b/i, name: "User", keywords: ["user", "account"] },
    { pattern: /\b(staff|employees?|trainers?)\b/i, name: "Staff", keywords: ["staff", "employee", "trainer"] },
    { pattern: /\b(invoices?|bills?|payments?)\b/i, name: "Invoice", keywords: ["invoice", "bill", "payment"] },
    { pattern: /\b(brands?)\b/i, name: "Brand", keywords: ["brand"] },
    { pattern: /\b(reviews?|ratings?)\b/i, name: "Review", keywords: ["review", "rating"] },
    { pattern: /\b(categories?|tags?)\b/i, name: "Category", keywords: ["category", "tag"] },
    { pattern: /\b(attendance|check.?ins?)\b/i, name: "Attendance", keywords: ["attendance", "check-in"] },
    { pattern: /\b(campaigns?|promotions?)\b/i, name: "Campaign", keywords: ["campaign", "promotion"] },
    { pattern: /\b(tickets?|support\s*tickets?)\b/i, name: "Ticket", keywords: ["ticket", "support"] },
    { pattern: /\b(tasks?|todos?)\b/i, name: "Task", keywords: ["task", "todo"] },
    { pattern: /\b(deals?|opportunities?)\b/i, name: "Deal", keywords: ["deal", "opportunity"] },
    { pattern: /\b(classes?|sessions?|bookings?)\b/i, name: "Class", keywords: ["class", "session", "booking"] },
    { pattern: /\b(menu\s*items?|dishes?|food\s*items?)\b/i, name: "MenuItem", keywords: ["menu item", "dish", "food"] },
    { pattern: /\b(reservations?|table\s*bookings?)\b/i, name: "Reservation", keywords: ["reservation", "table booking"] },
    { pattern: /\b(appointments?)\b/i, name: "Appointment", keywords: ["appointment"] },
    { pattern: /\b(patients?)\b/i, name: "Patient", keywords: ["patient"] },
    { pattern: /\b(doctors?|physicians?)\b/i, name: "Doctor", keywords: ["doctor", "physician"] },
    { pattern: /\b(courses?|lessons?)\b/i, name: "Course", keywords: ["course", "lesson"] },
    { pattern: /\b(students?|learners?)\b/i, name: "Student", keywords: ["student", "learner"] },
    { pattern: /\b(teachers?|instructors?)\b/i, name: "Teacher", keywords: ["teacher", "instructor"] },
    { pattern: /\b(properties?|listings?)\b/i, name: "Property", keywords: ["property", "listing"] },
    { pattern: /\b(subscriptions?|plans?|tiers?)\b/i, name: "Subscription", keywords: ["subscription", "plan", "tier"] },
    { pattern: /\b(tenants?|organizations?|companies?)\b/i, name: "Tenant", keywords: ["tenant", "organization", "company"] },
    { pattern: /\b(mrr|arr|revenue|churn|analytics)\b/i, name: "Metric", keywords: ["mrr", "arr", "revenue", "churn", "analytics"] },
  ];

  for (const { pattern, name, keywords } of entityPatterns) {
    if (pattern.test(lower)) {
      entities.push({ id: `entity-${name.toLowerCase()}`, type: "entity", name, description: `${name} entity`, required: true, keywords });
    }
  }

  // ─── ROLE DETECTION ───
  if (/\b(admin|administrator)\b/i.test(lower)) {
    roles.push({ id: "role-admin", type: "role", name: "Admin", description: "Administrator role", required: true, keywords: ["admin"] });
  }
  if (/\b(staff|team\s*member|employee)\b/i.test(lower)) {
    roles.push({ id: "role-staff", type: "role", name: "Staff", description: "Staff role", required: true, keywords: ["staff"] });
  }
  if (/\b(user|customer|client|member)\b/i.test(lower)) {
    roles.push({ id: "role-user", type: "role", name: "User", description: "User role", required: true, keywords: ["user", "customer"] });
  }

  // ─── WORKFLOW DETECTION (DOMAIN-ISOLATED) ───
  if (blueprint) {
    // BLUEPRINT MODE: Use workflows from the matched blueprint
    for (const flow of blueprint.requiredFlows) {
      workflows.push({
        id: `wf-${flow.replace(/\s+/g, "-").substring(0, 30).toLowerCase()}`,
        type: "workflow",
        name: flow.split("→")[0]?.trim() || flow.substring(0, 50),
        description: flow,
        required: true,
        keywords: flow.split(/[→,\s]+/).filter(w => w.length > 2),
      });
    }
  } else {
    // NO BLUEPRINT: Fall back to regex keyword matching
    if (/\b(checkout|purchase|buying)\b/i.test(lower)) {
      workflows.push({ id: "wf-checkout", type: "workflow", name: "Checkout", description: "Purchase workflow", required: true, keywords: ["checkout", "purchase"] });
    }
    if (/\b(booking|reservation|scheduling)\b/i.test(lower)) {
      workflows.push({ id: "wf-booking", type: "workflow", name: "Booking", description: "Booking workflow", required: true, keywords: ["booking", "reservation"] });
    }
    if (/\b(onboarding|signup|registration)\b/i.test(lower)) {
      workflows.push({ id: "wf-onboarding", type: "workflow", name: "Onboarding", description: "User onboarding", required: true, keywords: ["onboarding", "signup"] });
    }
  }

  const all = [...pages, ...components, ...features, ...entities, ...roles, ...workflows];

  return { projectType, pages, components, features, entities, roles, workflows, integrations: [], all };
}

// ═══════════════════════════════════════════════════════════
// STEP 2: ARCHITECTURE PLANNER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Plan the architecture from requirements.
 */
export function planArchitecture(matrix: RequirementMatrix, projectName: string, intentProfile?: { prioritizedSystems: string[]; primaryProblem: string; primaryGoal: string } | null): ArchitecturePlan {
  const routes: RoutePlan[] = [];
  const layouts: LayoutPlan[] = [];
  const navigation: NavigationPlan[] = [];
  const components: ComponentPlan[] = [];
  const dataModels: DataModelPlan[] = [];
  const apiRoutes: APIRoutePlan[] = [];

  // ─── ROUTES ───
  for (const page of matrix.pages) {
    const route: RoutePlan = {
      path: page.route || `/${page.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: page.name,
      components: [],
      description: page.description,
    };

    // Use blueprint components if available, otherwise fall back to hardcoded mapping
    if (page.components && page.components.length > 0) {
      route.components = page.components;
    } else if (page.name === "Home") {
      // Project-type-aware home page components
      if (matrix.projectType === "ecommerce") {
        route.components = ["Hero", "FeaturedProducts", "CategoryGrid", "Testimonials", "CTA"];
      } else if (matrix.projectType === "saas") {
        // SaaS home = dashboard
        route.components = ["DashboardStats", "Charts", "RecentActivity", "QuickActions"];
      } else if (matrix.projectType === "blog") {
        route.components = ["FeaturedPost", "PostGrid", "CategoryNav"];
      } else if (matrix.projectType === "portfolio") {
        route.components = ["Hero", "ProjectGrid", "Skills", "CTA"];
      } else {
        // Generic website/landing
        route.components = ["Hero", "Features", "Testimonials", "CTA", "Stats"];
      }
    } else if (page.name === "About") {
      route.components = ["Team", "Stats"];
    } else if (page.name === "Services") {
      route.components = ["Services"];
    } else if (page.name === "Contact") {
      route.components = ["ContactForm"];
    } else if (page.name === "Blog") {
      route.components = ["BlogList"];
    } else if (page.name === "Pricing") {
      route.components = ["Pricing"];
    } else if (page.name === "Testimonials") {
      route.components = ["Testimonials"];
    } else if (page.name === "Portfolio") {
      route.components = ["Portfolio"];
    } else if (page.name === "FAQ") {
      route.components = ["FAQ"];
    } else if (page.name === "Team") {
      route.components = ["Team"];
    } else if (page.name === "Dashboard") {
      route.components = ["Dashboard"];
    } else if (page.name === "Products" || page.name === "Catalog") {
      route.components = ["ProductGrid", "FilterSidebar"];
    } else if (page.name === "Checkout") {
      route.components = ["CheckoutForm"];
    } else if (page.name === "Cart") {
      route.components = ["CartItems", "CartSummary"];
    } else if (page.name === "Account") {
      route.components = ["ProfileForm", "SettingsForm"];
    } else if (page.name === "Admin") {
      route.components = ["DashboardContent", "DataTable"];
    } else if (page.name === "Leads") {
      // Use blueprint components if available, otherwise fallback
      route.components = page.keywords.some(k => ["lead", "pipeline"].includes(k))
        ? ["LeadPipeline", "LeadCard", "LeadForm"]
        : ["DataTable", "LeadForm"];
    } else if (page.name === "Members") {
      // Use blueprint components if available, otherwise fallback
      route.components = page.keywords.some(k => ["member", "membership"].includes(k))
        ? ["MemberTable", "MemberSearch", "MemberForm"]
        : ["DataTable", "MemberForm"];
    } else if (page.name === "Attendance") {
      // Use blueprint components if available, otherwise fallback
      route.components = page.keywords.some(k => ["attendance", "check-in"].includes(k))
        ? ["AttendanceCalendar", "AttendanceTable", "CheckInButton", "AttendanceStats"]
        : ["AttendanceCalendar"];
    } else if (page.name === "Billing") {
      // Use blueprint components if available, otherwise fallback
      route.components = page.keywords.some(k => ["billing", "invoice"].includes(k))
        ? ["InvoiceTable", "PaymentForm", "PlanSelector"]
        : ["BillingTable", "InvoiceGenerator"];
    } else if (page.name === "Staff") {
      // Use blueprint components if available, otherwise fallback
      route.components = page.keywords.some(k => ["staff", "employee"].includes(k))
        ? ["StaffTable", "StaffSchedule", "StaffForm"]
        : ["StaffTable", "StaffForm"];
    } else if (page.name === "Reports") {
      route.components = ["ReportsDashboard", "Charts"];
    } else if (page.name === "Orders") {
      route.components = ["OrderTable"];
    } else if (page.name === "Brands") {
      route.components = ["BrandGrid"];
    } else if (page.name === "Wishlist") {
      route.components = ["WishlistGrid"];
    } else if (page.name === "Reviews") {
      route.components = ["ReviewList", "ReviewForm"];
    } else if (page.name === "Login") {
      route.components = ["LoginForm"];
    } else if (page.name === "Register") {
      route.components = ["RegisterForm"];
    } else if (page.name === "Settings") {
      route.components = ["SettingsForm"];
    } else if (page.name === "Profile") {
      route.components = ["ProfileForm"];
    } else if (page.name === "Classes") {
      // Use blueprint components if available, otherwise fallback
      route.components = page.keywords.some(k => ["class", "schedule"].includes(k))
        ? ["ClassSchedule", "ClassCard", "BookingButton"]
        : ["ClassSchedule"];
    }

    // ═══ FALLBACK: Generate components for unmapped pages ═══
    // Never allow a page to have 0 components
    if (route.components.length === 0) {
      const pageNameLower = page.name.toLowerCase().replace(/\s+/g, "");
      // Generate a domain-appropriate component name from the page name
      const mainComponent = pageNameLower.charAt(0).toUpperCase() + pageNameLower.slice(1);
      const listComponent = `${mainComponent}List`;
      const formComponent = `${mainComponent}Form`;
      
      // Determine if this page is likely a list, form, or dashboard based on keywords
      const isList = (page.type as string) === "list" || page.keywords?.some(k => ["list", "table", "directory", "catalog"].includes(k));
      const isForm = (page.type as string) === "form" || page.keywords?.some(k => ["form", "create", "add", "edit"].includes(k));
      const isDashboard = (page.type as string) === "dashboard" || page.name.toLowerCase().includes("dashboard");
      const isCalendar = (page.type as string) === "calendar" || page.keywords?.some(k => ["calendar", "schedule", "booking"].includes(k));
      const isKanban = (page.type as string) === "kanban" || page.keywords?.some(k => ["pipeline", "kanban", "board"].includes(k));

      if (isDashboard) {
        route.components = [`${mainComponent}Stats`, `${mainComponent}Charts`, `${mainComponent}RecentActivity`];
      } else if (isCalendar) {
        route.components = [`${mainComponent}Calendar`, `${mainComponent}Form`];
      } else if (isKanban) {
        route.components = [`${mainComponent}Board`, `${mainComponent}Card`, `${mainComponent}Form`];
      } else if (isList) {
        route.components = [listComponent, `${mainComponent}Search`, `${mainComponent}Filters`];
      } else if (isForm) {
        route.components = [formComponent];
      } else {
        // Default: table + form for any unmapped page
        route.components = [listComponent, formComponent];
      }
    }

    routes.push(route);
  }

  // Add components from requirements that aren't page-specific
  for (const comp of matrix.components) {
    const exists = components.some(c => c.name === comp.name);
    if (!exists) {
      components.push({
        name: comp.name,
        type: "feature",
        props: [],
        description: comp.description,
      });
    }
  }

  // ─── LAYOUTS ───
  layouts.push({ name: "RootLayout", type: "root", components: ["Header", "Footer"] });
  if (matrix.pages.some(p => p.route?.startsWith("/dashboard") || p.route?.startsWith("/leads") || p.route?.startsWith("/members"))) {
    layouts.push({ name: "DashboardLayout", type: "dashboard", components: ["Sidebar", "Header"] });
  }
  if (matrix.pages.some(p => p.route === "/login" || p.route === "/register")) {
    layouts.push({ name: "AuthLayout", type: "auth", components: [] });
  }

  // ─── NAVIGATION ───
  for (const page of matrix.pages) {
    if (page.name === "Home") continue; // Home is usually logo link
    navigation.push({
      label: page.name,
      href: page.route || `/${page.name.toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  // ─── DATA MODELS ───
  for (const entity of matrix.entities) {
    const model: DataModelPlan = {
      name: entity.name,
      fields: getDefaultFields(entity.name),
      relationships: getDefaultRelationships(entity.name, matrix.entities),
    };
    dataModels.push(model);
  }

  // ─── API ROUTES ───
  for (const entity of matrix.entities) {
    const basePath = `/api/${entity.name.toLowerCase()}s`;
    apiRoutes.push({ path: basePath, method: "GET", description: `List ${entity.name}s`, entity: entity.name });
    apiRoutes.push({ path: basePath, method: "POST", description: `Create ${entity.name}`, entity: entity.name });
    apiRoutes.push({ path: `${basePath}/[id]`, method: "GET", description: `Get ${entity.name} by ID`, entity: entity.name });
    apiRoutes.push({ path: `${basePath}/[id]`, method: "PUT", description: `Update ${entity.name}`, entity: entity.name });
    apiRoutes.push({ path: `${basePath}/[id]`, method: "DELETE", description: `Delete ${entity.name}`, entity: entity.name });
  }

  // ═══ INTENT-DRIVEN PAGE EMPHASIS ═══
  // Reorder pages so that routes matching prioritizedSystems appear first
  if (intentProfile?.prioritizedSystems?.length) {
    const prioritized = intentProfile.prioritizedSystems;
    routes.sort((a, b) => {
      const aIdx = prioritized.findIndex(s =>
        a.name.toLowerCase().includes(s.toLowerCase()) ||
        a.components.some(c => c.toLowerCase().includes(s.toLowerCase()))
      );
      const bIdx = prioritized.findIndex(s =>
        b.name.toLowerCase().includes(s.toLowerCase()) ||
        b.components.some(c => c.toLowerCase().includes(s.toLowerCase()))
      );
      const aScore = aIdx >= 0 ? aIdx : 999;
      const bScore = bIdx >= 0 ? bIdx : 999;
      return aScore - bScore;
    });

    // Also reorder navigation to match
    navigation.sort((a, b) => {
      const aIdx = prioritized.findIndex(s =>
        a.label.toLowerCase().includes(s.toLowerCase())
      );
      const bIdx = prioritized.findIndex(s =>
        b.label.toLowerCase().includes(s.toLowerCase())
      );
      return (aIdx >= 0 ? aIdx : 999) - (bIdx >= 0 ? bIdx : 999);
    });
  }

  return { routes, layouts, navigation, components, dataModels, apiRoutes };
}

function getDefaultFields(entityName: string): DataModelPlan["fields"] {
  const common = [
    { name: "id", type: "string", required: true, description: "Unique identifier" },
    { name: "createdAt", type: "Date", required: true, description: "Creation timestamp" },
    { name: "updatedAt", type: "Date", required: true, description: "Last update timestamp" },
  ];

  const specific: Record<string, DataModelPlan["fields"]> = {
    Lead: [
      { name: "name", type: "string", required: true, description: "Lead name" },
      { name: "email", type: "string", required: true, description: "Contact email" },
      { name: "phone", type: "string", required: false, description: "Phone number" },
      { name: "status", type: "enum", required: true, description: "Lead status" },
      { name: "source", type: "string", required: false, description: "Lead source" },
    ],
    Member: [
      { name: "name", type: "string", required: true, description: "Member name" },
      { name: "email", type: "string", required: true, description: "Contact email" },
      { name: "phone", type: "string", required: false, description: "Phone number" },
      { name: "membershipType", type: "enum", required: true, description: "Membership tier" },
      { name: "status", type: "enum", required: true, description: "Active/Inactive" },
    ],
    Product: [
      { name: "name", type: "string", required: true, description: "Product name" },
      { name: "description", type: "string", required: true, description: "Product description" },
      { name: "price", type: "number", required: true, description: "Product price" },
      { name: "sku", type: "string", required: true, description: "Stock keeping unit" },
      { name: "stock", type: "number", required: true, description: "Stock quantity" },
    ],
    Order: [
      { name: "userId", type: "string", required: true, description: "Customer ID" },
      { name: "items", type: "array", required: true, description: "Order items" },
      { name: "total", type: "number", required: true, description: "Order total" },
      { name: "status", type: "enum", required: true, description: "Order status" },
    ],
    User: [
      { name: "name", type: "string", required: true, description: "User name" },
      { name: "email", type: "string", required: true, description: "Email address" },
      { name: "password", type: "string", required: true, description: "Hashed password" },
      { name: "role", type: "enum", required: true, description: "User role" },
    ],
    Staff: [
      { name: "name", type: "string", required: true, description: "Staff name" },
      { name: "email", type: "string", required: true, description: "Email address" },
      { name: "role", type: "enum", required: true, description: "Staff role" },
      { name: "department", type: "string", required: false, description: "Department" },
    ],
    Invoice: [
      { name: "memberId", type: "string", required: true, description: "Member ID" },
      { name: "amount", type: "number", required: true, description: "Invoice amount" },
      { name: "status", type: "enum", required: true, description: "Payment status" },
      { name: "dueDate", type: "Date", required: true, description: "Due date" },
    ],
    Attendance: [
      { name: "memberId", type: "string", required: true, description: "Member ID" },
      { name: "checkIn", type: "Date", required: true, description: "Check-in time" },
      { name: "checkOut", type: "Date", required: false, description: "Check-out time" },
      { name: "classId", type: "string", required: false, description: "Class ID" },
    ],
    Brand: [
      { name: "name", type: "string", required: true, description: "Brand name" },
      { name: "logo", type: "string", required: false, description: "Logo URL" },
      { name: "description", type: "string", required: false, description: "Brand description" },
    ],
    Review: [
      { name: "userId", type: "string", required: true, description: "Reviewer ID" },
      { name: "rating", type: "number", required: true, description: "Rating (1-5)" },
      { name: "comment", type: "string", required: false, description: "Review text" },
    ],
    Category: [
      { name: "name", type: "string", required: true, description: "Category name" },
      { name: "slug", type: "string", required: true, description: "URL slug" },
      { name: "parentId", type: "string", required: false, description: "Parent category" },
    ],
    Campaign: [
      { name: "name", type: "string", required: true, description: "Campaign name" },
      { name: "budget", type: "number", required: true, description: "Campaign budget" },
      { name: "startDate", type: "Date", required: true, description: "Start date" },
      { name: "endDate", type: "Date", required: true, description: "End date" },
    ],
    Ticket: [
      { name: "subject", type: "string", required: true, description: "Ticket subject" },
      { name: "description", type: "string", required: true, description: "Ticket description" },
      { name: "status", type: "enum", required: true, description: "Ticket status" },
      { name: "priority", type: "enum", required: true, description: "Priority level" },
    ],
    Task: [
      { name: "title", type: "string", required: true, description: "Task title" },
      { name: "assigneeId", type: "string", required: false, description: "Assigned to" },
      { name: "dueDate", type: "Date", required: false, description: "Due date" },
      { name: "status", type: "enum", required: true, description: "Task status" },
    ],
    Deal: [
      { name: "title", type: "string", required: true, description: "Deal title" },
      { name: "value", type: "number", required: true, description: "Deal value" },
      { name: "stage", type: "enum", required: true, description: "Pipeline stage" },
      { name: "leadId", type: "string", required: false, description: "Associated lead" },
    ],
    Class: [
      { name: "name", type: "string", required: true, description: "Class name" },
      { name: "instructorId", type: "string", required: true, description: "Instructor ID" },
      { name: "schedule", type: "string", required: true, description: "Class schedule" },
      { name: "capacity", type: "number", required: true, description: "Max capacity" },
    ],
  };

  return [...common, ...(specific[entityName] || [])];
}

function getDefaultRelationships(entityName: string, entities: Requirement[]): DataModelPlan["relationships"] {
  const rels: DataModelPlan["relationships"] = [];
  const entityNames = entities.map(e => e.name);

  if (entityName === "Order" && entityNames.includes("User")) {
    rels.push({ type: "belongsTo", target: "User", foreignKey: "userId" });
  }
  if (entityName === "Invoice" && entityNames.includes("Member")) {
    rels.push({ type: "belongsTo", target: "Member", foreignKey: "memberId" });
  }
  if (entityName === "Attendance" && entityNames.includes("Member")) {
    rels.push({ type: "belongsTo", target: "Member", foreignKey: "memberId" });
  }
  if (entityName === "Review" && entityNames.includes("User")) {
    rels.push({ type: "belongsTo", target: "User", foreignKey: "userId" });
  }
  if (entityName === "Review" && entityNames.includes("Product")) {
    rels.push({ type: "belongsTo", target: "Product", foreignKey: "productId" });
  }
  if (entityName === "Deal" && entityNames.includes("Lead")) {
    rels.push({ type: "belongsTo", target: "Lead", foreignKey: "leadId" });
  }
  if (entityName === "Task" && entityNames.includes("Staff")) {
    rels.push({ type: "belongsTo", target: "Staff", foreignKey: "assigneeId" });
  }
  if (entityName === "Category" && entityNames.includes("Category")) {
    rels.push({ type: "belongsTo", target: "Category", foreignKey: "parentId" });
  }

  return rels;
}

// ═══════════════════════════════════════════════════════════
// STEP 6: REQUIREMENT VALIDATOR IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Validate generated files against requirements.
 */
export function validateRequirements(
  files: Array<{ path: string; content: string; type: string }>,
  matrix: RequirementMatrix,
  architecture: ArchitecturePlan
): ValidationResult {
  const missingItems: string[] = [];

  // Validate pages
  const requiredPages = matrix.pages.map(p => p.name);
  const generatedPages = files
    .filter(f => f.path.includes("page.tsx") || f.path.endsWith(".html"))
    .map(f => {
      // Handle home page: src/app/page.tsx (no nested route)
      if (f.path === "src/app/page.tsx") return "Home";
      const match = f.path.match(/src\/app\/(.+)\/page\.tsx/);
      if (match) {
        let route = match[1].replace(/\(.*\)\//, "");
        // Convert route to page name: /members -> Members, /attendance -> Attendance
        if (route === "") return "Home";
        return route.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || null;
      }
      if (f.path === "index.html") return "Home";
      return null;
    })
    .filter(Boolean);

  const missingPages = requiredPages.filter(p => !generatedPages.includes(p));
  if (missingPages.length > 0) missingItems.push(...missingPages.map(p => `Page: ${p}`));

  // Validate components
  const requiredComponents = matrix.components.map(c => c.name);
  const generatedComponents = files
    .filter(f => f.path.includes("components/") && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")))
    .map(f => {
      const match = f.path.match(/components\/(.+)\.(tsx|jsx)$/);
      return match?.[1] || null;
    })
    .filter(Boolean);

  const missingComponents = requiredComponents.filter(c => !generatedComponents.includes(c));
  if (missingComponents.length > 0) missingItems.push(...missingComponents.map(c => `Component: ${c}`));

  // Validate features (check in file content)
  const requiredFeatures = matrix.features.map(f => f.name);
  const allContent = files.map(f => f.content.toLowerCase()).join(" ");
  const missingFeatures = requiredFeatures.filter(f => {
    const keywords = matrix.features.find(rf => rf.name === f)?.keywords || [];
    return !keywords.some(kw => allContent.includes(kw.toLowerCase()));
  });
  if (missingFeatures.length > 0) missingItems.push(...missingFeatures.map(f => `Feature: ${f}`));

  // Validate routes
  const requiredRoutes = architecture.routes.map(r => r.path);
  const generatedRoutes: string[] = files
    .filter(f => f.path.includes("page.tsx"))
    .map(f => {
      if (f.path === "src/app/page.tsx") return "/";
      const match = f.path.match(/src\/app\/(.+)\/page\.tsx/);
      if (match) {
        let route = match[1].replace(/\(.*\)\//, "");
        return `/${route}`;
      }
      return null;
    })
    .filter((r): r is string => r !== null);

  const missingRoutes = requiredRoutes.filter(r => !generatedRoutes.includes(r));
  if (missingRoutes.length > 0) missingItems.push(...missingRoutes.map(r => `Route: ${r}`));

  // Calculate coverage
  const totalRequired = requiredPages.length + requiredComponents.length + requiredFeatures.length + requiredRoutes.length;
  const totalGenerated = totalRequired - missingItems.length;
  const overallCoverage = totalRequired > 0 ? totalGenerated / totalRequired : 1;

  return {
    pages: { type: "pages", required: requiredPages, generated: generatedPages as string[], missing: missingPages, coverage: requiredPages.length > 0 ? (requiredPages.length - missingPages.length) / requiredPages.length : 1 },
    components: { type: "components", required: requiredComponents, generated: generatedComponents as string[], missing: missingComponents, coverage: requiredComponents.length > 0 ? (requiredComponents.length - missingComponents.length) / requiredComponents.length : 1 },
    features: { type: "features", required: requiredFeatures, generated: requiredFeatures.filter(f => !missingFeatures.includes(f)), missing: missingFeatures, coverage: requiredFeatures.length > 0 ? (requiredFeatures.length - missingFeatures.length) / requiredFeatures.length : 1 },
    routes: { type: "routes", required: requiredRoutes, generated: generatedRoutes, missing: missingRoutes, coverage: requiredRoutes.length > 0 ? (requiredRoutes.length - missingRoutes.length) / requiredRoutes.length : 1 },
    entities: { type: "entities", required: matrix.entities.map(e => e.name), generated: [], missing: [], coverage: 1 },
    // Validate workflows: check if workflow keywords appear in file content
    workflows: (() => {
      const requiredWorkflows = matrix.workflows.map(w => w.name);
      const foundWorkflows = requiredWorkflows.filter(wf => {
        const wfKeywords = matrix.workflows.find(w => w.name === wf)?.keywords || [];
        return wfKeywords.some(kw => allContent.includes(kw.toLowerCase()));
      });
      const missingWorkflows = requiredWorkflows.filter(w => !foundWorkflows.includes(w));
      return {
        type: "workflows" as const,
        required: requiredWorkflows,
        generated: foundWorkflows,
        missing: missingWorkflows,
        coverage: requiredWorkflows.length > 0 ? (requiredWorkflows.length - missingWorkflows.length) / requiredWorkflows.length : 1,
      };
    })(),
    overallCoverage,
    passed: missingItems.length === 0,
    missingItems,
  };
}

// ═══════════════════════════════════════════════════════════
// STEP 7: QUALITY SCORING IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Calculate comprehensive quality scores.
 * Uses component depth validation for honest scoring.
 */
export function calculateQualityScores(
  files: Array<{ path: string; content: string; type: string }>,
  validation: ValidationResult,
  buildSuccess: boolean,
  componentDepthScore?: number,
  placeholderCount?: number,
  blueprint?: DomainBlueprint | null,
  intentProfile?: { prioritizedSystems: string[] } | null
): QualityScores {
  // Coverage score (requirement fulfillment) — only counts files with real content
  const coverage = Math.round(validation.overallCoverage * 100);

  // Architecture score (file structure quality)
  let architectureScore = 0;
  const hasLayout = files.some(f => f.path === "src/app/layout.tsx");
  const hasGlobals = files.some(f => f.path === "src/app/globals.css");
  const hasPkg = files.some(f => f.path === "package.json");
  const hasTsconfig = files.some(f => f.path === "tsconfig.json");
  const hasTailwind = files.some(f => f.path.includes("tailwind.config"));
  const pageCount = files.filter(f => f.path.includes("page.tsx")).length;
  const componentCount = files.filter(f => f.path.includes("components/")).length;

  if (hasLayout) architectureScore += 15;
  if (hasGlobals) architectureScore += 10;
  if (hasPkg) architectureScore += 10;
  if (hasTsconfig) architectureScore += 5;
  if (hasTailwind) architectureScore += 5;
  if (pageCount >= 3) architectureScore += 15;
  else if (pageCount >= 2) architectureScore += 10;
  else if (pageCount >= 1) architectureScore += 5;
  if (componentCount >= 8) architectureScore += 20;
  else if (componentCount >= 5) architectureScore += 15;
  else if (componentCount >= 3) architectureScore += 10;
  else if (componentCount >= 1) architectureScore += 5;

  // Feature score (feature completeness)
  const featureScore = Math.round(validation.features.coverage * 100);

  // Build score
  const buildScore = buildSuccess ? 100 : 0;

  // Component depth score (real completeness vs placeholder stubs)
  const depthScore = componentDepthScore ?? 0;

  // UX score (based on component quality + depth)
  let uxScore = 0;
  const hasDarkMode = files.some(f => f.content.includes("dark") || f.content.includes("Dark"));
  const hasResponsive = files.some(f => f.content.includes("responsive") || f.content.includes("md:") || f.content.includes("lg:"));
  const hasTransitions = files.some(f => f.content.includes("transition") || f.content.includes("hover:"));

  if (hasDarkMode) uxScore += 20;
  if (hasResponsive) uxScore += 20;
  if (hasTransitions) uxScore += 15;
  uxScore += Math.round(depthScore * 0.45); // 45% of UX is component depth

  // P2-6: Workflow completeness score
  let workflowScore = 0;
  if (blueprint && blueprint.requiredFlows.length > 0) {
    // Check how many blueprint flows are represented in the generated files
    const allContent = files.map(f => f.content.toLowerCase()).join(" ");
    let flowsFound = 0;
    for (const flow of blueprint.requiredFlows) {
      const flowKeywords = flow.split(/[→,\s]+/).filter(w => w.length > 2);
      const found = flowKeywords.filter(kw => allContent.includes(kw.toLowerCase()));
      if (found.length >= Math.ceil(flowKeywords.length * 0.5)) flowsFound++;
    }
    workflowScore = Math.round((flowsFound / blueprint.requiredFlows.length) * 100);
  } else {
    // No blueprint — use validation workflows if available
    workflowScore = Math.round(validation.workflows.coverage * 100);
  }

  // P2-6: Domain correctness score (are we generating the RIGHT domain?)
  let domainScore = 100; // Default: no penalty if no blueprint
  if (blueprint) {
    // Check that generated files match the blueprint domain
    const allPaths = files.map(f => f.path.toLowerCase()).join(" ");
    const allContent = files.map(f => f.content.toLowerCase()).join(" ");
    let domainMatches = 0;
    let domainViolations = 0;

    // Check required pages exist
    for (const bpPage of blueprint.requiredPages) {
      const route = bpPage.route.replace(/\[.*?\]/g, "").replace(/\//g, "").toLowerCase();
      if (route === "" || route === "home") {
        domainMatches++; // Home always exists
      } else if (allPaths.includes(route)) {
        domainMatches++;
      }
    }

    // Check for cross-domain contamination (pages that DON'T belong to this blueprint)
    const blueprintPageNames = blueprint.requiredPages.map(p => p.name.toLowerCase());
    const allPageNames = files.filter(f => f.path.includes("page.tsx")).map(f => {
      const match = f.path.match(/\/([^/]+)\/page\.tsx/);
      return match ? match[1].toLowerCase() : "home";
    });

    for (const pageName of allPageNames) {
      if (!blueprintPageNames.includes(pageName) && pageName !== "home") {
        domainViolations++;
      }
    }

    domainScore = blueprint.requiredPages.length > 0
      ? Math.max(0, Math.round(((domainMatches - domainViolations) / blueprint.requiredPages.length) * 100))
      : 100;
  }

  // Intent alignment score — what fraction of prioritizedSystems produced matching pages/components
  let intentAlignment = 100; // Default: perfect if no intent provided
  if (intentProfile?.prioritizedSystems?.length) {
    const allContent = files.map(f => (f.path + " " + f.content).toLowerCase()).join(" ");
    let matched = 0;
    for (const system of intentProfile.prioritizedSystems) {
      const systemLower = system.toLowerCase();
      // Check if any file path or content references this system's keywords
      if (allContent.includes(systemLower) || allContent.includes(systemLower.replace(/\s+/g, ""))) {
        matched++;
      }
    }
    intentAlignment = Math.round((matched / intentProfile.prioritizedSystems.length) * 100);
  }

  // Overall (weighted) — depth is dominant, intent alignment is a new factor
  let overall = Math.round(
    coverage * 0.10 +
    architectureScore * 0.10 +
    featureScore * 0.08 +
    buildScore * 0.10 +
    depthScore * 0.30 +
    uxScore * 0.10 +
    workflowScore * 0.10 +
    domainScore * 0.10 +
    intentAlignment * 0.02
  );

  // NO QUALITY FLOOR — scores must reflect actual quality
  // If files are all stubs, score should be low. Period.

  return {
    coverage,
    architecture: Math.min(100, architectureScore),
    feature: featureScore,
    build: buildScore,
    ux: Math.min(100, uxScore),
    intentAlignment: Math.min(100, Math.max(0, intentAlignment)),
    overall: Math.min(100, Math.max(0, overall)),
  };
}
