/**
 * Architecture Engine — Requirements-to-Architecture pipeline.
 * Replaces template-driven generation with architecture-driven generation.
 */

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
  overall: number;       // Weighted overall %
}

// ═══════════════════════════════════════════════════════════
// STEP 1: REQUIREMENT ANALYZER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Analyze a user prompt and extract structured requirements.
 */
export function analyzeRequirements(prompt: string): RequirementMatrix {
  const lower = prompt.toLowerCase();
  const pages: Requirement[] = [];
  const components: Requirement[] = [];
  const features: Requirement[] = [];
  const entities: Requirement[] = [];
  const roles: Requirement[] = [];
  const workflows: Requirement[] = [];

  // ─── PROJECT TYPE DETECTION ───
  let projectType = "website";
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

  // ─── ALWAYS: HOME PAGE ───
  pages.push({ id: "page-home", type: "page", name: "Home", description: "Main landing page", required: true, keywords: ["home", "landing", "homepage"] });

  // ─── PAGE DETECTION ───
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
    { pattern: /\b(testimonials?\s*(page|section|reviews?|case\s*studies)?)\b/i, name: "Testimonials", route: "/testimonials", keywords: ["testimonials", "reviews", "case studies", "what clients say"] },
    { pattern: /\b(products?\s*(page|catalog|listing|grid)?)\b/i, name: "Products", route: "/products", keywords: ["products", "catalog", "listing"] },
    { pattern: /\b(checkout\s*(page|section)?)\b/i, name: "Checkout", route: "/checkout", keywords: ["checkout", "payment", "purchase"] },
    { pattern: /\b(wishlist|wish\s*list)\b/i, name: "Wishlist", route: "/wishlist", keywords: ["wishlist", "wish list", "saved"] },
    { pattern: /\b(reviews?\s*(page|section)?)\b/i, name: "Reviews", route: "/reviews", keywords: ["reviews", "ratings", "feedback"] },
    { pattern: /\b(reports?\s*(page|dashboard)?)\b/i, name: "Reports", route: "/reports", keywords: ["reports", "analytics", "insights"] },
    { pattern: /\b(members?|memberships?)\b/i, name: "Members", route: "/members", keywords: ["members", "membership", "subscribers"] },
    { pattern: /\b(attendance|check.?in)\b/i, name: "Attendance", route: "/attendance", keywords: ["attendance", "check-in", "checkin"] },
    { pattern: /\b(billing|invoices?|payments?)\b/i, name: "Billing", route: "/billing", keywords: ["billing", "invoices", "payments"] },
    { pattern: /\b(staff|employees?|team\s*manage)\b/i, name: "Staff", route: "/staff", keywords: ["staff", "employees", "team management"] },
    { pattern: /\b(leads?|prospects?|clients?)\b/i, name: "Leads", route: "/leads", keywords: ["leads", "prospects", "clients", "pipeline"] },
    { pattern: /\b(orders?)\b/i, name: "Orders", route: "/orders", keywords: ["orders", "order management"] },
    { pattern: /\b(brand\s*(pages?|section)?)\b/i, name: "Brands", route: "/brands", keywords: ["brands", "brand pages"] },
    { pattern: /\b(settings?\s*(page|section)?)\b/i, name: "Settings", route: "/settings", keywords: ["settings", "preferences", "configuration"] },
    { pattern: /\b(profile\s*(page|section)?)\b/i, name: "Profile", route: "/profile", keywords: ["profile", "account", "user profile"] },
    { pattern: /\b(login|sign.?in)\b/i, name: "Login", route: "/login", keywords: ["login", "sign in"] },
    { pattern: /\b(register|sign.?up|create\s*account)\b/i, name: "Register", route: "/register", keywords: ["register", "sign up", "create account"] },
    { pattern: /\b(dashboard)\b/i, name: "Dashboard", route: "/dashboard", keywords: ["dashboard", "overview", "home"] },
  ];

  for (const { pattern, name, route, keywords } of pagePatterns) {
    if (pattern.test(lower)) {
      pages.push({ id: `page-${name.toLowerCase()}`, type: "page", name, description: `${name} page`, required: true, route, keywords });
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

  // ─── WORKFLOW DETECTION ───
  if (/\b(checkout|purchase|buying)\b/i.test(lower)) {
    workflows.push({ id: "wf-checkout", type: "workflow", name: "Checkout", description: "Purchase workflow", required: true, keywords: ["checkout", "purchase"] });
  }
  if (/\b(booking|reservation|scheduling)\b/i.test(lower)) {
    workflows.push({ id: "wf-booking", type: "workflow", name: "Booking", description: "Booking workflow", required: true, keywords: ["booking", "reservation"] });
  }
  if (/\b(onboarding|signup|registration)\b/i.test(lower)) {
    workflows.push({ id: "wf-onboarding", type: "workflow", name: "Onboarding", description: "User onboarding", required: true, keywords: ["onboarding", "signup"] });
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
export function planArchitecture(matrix: RequirementMatrix, projectName: string): ArchitecturePlan {
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

    // Map pages to their components
    if (page.name === "Home") {
      route.components = ["Hero", "Features", "Testimonials", "CTA", "Stats"];
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
    } else if (page.name === "Leads") {
      route.components = ["DataTable", "LeadForm"];
    } else if (page.name === "Members") {
      route.components = ["DataTable", "MemberForm"];
    } else if (page.name === "Attendance") {
      route.components = ["AttendanceCalendar"];
    } else if (page.name === "Billing") {
      route.components = ["BillingTable", "InvoiceGenerator"];
    } else if (page.name === "Staff") {
      route.components = ["StaffTable", "StaffForm"];
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
      const match = f.path.match(/src\/app\/(.+)\/page\.tsx/);
      if (match) {
        const route = match[1].replace(/\(.*\)\//, "");
        return route === "" ? "Home" : route.charAt(0).toUpperCase() + route.slice(1);
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
  const generatedRoutes = files
    .filter(f => f.path.includes("page.tsx"))
    .map(f => {
      const match = f.path.match(/src\/app\/(.+)\/page\.tsx/);
      if (match) {
        const route = match[1].replace(/\(.*\)\//, "");
        return `/${route}`;
      }
      return "/";
    });

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
 */
export function calculateQualityScores(
  files: Array<{ path: string; content: string; type: string }>,
  validation: ValidationResult,
  buildSuccess: boolean
): QualityScores {
  // Coverage score (requirement fulfillment)
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

  // UX score (based on component quality)
  let uxScore = 0;
  const hasDarkMode = files.some(f => f.content.includes("dark") || f.content.includes("Dark"));
  const hasResponsive = files.some(f => f.content.includes("responsive") || f.content.includes("md:") || f.content.includes("lg:"));
  const hasTransitions = files.some(f => f.content.includes("transition") || f.content.includes("hover:"));

  if (hasDarkMode) uxScore += 30;
  if (hasResponsive) uxScore += 30;
  if (hasTransitions) uxScore += 20;
  if (componentCount >= 5) uxScore += 20;

  // Overall (weighted)
  const overall = Math.round(
    coverage * 0.30 +
    architectureScore * 0.25 +
    featureScore * 0.20 +
    buildScore * 0.15 +
    uxScore * 0.10
  );

  return {
    coverage,
    architecture: Math.min(100, architectureScore),
    feature: featureScore,
    build: buildScore,
    ux: Math.min(100, uxScore),
    overall: Math.min(100, overall),
  };
}
