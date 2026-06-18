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
  complexity?: "low" | "medium" | "medium-high" | "high";  // Determines generation depth
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
  keywords: ["ecommerce", "e-commerce", "shop", "store", "product", "cart", "checkout", "supplement", "marketplace", "brand"],
  complexity: "medium-high",
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
    {
      name: "ReviewList",
      minLines: 25,
      requiredElements: ["star", "rating", "comment", "author", "date"],
      requiredLogic: ["useState", "sort", "filter"],
      description: "Product reviews with star ratings, comments, and sorting",
    },
    {
      name: "BrandGrid",
      minLines: 20,
      requiredElements: ["logo", "name", "description", "link"],
      requiredLogic: ["useState", "filter"],
      description: "Brand showcase grid with logos, descriptions, and product counts",
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
  keywords: ["gym", "gym owner", "crm", "crm saas", "fitness", "attendance", "member management", "members", "billing", "staff management", "staff", "lead management", "leads", "workout", "personal trainer", "health club", "class schedule", "check-in"],
  complexity: "medium",
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
  keywords: ["saas dashboard", "saas", "subscription", "multi-tenant", "multi tenant", "saas app"],
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

const STARTUP_LANDING_BLUEPRINT: DomainBlueprint = {
  id: "startup-landing",
  name: "Startup Landing Page",
  keywords: ["landing page", "startup", "saas landing", "product launch", "coming soon", "waitlist", "early access", "beta launch", "mvp launch"],
  requiredPages: [
    {
      name: "Home",
      route: "/",
      components: ["Hero", "ProblemSection", "Features", "Benefits", "HowItWorks", "SocialProof", "Testimonials", "Pricing", "FAQ", "CTA", "Footer"],
    },
  ],
  requiredComponents: [
    {
      name: "Hero",
      minLines: 30,
      requiredElements: ["headline", "subheadline", "cta", "hero image or video", "social proof badge"],
      requiredLogic: ["useState"],
      description: "Main hero with value proposition, CTA, and social proof",
    },
    {
      name: "ProblemSection",
      minLines: 25,
      requiredElements: ["problem statement", "pain points", "statistics", "empathy"],
      requiredLogic: [],
      description: "Problem/solution section highlighting user pain points",
    },
    {
      name: "Features",
      minLines: 35,
      requiredElements: ["feature cards", "icons", "descriptions", "grid layout"],
      requiredLogic: ["useState", "map"],
      description: "Feature showcase with grid layout and icons",
    },
    {
      name: "Benefits",
      minLines: 25,
      requiredElements: ["benefit list", "icons", "descriptions"],
      requiredLogic: [],
      description: "Benefits section with icon + text pairs",
    },
    {
      name: "HowItWorks",
      minLines: 30,
      requiredElements: ["step numbers", "step descriptions", "step icons", "flow"],
      requiredLogic: [],
      description: "Step-by-step how it works section",
    },
    {
      name: "SocialProof",
      minLines: 25,
      requiredElements: ["logos", "company names", "metrics", "counts"],
      requiredLogic: [],
      description: "Social proof with company logos and key metrics",
    },
    {
      name: "Testimonials",
      minLines: 30,
      requiredElements: ["testimonial cards", "quotes", "author", "avatar", "rating"],
      requiredLogic: ["useState"],
      description: "Customer testimonials carousel or grid",
    },
    {
      name: "Pricing",
      minLines: 40,
      requiredElements: ["pricing tiers", "price", "feature list", "cta", "toggle"],
      requiredLogic: ["useState", "toggle"],
      description: "Pricing tiers with feature comparison and monthly/annual toggle",
    },
    {
      name: "FAQ",
      minLines: 30,
      requiredElements: ["questions", "answers", "accordion", "expand/collapse"],
      requiredLogic: ["useState", "toggle"],
      description: "FAQ accordion with expand/collapse",
    },
    {
      name: "CTA",
      minLines: 20,
      requiredElements: ["headline", "subheadline", "cta button", "email input"],
      requiredLogic: ["useState"],
      description: "Final call-to-action with email capture",
    },
  ],
  requiredState: ["activeTestimonial", "pricingPeriod", "openFAQ", "email"],
  requiredFlows: ["view hero → see features → view pricing → click CTA → enter email → submit"],
  dataModels: ["User", "PricingPlan", "Testimonial", "FAQ"],
};

const STREAMING_MEDIA_BLUEPRINT: DomainBlueprint = {
  id: "streaming",
  name: "Streaming Media Platform",
  keywords: ["netflix", "streaming", "video", "movie", "series", "watch", "player", "media", "entertainment", "tv show", "binge", "content platform"],
  complexity: "high",
  requiredPages: [
    { name: "Home", route: "/", components: ["Hero", "ContinueWatching", "TrendingNow", "TopPicks", "CategoryRows"] },
    { name: "Browse", route: "/browse", components: ["CategoryTabs", "ContentGrid", "FilterBar"] },
    { name: "Player", route: "/watch/[id]", components: ["VideoPlayer", "EpisodeList", "MoreLikeThis", "Comments"] },
    { name: "Profiles", route: "/profiles", components: ["ProfileGrid", "ProfileEditor", "KidsProfile"] },
    { name: "My List", route: "/mylist", components: ["SavedGrid", "RemoveButton"] },
    { name: "Search", route: "/search", components: ["SearchBar", "SearchResults", "TrendingSearches"] },
    { name: "Account", route: "/account", components: ["SubscriptionPlan", "PaymentMethod", "ViewingHistory", "ParentalControls"] },
  ],
  requiredComponents: [
    {
      name: "VideoPlayer",
      minLines: 50,
      requiredElements: ["video", "controls", "progress", "fullscreen", "play", "pause", "volume", "skip"],
      requiredLogic: ["useState", "useEffect", "useRef", "setInterval"],
      description: "Full video player with play/pause, progress bar, volume, fullscreen, skip intro/credits",
    },
    {
      name: "CategoryRows",
      minLines: 35,
      requiredElements: ["row", "scroll", "poster", "title", "hover", "preview"],
      requiredLogic: ["useState", "useRef", "map", "scroll"],
      description: "Horizontal scrollable category rows with hover preview cards (Netflix-style)",
    },
    {
      name: "ProfileGrid",
      minLines: 30,
      requiredElements: ["avatar", "name", "edit", "kids", "lock"],
      requiredLogic: ["useState", "navigate"],
      description: "Profile selection grid with avatar, name, and edit/kids lock controls",
    },
    {
      name: "SubscriptionPlan",
      minLines: 35,
      requiredElements: ["plan", "price", "features", "upgrade", "downgrade", "cancel"],
      requiredLogic: ["useState", "handleSubmit"],
      description: "Subscription management with plan comparison, upgrade/downgrade, cancel flow",
    },
  ],
  requiredState: ["currentProfile", "watchHistory", " myList", "playbackPosition", "subscriptions"],
  requiredFlows: ["browse → select content → play → pause/resume → next episode", "search → select → play", "profile select → browse → my list", "subscribe → payment → activate"],
  dataModels: ["Profile", "Content", "WatchHistory", "Subscription", "Playlist"],
};

const RESTAURANT_BLUEPRINT: DomainBlueprint = {
  id: "restaurant",
  name: "Restaurant / Food Service",
  keywords: ["restaurant", "food", "menu", "dining", "cafe", "order", "delivery", "reservation", "book table", "dish", "cuisine", "chef", "bistro", "pizzeria", "sushi"],
  complexity: "medium",
  requiredPages: [
    { name: "Home", route: "/", components: ["Hero", "FeaturedDishes", "Testimonials", "CTA"] },
    { name: "Menu", route: "/menu", components: ["MenuGrid", "CategoryFilter", "DishCard", "SearchBar"] },
    { name: "Reservations", route: "/reservations", components: ["ReservationForm", "AvailabilityCalendar", "TimeSlotPicker"] },
    { name: "Order Online", route: "/order", components: ["OrderCart", "CheckoutForm", "OrderTracking"] },
    { name: "About", route: "/about", components: ["ChefBio", "Story", "Gallery"] },
    { name: "Contact", route: "/contact", components: ["ContactForm", "MapLocation", "HoursInfo"] },
  ],
  requiredComponents: [
    {
      name: "MenuGrid",
      minLines: 35,
      requiredElements: ["dish", "price", "image", "description", "category", "add to cart"],
      requiredLogic: ["useState", "filter", "map"],
      description: "Menu display with dish cards, prices, images, and category filtering",
    },
    {
      name: "ReservationForm",
      minLines: 35,
      requiredElements: ["date", "time", "guests", "name", "phone", "special requests"],
      requiredLogic: ["useState", "handleSubmit", "validation"],
      description: "Reservation form with date/time picker, party size, and validation",
    },
    {
      name: "OrderCart",
      minLines: 30,
      requiredElements: ["items", "quantity", "remove", "total", "checkout"],
      requiredLogic: ["useState", "add", "remove", "total"],
      description: "Order cart with item list, quantity controls, and total calculation",
    },
  ],
  requiredState: ["menuItems", "cartItems", "reservations", "orderHistory"],
  requiredFlows: ["browse menu → add to cart → checkout → track order", "select date/time → fill form → confirm reservation", "view menu → filter by category → select dish → add to cart"],
  dataModels: ["Dish", "Category", "Reservation", "Order", "OrderItem"],
};

const ADMIN_DASHBOARD_BLUEPRINT: DomainBlueprint = {
  id: "admin-dashboard",
  name: "Admin Dashboard",
  keywords: ["admin dashboard", "admin panel", "admin", "backoffice", "management panel", "control panel", "system admin", "ecommerce admin", "order management", "inventory management"],
  complexity: "high",
  requiredPages: [
    { name: "Dashboard", route: "/dashboard", components: ["StatsCards", "RecentActivity", "Charts", "QuickActions"] },
    { name: "Users", route: "/users", components: ["UserTable", "UserFilters", "UserActions"] },
    { name: "Analytics", route: "/analytics", components: ["RevenueChart", "TrafficChart", "ConversionFunnel"] },
    { name: "Settings", route: "/settings", components: ["SettingsForm", "ToggleSettings", "EmailTemplates"] },
    { name: "Orders", route: "/orders", components: ["OrderTable", "OrderFilters", "OrderDetail"] },
    { name: "Products", route: "/products", components: ["ProductTable", "ProductForm", "InventoryStatus"] },
  ],
  requiredComponents: [
    {
      name: "StatsCards",
      minLines: 30,
      requiredElements: ["card", "value", "change", "icon", "trend"],
      requiredLogic: ["useState", "useEffect"],
      description: "Dashboard stats cards with KPIs, trend indicators, and comparison values",
    },
    {
      name: "UserTable",
      minLines: 40,
      requiredElements: ["table", "columns", "sort", "filter", "pagination", "actions", "bulk"],
      requiredLogic: ["useState", "sort", "filter", "pagination"],
      description: "Data table with sorting, filtering, pagination, bulk actions, and row-level operations",
    },
    {
      name: "RevenueChart",
      minLines: 35,
      requiredElements: ["chart", "line", "bar", "revenue", "period", "compare"],
      requiredLogic: ["useState", "useEffect", "data processing"],
      description: "Revenue chart with line/bar toggle, period selector, and comparison mode",
    },
    {
      name: "OrderTable",
      minLines: 40,
      requiredElements: ["table", "order", "status", "customer", "date", "amount", "filter"],
      requiredLogic: ["useState", "sort", "filter", "search"],
      description: "Orders management table with status filters, search, and batch operations",
    },
    {
      name: "ProductTable",
      minLines: 35,
      requiredElements: ["table", "product", "inventory", "price", "stock", "edit"],
      requiredLogic: ["useState", "filter", "search"],
      description: "Product inventory table with stock levels, pricing, and quick-edit",
    },
  ],
  requiredState: ["users", "orders", "analytics", "settings", "notifications"],
  requiredFlows: ["view dashboard → drill into metric → take action", "manage users → edit → save", "view orders → filter → process → ship"],
  dataModels: ["User", "Order", "Product", "Analytics", "Setting"],
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
  STARTUP_LANDING_BLUEPRINT,
  STREAMING_MEDIA_BLUEPRINT,
  RESTAURANT_BLUEPRINT,
  ADMIN_DASHBOARD_BLUEPRINT,
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

/**
 * Get complexity multiplier for scaling generation depth.
 * Returns a multiplier for file count, component lines, and regeneration depth.
 */
export function getComplexityMultiplier(blueprint: DomainBlueprint | null): {
  fileMultiplier: number;
  componentMinLines: number;
  maxRegenerationAttempts: number;
  depthWeight: number;
} {
  const complexity = blueprint?.complexity ?? "medium";
  switch (complexity) {
    case "low":
      return { fileMultiplier: 0.8, componentMinLines: 20, maxRegenerationAttempts: 2, depthWeight: 0.25 };
    case "medium":
      return { fileMultiplier: 1.0, componentMinLines: 30, maxRegenerationAttempts: 3, depthWeight: 0.35 };
    case "medium-high":
      return { fileMultiplier: 1.3, componentMinLines: 40, maxRegenerationAttempts: 4, depthWeight: 0.40 };
    case "high":
      return { fileMultiplier: 1.8, componentMinLines: 50, maxRegenerationAttempts: 5, depthWeight: 0.45 };
    default:
      return { fileMultiplier: 1.0, componentMinLines: 30, maxRegenerationAttempts: 3, depthWeight: 0.35 };
  }
}
