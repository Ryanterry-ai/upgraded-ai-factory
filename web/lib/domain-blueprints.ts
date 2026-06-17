/**
 * Domain Blueprints — Real component specifications per project type.
 * Each blueprint defines what components MUST contain to be considered complete.
 */

export interface ComponentSpec {
  name: string;
  minLines: number;           // Minimum lines of real code
  requiredElements: string[]; // Must contain these JSX/TS elements
  requiredLogic: string[];    // Must contain these logic patterns
  description: string;
}

export interface DomainBlueprint {
  id: string;
  name: string;
  keywords: string[];
  requiredPages: { name: string; route: string; components: string[] }[];
  requiredComponents: ComponentSpec[];
  requiredState: string[];     // useState/useReducer patterns needed
  requiredFlows: string[];     // User flows that must work
  dataModels: string[];        // Entities that need real fields
}

// ═══════════════════════════════════════════════════════════
// ECOMMERCE BLUEPRINT
// ═══════════════════════════════════════════════════════════

const ECOMMERCE_BLUEPRINT: DomainBlueprint = {
  id: "ecommerce",
  name: "Ecommerce Store",
  keywords: ["ecommerce", "e-commerce", "shop", "store", "product", "cart", "checkout", "hyugalife", "supplement", "marketplace"],
  requiredPages: [
    { name: "Home", route: "/", components: ["Hero", "FeaturedProducts", "CategoryGrid", "Testimonials", "CTA"] },
    { name: "Products", route: "/products", components: ["ProductGrid", "FilterSidebar", "SortDropdown", "SearchBar"] },
    { name: "Product Detail", route: "/products/[id]", components: ["ProductGallery", "ProductInfo", "ReviewList", "RelatedProducts"] },
    { name: "Cart", route: "/cart", components: ["CartItems", "CartSummary", "CartActions"] },
    { name: "Checkout", route: "/checkout", components: ["CheckoutForm", "OrderSummary", "PaymentMethods"] },
    { name: "Account", route: "/account", components: ["ProfileForm", "OrderHistory", "WishlistGrid"] },
    { name: "Brands", route: "/brands", components: ["BrandGrid", "BrandFilter"] },
  ],
  requiredComponents: [
    {
      name: "ProductGrid",
      minLines: 30,
      requiredElements: ["map(", "className", "Image", "price", "button"],
      requiredLogic: ["useState", "grid", "product"],
      description: "Displays products in a responsive grid with images, prices, and add-to-cart buttons",
    },
    {
      name: "CartItems",
      minLines: 25,
      requiredElements: ["map(", "quantity", "remove", "price", "updateQuantity"],
      requiredLogic: ["useState", "cart", "total"],
      description: "Cart line items with quantity controls, remove button, and price calculation",
    },
    {
      name: "ProductGallery",
      minLines: 20,
      requiredElements: ["img", "onClick", "selected", "thumbnail"],
      requiredLogic: ["useState", "activeImage"],
      description: "Image gallery with thumbnails and main image display",
    },
    {
      name: "FilterSidebar",
      minLines: 30,
      requiredElements: ["checkbox", "range", "category", "brand", "price"],
      requiredLogic: ["useState", "filter", "onFilter"],
      description: "Filter panel with category, price range, brand, and rating filters",
    },
    {
      name: "CheckoutForm",
      minLines: 40,
      requiredElements: ["input", "label", "submit", "address", "payment"],
      requiredLogic: ["useState", "handleSubmit", "validation"],
      description: "Multi-step checkout with address, payment, and order review",
    },
  ],
  requiredState: ["cart", "products", "filters", "selectedProduct", "wishlist"],
  requiredFlows: ["browse → add to cart → checkout → payment", "search → filter → product detail → add to cart"],
  dataModels: ["Product", "Order", "Cart", "Category", "Brand", "Review"],
};

// ═══════════════════════════════════════════════════════════
// GYM CRM BLUEPRINT
// ═══════════════════════════════════════════════════════════

const GYM_CRM_BLUEPRINT: DomainBlueprint = {
  id: "gym-crm",
  name: "Gym CRM SaaS",
  keywords: ["gym", "crm", "fitness", "attendance", "members", "billing", "staff", "leads", "workout", "personal trainer", "health club"],
  requiredPages: [
    { name: "Dashboard", route: "/dashboard", components: ["DashboardStats", "RecentActivity", "UpcomingClasses"] },
    { name: "Members", route: "/members", components: ["MemberTable", "MemberSearch", "MemberForm"] },
    { name: "Attendance", route: "/attendance", components: ["AttendanceCalendar", "AttendanceTable", "CheckInButton", "AttendanceStats"] },
    { name: "Billing", route: "/billing", components: ["InvoiceTable", "PaymentForm", "PlanSelector"] },
    { name: "Staff", route: "/staff", components: ["StaffTable", "StaffSchedule", "StaffForm"] },
    { name: "Leads", route: "/leads", components: ["LeadPipeline", "LeadCard", "LeadForm"] },
    { name: "Reports", route: "/reports", components: ["RevenueChart", "AttendanceChart", "MemberGrowthChart", "ExportButton"] },
    { name: "Classes", route: "/classes", components: ["ClassSchedule", "ClassCard", "BookingButton"] },
  ],
  requiredComponents: [
    {
      name: "AttendanceCalendar",
      minLines: 50,
      requiredElements: ["calendar", "day", "month", "attend", "present", "absent", "className"],
      requiredLogic: ["useState", "currentMonth", "daysInMonth", "markAttendance", "filter"],
      description: "Interactive calendar showing attendance per day with color-coded status, month navigation, and member filter",
    },
    {
      name: "AttendanceTable",
      minLines: 35,
      requiredElements: ["table", "thead", "tbody", "member", "checkIn", "checkOut", "status"],
      requiredLogic: ["useState", "filter", "sort", "search"],
      description: "Tabular view of attendance records with search, filter by date/member, and status indicators",
    },
    {
      name: "MemberTable",
      minLines: 35,
      requiredElements: ["table", "name", "email", "status", "membership", "edit", "delete"],
      requiredLogic: ["useState", "search", "filter", "pagination"],
      description: "Member list with search, status badges, membership type, and action buttons",
    },
    {
      name: "InvoiceTable",
      minLines: 30,
      requiredElements: ["table", "invoice", "amount", "status", "paid", "pending", "overdue"],
      requiredLogic: ["useState", "filter", "total", "status"],
      description: "Invoice list with payment status, amounts, due dates, and filter by status",
    },
    {
      name: "LeadPipeline",
      minLines: 40,
      requiredElements: ["column", "lead", "stage", "drag", "card", "value", "probability"],
      requiredLogic: ["useState", "stages", "moveLead", "pipeline"],
      description: "Kanban-style lead pipeline with drag stages, lead cards with value and probability",
    },
    {
      name: "RevenueChart",
      minLines: 30,
      requiredElements: ["chart", "revenue", "month", "data", "bar", "line"],
      requiredLogic: ["useState", "period", "total", "chartData"],
      description: "Revenue over time chart with period selector (weekly/monthly/yearly)",
    },
    {
      name: "ClassSchedule",
      minLines: 35,
      requiredElements: ["schedule", "class", "time", "instructor", "capacity", "book"],
      requiredLogic: ["useState", "selectedDay", "available", "spots"],
      description: "Weekly class schedule with time slots, instructor info, capacity, and booking",
    },
  ],
  requiredState: ["members", "attendance", "invoices", "leads", "classes", "staff", "selectedMember", "currentMonth"],
  requiredFlows: [
    "member check-in → attendance recorded → stats updated",
    "lead captured → assigned to staff → followed up → converted",
    "class scheduled → members book → attendance tracked",
    "invoice generated → payment collected → status updated",
  ],
  dataModels: ["Member", "Attendance", "Invoice", "Staff", "Lead", "Class", "Plan"],
};

// ═══════════════════════════════════════════════════════════
// AGENCY BLUEPRINT
// ═══════════════════════════════════════════════════════════

const AGENCY_BLUEPRINT: DomainBlueprint = {
  id: "agency",
  name: "Digital Marketing Agency",
  keywords: ["agency", "marketing", "digital marketing", "branding", "seo", "social media", "advertising", "growth"],
  requiredPages: [
    { name: "Home", route: "/", components: ["Hero", "Services", "CaseStudies", "Testimonials", "CTA"] },
    { name: "Services", route: "/services", components: ["ServiceCards", "ProcessTimeline", "PricingTable"] },
    { name: "Portfolio", route: "/portfolio", components: ["PortfolioGrid", "CaseStudyCard", "FilterTags"] },
    { name: "About", route: "/about", components: ["TeamGrid", "CompanyStory", "Stats"] },
    { name: "Pricing", route: "/pricing", components: ["PricingCards", "FeatureComparison", "FAQ"] },
    { name: "Contact", route: "/contact", components: ["ContactForm", "MapEmbed", "OfficeInfo"] },
    { name: "Blog", route: "/blog", components: ["BlogGrid", "BlogCard", "CategoryFilter"] },
  ],
  requiredComponents: [
    {
      name: "Hero",
      minLines: 20,
      requiredElements: ["h1", "button", "subtitle"],
      requiredLogic: [],
      description: "Agency-specific hero with value proposition, not generic marketing copy",
    },
    {
      name: "CaseStudies",
      minLines: 30,
      requiredElements: ["case", "result", "metric", "client", "before", "after"],
      requiredLogic: ["useState", "selectedCase"],
      description: "Case study cards showing client work with before/after metrics and results",
    },
    {
      name: "ServiceCards",
      minLines: 25,
      requiredElements: ["service", "description", "icon", "learn more"],
      requiredLogic: ["map("],
      description: "Service offering cards with descriptions and CTAs",
    },
    {
      name: "PricingCards",
      minLines: 30,
      requiredElements: ["plan", "price", "feature", "month", "cta"],
      requiredLogic: ["map(", "annual", "monthly"],
      description: "Pricing tier cards with feature lists and billing toggle",
    },
  ],
  requiredState: ["selectedCase", "activeFilter", "billingCycle"],
  requiredFlows: ["browse services → view case studies → request quote", "view pricing → select plan → contact form"],
  dataModels: ["CaseStudy", "Service", "Contact"],
};

// ═══════════════════════════════════════════════════════════
// SAAS DASHBOARD BLUEPRINT
// ═══════════════════════════════════════════════════════════

const SAAS_DASHBOARD_BLUEPRINT: DomainBlueprint = {
  id: "saas",
  name: "SaaS Dashboard",
  keywords: ["saas", "dashboard", "analytics", "admin", "management", "subscription", "billing", "multi-tenant"],
  requiredPages: [
    { name: "Dashboard", route: "/dashboard", components: ["DashboardStats", "Charts", "RecentActivity", "QuickActions"] },
    { name: "Users", route: "/users", components: ["UserTable", "UserSearch", "RoleFilter"] },
    { name: "Analytics", route: "/analytics", components: ["RevenueChart", "UsageChart", "ConversionFunnel"] },
    { name: "Settings", route: "/settings", components: ["SettingsForm", "NotificationPrefs", "TeamMembers"] },
    { name: "Billing", route: "/billing", components: ["PlanCard", "InvoiceHistory", "PaymentMethod"] },
  ],
  requiredComponents: [
    {
      name: "DashboardStats",
      minLines: 25,
      requiredElements: ["stat", "value", "change", "trend", "icon"],
      requiredLogic: ["useState", "period"],
      description: "KPI stat cards with trend indicators and period comparison",
    },
    {
      name: "Charts",
      minLines: 35,
      requiredElements: ["chart", "data", "axis", "legend", "tooltip"],
      requiredLogic: ["useState", "chartType", "period"],
      description: "Multiple chart types (bar, line, pie) with data visualization",
    },
    {
      name: "UserTable",
      minLines: 30,
      requiredElements: ["table", "user", "email", "role", "status", "edit"],
      requiredLogic: ["useState", "search", "filter", "pagination"],
      description: "User management table with search, role filter, and actions",
    },
  ],
  requiredState: ["stats", "users", "charts", "settings", "period"],
  requiredFlows: ["login → dashboard → view stats → manage users → settings"],
  dataModels: ["User", "Subscription", "Invoice", "Activity"],
};

// ═══════════════════════════════════════════════════════════
// BLOG BLUEPRINT
// ═══════════════════════════════════════════════════════════

const BLOG_BLUEPRINT: DomainBlueprint = {
  id: "blog",
  name: "Blog / Content Platform",
  keywords: ["blog", "news", "magazine", "content", "article", "editorial", "publication"],
  requiredPages: [
    { name: "Home", route: "/", components: ["FeaturedPost", "PostGrid", "CategoryNav"] },
    { name: "Post", route: "/post/[slug]", components: ["PostContent", "AuthorBio", "RelatedPosts", "CommentSection"] },
    { name: "Category", route: "/category/[slug]", components: ["PostGrid", "CategoryHeader"] },
    { name: "About", route: "/about", components: ["AuthorBio", "SiteStory"] },
  ],
  requiredComponents: [
    {
      name: "PostGrid",
      minLines: 25,
      requiredElements: ["post", "title", "excerpt", "image", "date", "author"],
      requiredLogic: ["map("],
      description: "Blog post grid with featured images, titles, excerpts, and metadata",
    },
    {
      name: "PostContent",
      minLines: 30,
      requiredElements: ["article", "content", "h1", "image", "author", "date"],
      requiredLogic: [],
      description: "Full article view with rich content, images, and author info",
    },
  ],
  requiredState: ["posts", "selectedCategory", "searchQuery"],
  requiredFlows: ["browse posts → read article → share → related posts"],
  dataModels: ["Post", "Category", "Author", "Comment"],
};

// ═══════════════════════════════════════════════════════════
// PORTFOLIO BLUEPRINT
// ═══════════════════════════════════════════════════════════

const PORTFOLIO_BLUEPRINT: DomainBlueprint = {
  id: "portfolio",
  name: "Creative Portfolio",
  keywords: ["portfolio", "freelance", "showcase", "creative", "designer", "developer portfolio"],
  requiredPages: [
    { name: "Home", route: "/", components: ["Hero", "ProjectGrid", "Skills", "CTA"] },
    { name: "Projects", route: "/projects", components: ["ProjectGrid", "FilterTags", "ProjectCard"] },
    { name: "Project Detail", route: "/projects/[slug]", components: ["ProjectGallery", "ProjectInfo", "TechStack"] },
    { name: "About", route: "/about", components: ["Bio", "Skills", "Experience", "ContactForm"] },
  ],
  requiredComponents: [
    {
      name: "ProjectGrid",
      minLines: 25,
      requiredElements: ["project", "image", "title", "category", "link"],
      requiredLogic: ["useState", "filter"],
      description: "Project showcase grid with filtering by category",
    },
  ],
  requiredState: ["projects", "selectedFilter", "contactForm"],
  requiredFlows: ["view projects → filter → project detail → contact"],
  dataModels: ["Project", "Skill", "Experience"],
};

// ═══════════════════════════════════════════════════════════
// BLUEPRINT REGISTRY
// ═══════════════════════════════════════════════════════════

const ALL_BLUEPRINTS: DomainBlueprint[] = [
  ECOMMERCE_BLUEPRINT,
  GYM_CRM_BLUEPRINT,
  AGENCY_BLUEPRINT,
  SAAS_DASHBOARD_BLUEPRINT,
  BLOG_BLUEPRINT,
  PORTFOLIO_BLUEPRINT,
];

/**
 * Detect the best blueprint from a user prompt.
 */
export function detectBlueprint(prompt: string): DomainBlueprint | null {
  const lower = prompt.toLowerCase();
  let bestMatch: DomainBlueprint | null = null;
  let bestScore = 0;

  for (const bp of ALL_BLUEPRINTS) {
    let score = 0;
    for (const kw of bp.keywords) {
      if (lower.includes(kw)) score += kw.length; // longer matches = higher score
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = bp;
    }
  }

  return bestScore >= 3 ? bestMatch : null; // minimum threshold
}

/**
 * Get blueprint by ID.
 */
export function getBlueprint(id: string): DomainBlueprint | undefined {
  return ALL_BLUEPRINTS.find(bp => bp.id === id);
}

/**
 * Get all available blueprint IDs.
 */
export function listBlueprints(): { id: string; name: string; keywords: string[] }[] {
  return ALL_BLUEPRINTS.map(bp => ({ id: bp.id, name: bp.name, keywords: bp.keywords }));
}
