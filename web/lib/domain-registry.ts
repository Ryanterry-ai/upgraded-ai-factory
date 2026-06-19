/**
 * DOMAIN REGISTRY
 *
 * The single source of truth for all supported business domains.
 * Every domain defines: entities, workflows, pages, dashboards, business rules, mock data.
 *
 * Scaling strategy: 50 domains × real entities × real workflows × connected data
 * NOT 500 templates with different colors and copy.
 *
 * Business users judge output by one thing: "Does this understand how my business actually works?"
 */

// ═══════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════

export interface EntityField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "enum" | "ref";
  enumValues?: string[];
  refEntity?: string;       // for "ref" type — which entity it references
  required: boolean;
  unique?: boolean;
  description: string;
}

export interface Entity {
  id: string;
  name: string;              // e.g. "Product", "Lead", "Patient"
  plural: string;            // e.g. "Products", "Leads", "Patients"
  fields: EntityField[];
  description: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredEntities?: string[];  // entities that must exist for this step
  triggers?: string[];          // what causes this step to start
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;               // what starts the workflow
  steps: WorkflowStep[];
  outputEntity?: string;         // what entity is created/updated at the end
}

export interface DashboardWidget {
  id: string;
  name: string;
  type: "metric" | "chart" | "table" | "list" | "kanban" | "calendar";
  dataEntity: string;           // which entity provides data
  aggregation?: "sum" | "count" | "average" | "group-by" | "trend";
  description: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  persona: string;              // who sees this dashboard (owner, staff, admin)
}

export interface Page {
  id: string;
  name: string;
  route: string;
  type: "list" | "detail" | "form" | "dashboard" | "calendar" | "kanban" | "report";
  primaryEntity: string;
  description: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  entity: string;
  condition: string;            // human-readable condition
  action: string;               // what happens when condition is met
}

export interface DomainBlueprint {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  category: string;             // "commerce" | "services" | "healthcare" | "property" | "software" | "industry"
  description: string;
  keywords: string[];           // for detection from user prompt

  entities: Entity[];
  workflows: Workflow[];
  pages: Page[];
  dashboards: Dashboard[];
  businessRules: BusinessRule[];

  // Mock data generator will use entities to produce realistic data
  // No hardcoded mock data — generated from entity definitions
  mockDataConfig: {
    minEntities: number;        // minimum entities of each type to generate
    maxEntities: number;
    indianMarket: boolean;      // use ₹ INR, Indian names, Indian cities
    currency: string;
  };
}

// ═══════════════════════════════════════════════════════════
// TIER 1 — LAUNCH-CRITICAL (10 domains)
// ═══════════════════════════════════════════════════════════

const SUPPLEMENT_STORE: DomainBlueprint = {
  id: "supplement-store",
  name: "Supplement Store",
  tier: 1,
  category: "commerce",
  description: "Online supplement store with FSSAI compliance, subscriptions, and goal-based shopping",
  keywords: ["supplement", "protein", "whey", "creatine", "nutrition", "health store", "fitness store"],

  entities: [
    {
      id: "product", name: "Product", plural: "Products",
      description: "Supplement product with FSSAI certification",
      fields: [
        { name: "id", type: "string", required: true, unique: true, description: "Product ID" },
        { name: "name", type: "string", required: true, description: "Product name" },
        { name: "brand", type: "string", required: true, description: "Brand name" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
        { name: "originalPrice", type: "number", required: true, description: "MRP for discount display" },
        { name: "category", type: "enum", enumValues: ["protein", "recovery", "vitality", "brain", "weight", "pre-workout", "vitamins"], required: true, description: "Product category" },
        { name: "stock", type: "number", required: true, description: "Current inventory count" },
        { name: "reorderPoint", type: "number", required: true, description: "Stock level to trigger reorder" },
        { name: "rating", type: "number", required: true, description: "Average rating 0-5" },
        { name: "reviewCount", type: "number", required: true, description: "Total reviews" },
        { name: "fssai", type: "string", required: true, description: "FSSAI license number" },
        { name: "veg", type: "boolean", required: true, description: "Vegetarian status" },
        { name: "weight", type: "string", required: true, description: "Weight/quantity" },
        { name: "flavor", type: "string", required: false, description: "Flavor variant" },
        { name: "benefits", type: "string", required: true, description: "Key benefits" },
      ],
    },
    {
      id: "customer", name: "Customer", plural: "Customers",
      description: "Customer with membership tier",
      fields: [
        { name: "id", type: "string", required: true, unique: true, description: "Customer ID" },
        { name: "name", type: "string", required: true, description: "Full name" },
        { name: "email", type: "string", required: true, unique: true, description: "Email address" },
        { name: "phone", type: "string", required: true, description: "Phone number" },
        { name: "city", type: "string", required: true, description: "City" },
        { name: "totalSpent", type: "number", required: true, description: "Lifetime spend in INR" },
        { name: "membership", type: "enum", enumValues: ["bronze", "silver", "gold", "platinum"], required: true, description: "Membership tier" },
      ],
    },
    {
      id: "order", name: "Order", plural: "Orders",
      description: "Customer order with items and status",
      fields: [
        { name: "id", type: "string", required: true, unique: true, description: "Order ID" },
        { name: "customerId", type: "ref", refEntity: "customer", required: true, description: "Customer who placed order" },
        { name: "items", type: "string", required: true, description: "Order line items" },
        { name: "total", type: "number", required: true, description: "Order total in INR" },
        { name: "status", type: "enum", enumValues: ["pending", "processing", "shipped", "delivered", "cancelled"], required: true, description: "Order status" },
        { name: "paymentMethod", type: "enum", enumValues: ["upi", "cod", "card", "netbanking"], required: true, description: "Payment method" },
      ],
    },
    {
      id: "inventory", name: "InventoryMovement", plural: "InventoryMovements",
      description: "Stock movement (sale, restock, adjustment)",
      fields: [
        { name: "id", type: "string", required: true, unique: true, description: "Movement ID" },
        { name: "productId", type: "ref", refEntity: "product", required: true, description: "Product affected" },
        { name: "quantity", type: "number", required: true, description: "Change in stock (+/-)" },
        { name: "type", type: "enum", enumValues: ["sale", "restock", "adjustment"], required: true, description: "Movement type" },
        { name: "orderId", type: "ref", refEntity: "order", required: false, description: "Related order (for sales)" },
      ],
    },
    {
      id: "subscription", name: "Subscription", plural: "Subscriptions",
      description: "Recurring supplement subscription",
      fields: [
        { name: "id", type: "string", required: true, unique: true, description: "Subscription ID" },
        { name: "customerId", type: "ref", refEntity: "customer", required: true, description: "Subscriber" },
        { name: "productId", type: "ref", refEntity: "product", required: true, description: "Subscribed product" },
        { name: "frequency", type: "enum", enumValues: ["weekly", "biweekly", "monthly"], required: true, description: "Delivery frequency" },
        { name: "status", type: "enum", enumValues: ["active", "paused", "cancelled"], required: true, description: "Subscription status" },
      ],
    },
  ],

  workflows: [
    {
      id: "wf-purchase", name: "Product Purchase", description: "End-to-end customer purchase flow",
      trigger: "Customer browses and adds to cart",
      steps: [
        { id: "browse", name: "Browse Products", description: "Customer views catalog", triggers: ["page_load"] },
        { id: "add-cart", name: "Add to Cart", description: "Customer adds product", requiredEntities: ["product"] },
        { id: "checkout", name: "Checkout", description: "Customer enters shipping and payment", requiredEntities: ["customer"] },
        { id: "payment", name: "Payment", description: "Process UPI/COD/Card payment" },
        { id: "fulfill", name: "Fulfillment", description: "Pick, pack, and ship", requiredEntities: ["inventory"] },
        { id: "deliver", name: "Delivery", description: "Deliver to customer", requiredEntities: ["order"] },
      ],
      outputEntity: "order",
    },
    {
      id: "wf-subscription", name: "Subscription Lifecycle", description: "Manage recurring subscriptions",
      trigger: "Customer subscribes to product",
      steps: [
        { id: "subscribe", name: "Subscribe", description: "Customer selects frequency" },
        { id: "recurring-charge", name: "Recurring Charge", description: "Auto-charge on schedule" },
        { id: "ship", name: "Auto-Ship", description: "Automatically ship on schedule" },
        { id: "renew", name: "Renewal", description: "Subscription renews or pauses" },
      ],
      outputEntity: "subscription",
    },
  ],

  pages: [
    { id: "home", name: "Home", route: "/", type: "dashboard", primaryEntity: "product", description: "Storefront homepage" },
    { id: "catalog", name: "Product Catalog", route: "/products", type: "list", primaryEntity: "product", description: "Browse all products" },
    { id: "product-detail", name: "Product Detail", route: "/products/[id]", type: "detail", primaryEntity: "product", description: "Single product page" },
    { id: "cart", name: "Shopping Cart", route: "/cart", type: "list", primaryEntity: "order", description: "Cart with items" },
    { id: "checkout", name: "Checkout", route: "/checkout", type: "form", primaryEntity: "order", description: "Shipping and payment" },
    { id: "orders", name: "My Orders", route: "/orders", type: "list", primaryEntity: "order", description: "Order history" },
    { id: "subscriptions", name: "My Subscriptions", route: "/subscriptions", type: "list", primaryEntity: "subscription", description: "Active subscriptions" },
    { id: "dashboard", name: "Admin Dashboard", route: "/admin", type: "dashboard", primaryEntity: "order", description: "Revenue, orders, inventory" },
    { id: "admin-products", name: "Product Management", route: "/admin/products", type: "list", primaryEntity: "product", description: "Manage products" },
    { id: "admin-inventory", name: "Inventory", route: "/admin/inventory", type: "list", primaryEntity: "inventory", description: "Stock levels and movements" },
  ],

  dashboards: [
    {
      id: "owner-dashboard", name: "Store Owner Dashboard", description: "Overview of store performance", persona: "owner",
      widgets: [
        { id: "revenue", name: "Total Revenue", type: "metric", dataEntity: "order", aggregation: "sum", description: "Revenue from delivered orders" },
        { id: "orders-count", name: "Total Orders", type: "metric", dataEntity: "order", aggregation: "count", description: "Total order count" },
        { id: "aov", name: "Average Order Value", type: "metric", dataEntity: "order", aggregation: "average", description: "AOV in INR" },
        { id: "top-products", name: "Top Products", type: "chart", dataEntity: "order", aggregation: "group-by", description: "Best-selling products" },
        { id: "low-stock", name: "Low Stock Alerts", type: "list", dataEntity: "product", description: "Products below reorder point" },
        { id: "repeat-customers", name: "Repeat Customers", type: "metric", dataEntity: "customer", aggregation: "count", description: "Customers with 2+ orders" },
      ],
    },
  ],

  businessRules: [
    { id: "br-reorder", name: "Auto-Reorder Alert", description: "Alert when stock below reorder point", entity: "product", condition: "product.stock <= product.reorderPoint", action: "Create inventory alert" },
    { id: "br-fssai", name: "FSSAI Validation", description: "All products must have FSSAI number", entity: "product", condition: "product.fssai is empty", action: "Block product listing" },
    { id: "br-cancel", name: "Cancel Stock Restore", description: "Restore stock when order cancelled", entity: "order", condition: "order.status changes to 'cancelled'", action: "Increase product stock by ordered quantity" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const ECOMMERCE_STORE: DomainBlueprint = {
  id: "ecommerce-store",
  name: "Ecommerce Store",
  tier: 1,
  category: "commerce",
  description: "General-purpose ecommerce store with products, cart, checkout, and orders",
  keywords: ["ecommerce", "e-commerce", "shop", "store", "product", "cart", "checkout", "marketplace", "buy"],

  entities: [
    { id: "product", name: "Product", plural: "Products", description: "Store product", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Product ID" },
      { name: "name", type: "string", required: true, description: "Product name" },
      { name: "price", type: "number", required: true, description: "Price in INR" },
      { name: "category", type: "string", required: true, description: "Category" },
      { name: "stock", type: "number", required: true, description: "Stock count" },
      { name: "rating", type: "number", required: true, description: "Rating 0-5" },
    ]},
    { id: "customer", name: "Customer", plural: "Customers", description: "Store customer", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Customer ID" },
      { name: "name", type: "string", required: true, description: "Full name" },
      { name: "email", type: "string", required: true, unique: true, description: "Email" },
      { name: "totalSpent", type: "number", required: true, description: "Lifetime spend" },
    ]},
    { id: "order", name: "Order", plural: "Orders", description: "Customer order", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Order ID" },
      { name: "customerId", type: "ref", refEntity: "customer", required: true, description: "Customer" },
      { name: "total", type: "number", required: true, description: "Order total" },
      { name: "status", type: "enum", enumValues: ["pending", "processing", "shipped", "delivered", "cancelled"], required: true, description: "Status" },
    ]},
  ],

  workflows: [
    { id: "wf-purchase", name: "Customer Purchase", description: "Browse → Cart → Checkout → Delivery", trigger: "Customer visits store",
      steps: [
        { id: "browse", name: "Browse", description: "View products" },
        { id: "cart", name: "Add to Cart", description: "Add items" },
        { id: "checkout", name: "Checkout", description: "Enter details" },
        { id: "payment", name: "Payment", description: "Process payment" },
        { id: "ship", name: "Ship", description: "Fulfill order" },
        { id: "deliver", name: "Deliver", description: "Customer receives" },
      ], outputEntity: "order" },
    { id: "wf-inventory", name: "Inventory Reorder", description: "Low stock → PO → Supplier → Restock", trigger: "Stock falls below reorder point",
      steps: [
        { id: "detect", name: "Low Stock Detected", description: "Alert triggered" },
        { id: "po", name: "Create PO", description: "Purchase order created" },
        { id: "confirm", name: "Supplier Confirms", description: "Supplier accepts" },
        { id: "receive", name: "Receive Stock", description: "Goods received" },
        { id: "update", name: "Update Inventory", description: "Stock levels updated" },
      ], outputEntity: "product" },
    { id: "wf-returns", name: "Return & Refund", description: "Return request → Approve → Refund → Restock", trigger: "Customer requests return",
      steps: [
        { id: "request", name: "Return Requested", description: "Customer initiates" },
        { id: "approve", name: "Approve Return", description: "Staff reviews" },
        { id: "receive-return", name: "Receive Return", description: "Product returned" },
        { id: "refund", name: "Process Refund", description: "Refund issued" },
        { id: "restock", name: "Restock", description: "Product restocked" },
      ], outputEntity: "order" },
  ],

  pages: [
    { id: "home", name: "Home", route: "/", type: "dashboard", primaryEntity: "product", description: "Storefront" },
    { id: "catalog", name: "Catalog", route: "/products", type: "list", primaryEntity: "product", description: "Browse products" },
    { id: "cart", name: "Cart", route: "/cart", type: "list", primaryEntity: "order", description: "Shopping cart" },
    { id: "checkout", name: "Checkout", route: "/checkout", type: "form", primaryEntity: "order", description: "Checkout" },
    { id: "orders", name: "Orders", route: "/orders", type: "list", primaryEntity: "order", description: "Order history" },
    { id: "admin", name: "Admin Dashboard", route: "/admin", type: "dashboard", primaryEntity: "order", description: "Store management" },
  ],

  dashboards: [
    { id: "owner", name: "Owner Dashboard", description: "Store overview", persona: "owner",
      widgets: [
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "order", aggregation: "sum", description: "Total revenue" },
        { id: "orders", name: "Orders", type: "metric", dataEntity: "order", aggregation: "count", description: "Order count" },
        { id: "aov", name: "AOV", type: "metric", dataEntity: "order", aggregation: "average", description: "Average order" },
      ] },
  ],

  businessRules: [
    { id: "br-stock", name: "Stock Check", description: "Block checkout if out of stock", entity: "product", condition: "product.stock <= 0", action: "Show out of stock message" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const GYM_CRM: DomainBlueprint = {
  id: "gym-crm",
  name: "Gym CRM",
  tier: 1,
  category: "services",
  description: "Gym management with leads, memberships, check-ins, trainers, and billing",
  keywords: ["gym", "fitness", "membership", "workout", "trainer", "exercise", "health club"],

  entities: [
    { id: "lead", name: "Lead", plural: "Leads", description: "Potential gym member", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Lead ID" },
      { name: "name", type: "string", required: true, description: "Name" },
      { name: "phone", type: "string", required: true, description: "Phone" },
      { name: "source", type: "enum", enumValues: ["walk-in", "referral", "instagram", "google-ads"], required: true, description: "Lead source" },
      { name: "status", type: "enum", enumValues: ["new", "contacted", "tour-scheduled", "tour-completed", "membership-sold", "lost"], required: true, description: "Lead status" },
    ]},
    { id: "member", name: "Member", plural: "Members", description: "Active gym member", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Member ID" },
      { name: "name", type: "string", required: true, description: "Name" },
      { name: "email", type: "string", required: true, description: "Email" },
      { name: "membership", type: "enum", enumValues: ["basic", "standard", "premium", "vip"], required: true, description: "Membership tier" },
      { name: "joinDate", type: "date", required: true, description: "Join date" },
    ]},
    { id: "trainer", name: "Trainer", plural: "Trainers", description: "Gym trainer/instructor", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Trainer ID" },
      { name: "name", type: "string", required: true, description: "Name" },
      { name: "specialization", type: "string", required: true, description: "Specialty" },
      { name: "availability", type: "string", required: true, description: "Available hours" },
    ]},
    { id: "checkin", name: "CheckIn", plural: "CheckIns", description: "Member check-in record", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Check-in ID" },
      { name: "memberId", type: "ref", refEntity: "member", required: true, description: "Member" },
      { name: "checkInTime", type: "date", required: true, description: "Check-in time" },
      { name: "activity", type: "enum", enumValues: ["gym-floor", "yoga-class", "hiit-class", "personal-training", "swimming"], required: true, description: "Activity type" },
    ]},
    { id: "payment", name: "Payment", plural: "Payments", description: "Membership payment", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Payment ID" },
      { name: "memberId", type: "ref", refEntity: "member", required: true, description: "Member" },
      { name: "amount", type: "number", required: true, description: "Amount in INR" },
      { name: "status", type: "enum", enumValues: ["paid", "overdue", "pending"], required: true, description: "Payment status" },
    ]},
  ],

  workflows: [
    { id: "wf-lead", name: "Lead Conversion", description: "Convert prospect to member", trigger: "New lead created",
      steps: [
        { id: "capture", name: "Capture Lead", description: "Walk-in, referral, or digital" },
        { id: "contact", name: "Contact", description: "Phone/email follow-up" },
        { id: "tour", name: "Facility Tour", description: "Show gym facilities" },
        { id: "close", name: "Close Sale", description: "Membership purchase" },
      ], outputEntity: "member" },
    { id: "wf-checkin", name: "Check-in Flow", description: "Member daily check-in", trigger: "Member arrives at gym",
      steps: [
        { id: "scan", name: "Scan ID", description: "QR code or card scan" },
        { id: "log", name: "Log Activity", description: "Record activity type" },
        { id: "update", name: "Update Dashboard", description: "Update attendance metrics" },
      ], outputEntity: "checkin" },
    { id: "wf-billing", name: "Billing & Renewal", description: "Monthly membership billing", trigger: "Membership expiring",
      steps: [
        { id: "detect", name: "Detect Expiry", description: "Identify expiring memberships" },
        { id: "remind", name: "Send Reminder", description: "Email/SMS reminder" },
        { id: "charge", name: "Process Payment", description: "Auto-charge or manual" },
        { id: "extend", name: "Extend Membership", description: "Update membership dates" },
      ], outputEntity: "payment" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "member", description: "Gym overview" },
    { id: "leads", name: "Leads", route: "/leads", type: "kanban", primaryEntity: "lead", description: "Lead pipeline" },
    { id: "members", name: "Members", route: "/members", type: "list", primaryEntity: "member", description: "Active members" },
    { id: "attendance", name: "Attendance", route: "/attendance", type: "calendar", primaryEntity: "checkin", description: "Check-in calendar" },
    { id: "trainers", name: "Trainers", route: "/trainers", type: "list", primaryEntity: "trainer", description: "Trainer profiles" },
    { id: "billing", name: "Billing", route: "/billing", type: "list", primaryEntity: "payment", description: "Payment history" },
    { id: "classes", name: "Classes", route: "/classes", type: "calendar", primaryEntity: "checkin", description: "Class schedule" },
  ],

  dashboards: [
    { id: "owner", name: "Owner Dashboard", description: "Gym performance overview", persona: "owner",
      widgets: [
        { id: "leads", name: "New Leads", type: "metric", dataEntity: "lead", aggregation: "count", description: "Leads this month" },
        { id: "conversions", name: "Conversions", type: "metric", dataEntity: "lead", aggregation: "count", description: "Memberships sold" },
        { id: "attendance", name: "Daily Attendance", type: "chart", dataEntity: "checkin", aggregation: "count", description: "Check-ins per day" },
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "payment", aggregation: "sum", description: "Total payments" },
        { id: "expiring", name: "Expiring Memberships", type: "list", dataEntity: "member", description: "Memberships expiring soon" },
      ] },
  ],

  businessRules: [
    { id: "br-expire", name: "Membership Expiry Alert", description: "Alert 7 days before expiry", entity: "member", condition: "membership.endDate - today <= 7 days", action: "Send renewal reminder" },
    { id: "br-overdue", name: "Overdue Payment", description: "Suspend access on overdue", entity: "payment", condition: "payment.status == 'overdue' && payment.daysOverdue > 15", action: "Suspend member access" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const SAAS_PLATFORM: DomainBlueprint = {
  id: "saas-platform",
  name: "SaaS Platform",
  tier: 1,
  category: "software",
  description: "SaaS dashboard with users, subscriptions, plans, MRR, and churn tracking",
  keywords: ["saas", "software", "subscription", "dashboard", "mrr", "churn", "platform"],

  entities: [
    { id: "customer", name: "Customer", plural: "Customers", description: "SaaS customer company", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Customer ID" },
      { name: "name", type: "string", required: true, description: "Company name" },
      { name: "email", type: "string", required: true, description: "Contact email" },
      { name: "city", type: "string", required: true, description: "City" },
      { name: "totalSpent", type: "number", required: true, description: "Lifetime value" },
    ]},
    { id: "subscription", name: "Subscription", plural: "Subscriptions", description: "Customer subscription", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Subscription ID" },
      { name: "customerId", type: "ref", refEntity: "customer", required: true, description: "Customer" },
      { name: "plan", type: "enum", enumValues: ["starter", "professional", "enterprise"], required: true, description: "Plan tier" },
      { name: "monthlyPrice", type: "number", required: true, description: "Monthly price" },
      { name: "status", type: "enum", enumValues: ["active", "trial", "cancelled", "past-due"], required: true, description: "Status" },
      { name: "mrr", type: "number", required: true, description: "Monthly recurring revenue" },
    ]},
    { id: "feature-usage", name: "FeatureUsage", plural: "FeatureUsages", description: "Feature usage tracking", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Usage ID" },
      { name: "userId", type: "ref", refEntity: "customer", required: true, description: "User" },
      { name: "feature", type: "string", required: true, description: "Feature name" },
      { name: "usageCount", type: "number", required: true, description: "Usage count" },
      { name: "limit", type: "number", required: true, description: "Plan limit" },
    ]},
  ],

  workflows: [
    { id: "wf-trial", name: "Trial Conversion", description: "Convert trial user to paid", trigger: "Trial started",
      steps: [
        { id: "start", name: "Trial Start", description: "User signs up for trial" },
        { id: "onboard", name: "Onboarding", description: "Welcome email + setup guide" },
        { id: "engage", name: "Engagement", description: "Day 3/7/14 check-ins" },
        { id: "convert", name: "Convert", description: "Upgrade to paid plan" },
      ], outputEntity: "subscription" },
    { id: "wf-churn", name: "Churn Prevention", description: "Prevent customer cancellation", trigger: "Usage drop detected",
      steps: [
        { id: "detect", name: "Detect Drop", description: "Usage falls below threshold" },
        { id: "email", name: "Automated Email", description: "Re-engagement email" },
        { id: "outreach", name: "CSM Outreach", description: "Personal follow-up" },
        { id: "retain", name: "Retention Offer", description: "Discount or feature unlock" },
      ], outputEntity: "customer" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "subscription", description: "MRR and metrics" },
    { id: "customers", name: "Customers", route: "/customers", type: "list", primaryEntity: "customer", description: "Customer list" },
    { id: "subscriptions", name: "Subscriptions", route: "/subscriptions", type: "list", primaryEntity: "subscription", description: "Active subscriptions" },
    { id: "analytics", name: "Analytics", route: "/analytics", type: "dashboard", primaryEntity: "feature-usage", description: "Usage analytics" },
    { id: "billing", name: "Billing", route: "/billing", type: "list", primaryEntity: "subscription", description: "Revenue and billing" },
  ],

  dashboards: [
    { id: "founder", name: "Founder Dashboard", description: "SaaS metrics overview", persona: "owner",
      widgets: [
        { id: "mrr", name: "MRR", type: "metric", dataEntity: "subscription", aggregation: "sum", description: "Monthly recurring revenue" },
        { id: "active", name: "Active Subscriptions", type: "metric", dataEntity: "subscription", aggregation: "count", description: "Active paying customers" },
        { id: "trial-conversion", name: "Trial Conversion Rate", type: "metric", dataEntity: "subscription", aggregation: "average", description: "Trial → Paid %" },
        { id: "churn", name: "Churn Rate", type: "chart", dataEntity: "subscription", aggregation: "group-by", description: "Monthly churn trend" },
        { id: "top-customers", name: "Top Customers by LTV", type: "table", dataEntity: "customer", aggregation: "sum", description: "Highest value customers" },
      ] },
  ],

  businessRules: [
    { id: "br-trial", name: "Trial Expiry Alert", description: "Alert 3 days before trial ends", entity: "subscription", condition: "subscription.trialEnd - today <= 3 && status == 'trial'", action: "Send conversion email" },
    { id: "br-churn", name: "Churn Risk Detection", description: "Flag if usage drops 50%", entity: "feature-usage", condition: "currentWeekUsage < lastWeekUsage * 0.5", action: "Create churn risk alert" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const AGENCY_CRM: DomainBlueprint = {
  id: "agency-crm",
  name: "Agency CRM",
  tier: 1,
  category: "services",
  description: "Digital agency with leads, projects, invoices, tasks, and client management",
  keywords: ["agency", "marketing", "digital", "creative", "advertising", "branding", "seo", "ppc"],

  entities: [
    { id: "client", name: "Client", plural: "Clients", description: "Agency client", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Client ID" },
      { name: "name", type: "string", required: true, description: "Company name" },
      { name: "industry", type: "string", required: true, description: "Industry" },
      { name: "contactPerson", type: "string", required: true, description: "Contact person" },
      { name: "email", type: "string", required: true, description: "Email" },
      { name: "status", type: "enum", enumValues: ["lead", "prospect", "active", "paused", "churned"], required: true, description: "Client status" },
      { name: "monthlyRetainer", type: "number", required: true, description: "Monthly retainer in INR" },
    ]},
    { id: "project", name: "Project", plural: "Projects", description: "Client project", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Project ID" },
      { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
      { name: "name", type: "string", required: true, description: "Project name" },
      { name: "type", type: "enum", enumValues: ["website-redesign", "seo", "social-media", "ppc", "branding", "content"], required: true, description: "Project type" },
      { name: "status", type: "enum", enumValues: ["proposal", "contract-signed", "in-progress", "review", "completed", "invoiced"], required: true, description: "Status" },
      { name: "budget", type: "number", required: true, description: "Budget in INR" },
    ]},
    { id: "invoice", name: "Invoice", plural: "Invoices", description: "Client invoice", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Invoice ID" },
      { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
      { name: "projectId", type: "ref", refEntity: "project", required: true, description: "Project" },
      { name: "amount", type: "number", required: true, description: "Amount in INR" },
      { name: "status", type: "enum", enumValues: ["draft", "sent", "paid", "overdue"], required: true, description: "Invoice status" },
    ]},
    { id: "task", name: "Task", plural: "Tasks", description: "Project task", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Task ID" },
      { name: "projectId", type: "ref", refEntity: "project", required: true, description: "Project" },
      { name: "name", type: "string", required: true, description: "Task name" },
      { name: "status", type: "enum", enumValues: ["todo", "in-progress", "done"], required: true, description: "Status" },
    ]},
  ],

  workflows: [
    { id: "wf-client", name: "Client Acquisition", description: "Lead → Active Client", trigger: "New lead",
      steps: [
        { id: "identify", name: "Identify Lead", description: "Find potential client" },
        { id: "call", name: "Discovery Call", description: "Understand needs" },
        { id: "proposal", name: "Send Proposal", description: "Scope and pricing" },
        { id: "contract", name: "Sign Contract", description: "Client signs" },
        { id: "onboard", name: "Onboard", description: "Kickoff meeting" },
      ], outputEntity: "client" },
    { id: "wf-project", name: "Project Delivery", description: "Execute and deliver project", trigger: "Contract signed",
      steps: [
        { id: "kickoff", name: "Kickoff", description: "Project start" },
        { id: "strategy", name: "Strategy", description: "Planning phase" },
        { id: "execute", name: "Execute", description: "Build/deliver" },
        { id: "review", name: "Review", description: "Client review" },
        { id: "deliver", name: "Deliver", description: "Final delivery" },
        { id: "invoice", name: "Invoice", description: "Send final invoice" },
      ], outputEntity: "project" },
    { id: "wf-invoice", name: "Invoice Collection", description: "Send and collect payment", trigger: "Invoice sent",
      steps: [
        { id: "send", name: "Send Invoice", description: "Email invoice" },
        { id: "remind", name: "Remind", description: "Payment reminder" },
        { id: "follow", name: "Follow Up", description: "Personal follow-up" },
        { id: "receive", name: "Receive Payment", description: "Payment received" },
      ], outputEntity: "invoice" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "project", description: "Agency overview" },
    { id: "clients", name: "Clients", route: "/clients", type: "list", primaryEntity: "client", description: "Client list" },
    { id: "projects", name: "Projects", route: "/projects", type: "kanban", primaryEntity: "project", description: "Project board" },
    { id: "invoices", name: "Invoices", route: "/invoices", type: "list", primaryEntity: "invoice", description: "Invoice management" },
    { id: "tasks", name: "Tasks", route: "/tasks", type: "list", primaryEntity: "task", description: "Task list" },
  ],

  dashboards: [
    { id: "owner", name: "Agency Dashboard", description: "Agency performance", persona: "owner",
      widgets: [
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "invoice", aggregation: "sum", description: "Total revenue" },
        { id: "active-projects", name: "Active Projects", type: "metric", dataEntity: "project", aggregation: "count", description: "In-progress projects" },
        { id: "pipeline", name: "Revenue Pipeline", type: "chart", dataEntity: "project", aggregation: "group-by", description: "Revenue by status" },
        { id: "overdue", name: "Overdue Invoices", type: "list", dataEntity: "invoice", description: "Unpaid invoices" },
      ] },
  ],

  businessRules: [
    { id: "br-overdue", name: "Overdue Invoice Alert", description: "Alert on overdue invoices", entity: "invoice", condition: "invoice.status == 'overdue' && today - invoice.dueDate > 0", action: "Send payment reminder" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const RESTAURANT: DomainBlueprint = {
  id: "restaurant",
  name: "Restaurant",
  tier: 1,
  category: "services",
  description: "Restaurant with reservations, tables, orders, kitchen queue, and billing",
  keywords: ["restaurant", "cafe", "food", "menu", "ordering", "delivery", "reservation", "dining"],

  entities: [
    { id: "table", name: "Table", plural: "Tables", description: "Restaurant table", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Table ID" },
      { name: "number", type: "number", required: true, unique: true, description: "Table number" },
      { name: "capacity", type: "number", required: true, description: "Seating capacity" },
      { name: "status", type: "enum", enumValues: ["available", "occupied", "reserved", "cleaning"], required: true, description: "Current status" },
    ]},
    { id: "menu-item", name: "MenuItem", plural: "MenuItems", description: "Menu item", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Item ID" },
      { name: "name", type: "string", required: true, description: "Dish name" },
      { name: "category", type: "enum", enumValues: ["starters", "mains", "breads", "rice", "desserts", "beverages"], required: true, description: "Category" },
      { name: "price", type: "number", required: true, description: "Price in INR" },
      { name: "isVeg", type: "boolean", required: true, description: "Vegetarian" },
      { name: "prepTime", type: "number", required: true, description: "Prep time in minutes" },
    ]},
    { id: "reservation", name: "Reservation", plural: "Reservations", description: "Table reservation", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Reservation ID" },
      { name: "customerName", type: "string", required: true, description: "Customer name" },
      { name: "phone", type: "string", required: true, description: "Phone" },
      { name: "partySize", type: "number", required: true, description: "Party size" },
      { name: "tableId", type: "ref", refEntity: "table", required: true, description: "Assigned table" },
      { name: "date", type: "string", required: true, description: "Reservation date" },
      { name: "time", type: "string", required: true, description: "Reservation time" },
      { name: "status", type: "enum", enumValues: ["confirmed", "seated", "completed", "no-show", "cancelled"], required: true, description: "Status" },
    ]},
    { id: "kitchen-order", name: "KitchenOrder", plural: "KitchenOrders", description: "Kitchen order queue", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Order ID" },
      { name: "tableNumber", type: "number", required: true, description: "Table number" },
      { name: "items", type: "string", required: true, description: "Order items" },
      { name: "status", type: "enum", enumValues: ["received", "preparing", "ready", "served", "billed"], required: true, description: "Kitchen status" },
    ]},
  ],

  workflows: [
    { id: "wf-reservation", name: "Reservation Flow", description: "Book and seat guests", trigger: "Reservation made",
      steps: [
        { id: "confirm", name: "Confirm", description: "Confirm reservation" },
        { id: "assign", name: "Assign Table", description: "Assign table" },
        { id: "seat", name: "Seat Guest", description: "Guest arrives and seated" },
        { id: "order", name: "Take Order", description: "Record order" },
        { id: "serve", name: "Serve", description: "Deliver food" },
        { id: "bill", name: "Bill", description: "Generate and collect bill" },
      ], outputEntity: "reservation" },
    { id: "wf-kitchen", name: "Kitchen Queue", description: "Process kitchen orders", trigger: "Order placed",
      steps: [
        { id: "receive", name: "Receive", description: "Order received" },
        { id: "prep", name: "Prep", description: "Preparing" },
        { id: "cook", name: "Cook", description: "Cooking" },
        { id: "ready", name: "Ready", description: "Ready to serve" },
        { id: "serve", name: "Serve", description: "Delivered to table" },
      ], outputEntity: "kitchen-order" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "table", description: "Restaurant overview" },
    { id: "menu", name: "Menu", route: "/menu", type: "list", primaryEntity: "menu-item", description: "Menu management" },
    { id: "reservations", name: "Reservations", route: "/reservations", type: "calendar", primaryEntity: "reservation", description: "Reservation calendar" },
    { id: "tables", name: "Tables", route: "/tables", type: "kanban", primaryEntity: "table", description: "Table status" },
    { id: "kitchen", name: "Kitchen Queue", route: "/kitchen", type: "kanban", primaryEntity: "kitchen-order", description: "Kitchen orders" },
    { id: "orders", name: "Orders", route: "/orders", type: "list", primaryEntity: "kitchen-order", description: "Active orders" },
  ],

  dashboards: [
    { id: "owner", name: "Restaurant Dashboard", description: "Restaurant overview", persona: "owner",
      widgets: [
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "kitchen-order", aggregation: "sum", description: "Today's revenue" },
        { id: "covers", name: "Covers", type: "metric", dataEntity: "reservation", aggregation: "count", description: "Guests served" },
        { id: "table-util", name: "Table Utilization", type: "chart", dataEntity: "table", aggregation: "group-by", description: "Table status breakdown" },
        { id: "kitchen-queue", name: "Kitchen Queue", type: "list", dataEntity: "kitchen-order", description: "Pending orders" },
      ] },
  ],

  businessRules: [
    { id: "br-no-show", name: "No-Show Alert", description: "Alert if guest doesn't arrive in 15 min", entity: "reservation", condition: "status == 'confirmed' && now - reservationTime > 15min", action: "Mark as no-show, release table" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const HEALTHCARE_CLINIC: DomainBlueprint = {
  id: "healthcare-clinic",
  name: "Healthcare Clinic",
  tier: 1,
  category: "healthcare",
  description: "Clinic management with patients, appointments, doctors, and prescriptions",
  keywords: ["clinic", "healthcare", "doctor", "patient", "appointment", "medical", "hospital", "health"],

  entities: [
    { id: "patient", name: "Patient", plural: "Patients", description: "Clinic patient", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Patient ID" },
      { name: "name", type: "string", required: true, description: "Full name" },
      { name: "age", type: "number", required: true, description: "Age" },
      { name: "gender", type: "enum", enumValues: ["male", "female", "other"], required: true, description: "Gender" },
      { name: "phone", type: "string", required: true, description: "Phone" },
      { name: "email", type: "string", required: false, description: "Email" },
      { name: "bloodGroup", type: "enum", enumValues: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true, description: "Blood group" },
      { name: "medicalHistory", type: "string", required: false, description: "Past conditions" },
    ]},
    { id: "doctor", name: "Doctor", plural: "Doctors", description: "Clinic doctor", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Doctor ID" },
      { name: "name", type: "string", required: true, description: "Dr. name" },
      { name: "specialization", type: "string", required: true, description: "Specialization" },
      { name: "availableDays", type: "string", required: true, description: "Available days" },
      { name: "consultationFee", type: "number", required: true, description: "Fee in INR" },
    ]},
    { id: "appointment", name: "Appointment", plural: "Appointments", description: "Patient appointment", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Appointment ID" },
      { name: "patientId", type: "ref", refEntity: "patient", required: true, description: "Patient" },
      { name: "doctorId", type: "ref", refEntity: "doctor", required: true, description: "Doctor" },
      { name: "date", type: "string", required: true, description: "Appointment date" },
      { name: "time", type: "string", required: true, description: "Appointment time" },
      { name: "status", type: "enum", enumValues: ["scheduled", "completed", "cancelled", "no-show"], required: true, description: "Status" },
      { name: "type", type: "enum", enumValues: ["consultation", "follow-up", "emergency", "checkup"], required: true, description: "Visit type" },
    ]},
    { id: "prescription", name: "Prescription", plural: "Prescriptions", description: "Doctor's prescription", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Prescription ID" },
      { name: "appointmentId", type: "ref", refEntity: "appointment", required: true, description: "Appointment" },
      { name: "patientId", type: "ref", refEntity: "patient", required: true, description: "Patient" },
      { name: "medicines", type: "string", required: true, description: "Prescribed medicines" },
      { name: "notes", type: "string", required: false, description: "Doctor notes" },
    ]},
  ],

  workflows: [
    { id: "wf-appointment", name: "Patient Visit", description: "Appointment → Consultation → Prescription", trigger: "Patient books appointment",
      steps: [
        { id: "book", name: "Book", description: "Schedule appointment" },
        { id: "checkin", name: "Check-in", description: "Patient arrives" },
        { id: "consult", name: "Consultation", description: "Doctor consultation" },
        { id: "prescribe", name: "Prescribe", description: "Issue prescription" },
        { id: "billing", name: "Billing", description: "Collect payment" },
      ], outputEntity: "appointment" },
    { id: "wf-prescription", name: "Prescription Fulfillment", description: "Prescribe → Pharmacy → Dispense → Follow-up", trigger: "Doctor issues prescription",
      steps: [
        { id: "issue", name: "Issue Prescription", description: "Doctor prescribes" },
        { id: "pharmacy", name: "Send to Pharmacy", description: "Pharmacy receives" },
        { id: "dispense", name: "Dispense Medicine", description: "Medicines dispensed" },
        { id: "followup", name: "Schedule Follow-up", description: "Follow-up booked" },
      ], outputEntity: "prescription" },
    { id: "wf-emergency", name: "Emergency Intake", description: "Arrival → Triage → Treatment → Discharge", trigger: "Emergency patient arrives",
      steps: [
        { id: "arrive", name: "Patient Arrives", description: "Emergency arrival" },
        { id: "triage", name: "Triage", description: "Assess severity" },
        { id: "treat", name: "Treatment", description: "Provide treatment" },
        { id: "discharge", name: "Discharge", description: "Patient discharged" },
       ], outputEntity: "appointment" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "appointment", description: "Clinic overview" },
    { id: "patients", name: "Patients", route: "/patients", type: "list", primaryEntity: "patient", description: "Patient directory" },
    { id: "doctors", name: "Doctors", route: "/doctors", type: "list", primaryEntity: "doctor", description: "Doctor profiles" },
    { id: "appointments", name: "Appointments", route: "/appointments", type: "calendar", primaryEntity: "appointment", description: "Appointment calendar" },
    { id: "prescriptions", name: "Prescriptions", route: "/prescriptions", type: "list", primaryEntity: "prescription", description: "Prescription records" },
  ],

  dashboards: [
    { id: "admin", name: "Clinic Dashboard", description: "Clinic operations", persona: "admin",
      widgets: [
        { id: "today-appointments", name: "Today's Appointments", type: "metric", dataEntity: "appointment", aggregation: "count", description: "Appointments today" },
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "appointment", aggregation: "sum", description: "Today's revenue" },
        { id: "patient-count", name: "Total Patients", type: "metric", dataEntity: "patient", aggregation: "count", description: "Registered patients" },
        { id: "doctor-schedule", name: "Doctor Schedule", type: "calendar", dataEntity: "appointment", description: "Today's schedule" },
      ] },
  ],

  businessRules: [
    { id: "br-reminder", name: "Appointment Reminder", description: "Send SMS 24h before", entity: "appointment", condition: "appointment.date - today == 1 day", action: "Send reminder SMS" },
    { id: "br-no-show", name: "No-Show Mark", description: "Auto-mark no-show", entity: "appointment", condition: "status == 'scheduled' && appointment time has passed", action: "Mark as no-show" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const EDUCATION_PLATFORM: DomainBlueprint = {
  id: "education-platform",
  name: "Education Platform",
  tier: 1,
  category: "services",
  description: "Education management with students, courses, enrollments, and progress tracking",
  keywords: ["education", "student", "course", "learning", "training", "coaching", "institute", "academy"],

  entities: [
    { id: "student", name: "Student", plural: "Students", description: "Enrolled student", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Student ID" },
      { name: "name", type: "string", required: true, description: "Full name" },
      { name: "email", type: "string", required: true, description: "Email" },
      { name: "phone", type: "string", required: true, description: "Phone" },
      { name: "enrollmentDate", type: "date", required: true, description: "Enrolled on" },
    ]},
    { id: "course", name: "Course", plural: "Courses", description: "Course offered", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Course ID" },
      { name: "name", type: "string", required: true, description: "Course name" },
      { name: "category", type: "string", required: true, description: "Category" },
      { name: "duration", type: "string", required: true, description: "Duration" },
      { name: "fee", type: "number", required: true, description: "Course fee in INR" },
      { name: "maxStudents", type: "number", required: true, description: "Max enrollment" },
    ]},
    { id: "enrollment", name: "Enrollment", plural: "Enrollments", description: "Student enrollment", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Enrollment ID" },
      { name: "studentId", type: "ref", refEntity: "student", required: true, description: "Student" },
      { name: "courseId", type: "ref", refEntity: "course", required: true, description: "Course" },
      { name: "status", type: "enum", enumValues: ["active", "completed", "dropped"], required: true, description: "Status" },
      { name: "progress", type: "number", required: true, description: "Progress %" },
    ]},
    { id: "attendance", name: "Attendance", plural: "Attendances", description: "Class attendance", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Attendance ID" },
      { name: "enrollmentId", type: "ref", refEntity: "enrollment", required: true, description: "Enrollment" },
      { name: "date", type: "date", required: true, description: "Class date" },
      { name: "status", type: "enum", enumValues: ["present", "absent", "late"], required: true, description: "Attendance status" },
    ]},
  ],

  workflows: [
    { id: "wf-enrollment", name: "Student Enrollment", description: "Enroll student in course", trigger: "Student applies",
      steps: [
        { id: "apply", name: "Apply", description: "Student submits application" },
        { id: "review", name: "Review", description: "Admin reviews" },
        { id: "enroll", name: "Enroll", description: "Confirm enrollment" },
        { id: "pay", name: "Payment", description: "Course fee payment" },
      ], outputEntity: "enrollment" },
    { id: "wf-progress", name: "Course Progress", description: "Track student progress", trigger: "Classes attended",
      steps: [
        { id: "attend", name: "Attend", description: "Student attends class" },
        { id: "track", name: "Track", description: "Record attendance" },
        { id: "assess", name: "Assess", description: "Quiz/assignment" },
        { id: "complete", name: "Complete", description: "Course completed" },
      ], outputEntity: "attendance" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "enrollment", description: "Institute overview" },
    { id: "students", name: "Students", route: "/students", type: "list", primaryEntity: "student", description: "Student directory" },
    { id: "courses", name: "Courses", route: "/courses", type: "list", primaryEntity: "course", description: "Course catalog" },
    { id: "enrollments", name: "Enrollments", route: "/enrollments", type: "list", primaryEntity: "enrollment", description: "Active enrollments" },
    { id: "attendance", name: "Attendance", route: "/attendance", type: "calendar", primaryEntity: "attendance", description: "Attendance tracker" },
  ],

  dashboards: [
    { id: "admin", name: "Admin Dashboard", description: "Institute operations", persona: "admin",
      widgets: [
        { id: "total-students", name: "Total Students", type: "metric", dataEntity: "student", aggregation: "count", description: "Enrolled students" },
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "enrollment", aggregation: "sum", description: "Total fees collected" },
        { id: "completion-rate", name: "Completion Rate", type: "metric", dataEntity: "enrollment", aggregation: "average", description: "Course completion %" },
        { id: "attendance-rate", name: "Attendance Rate", type: "chart", dataEntity: "attendance", aggregation: "group-by", description: "Attendance trend" },
      ] },
  ],

  businessRules: [
    { id: "br-capacity", name: "Course Capacity", description: "Block enrollment if full", entity: "enrollment", condition: "course.currentStudents >= course.maxStudents", action: "Show course full message" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const REAL_ESTATE_CRM: DomainBlueprint = {
  id: "real-estate-crm",
  name: "Real Estate CRM",
  tier: 1,
  category: "property",
  description: "Real estate with properties, leads, visits, and deals pipeline",
  keywords: ["real estate", "property", "listing", "agent", "broker", "house", "apartment", "flat"],

  entities: [
    { id: "property", name: "Property", plural: "Properties", description: "Property listing", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Property ID" },
      { name: "name", type: "string", required: true, description: "Property title" },
      { name: "type", type: "enum", enumValues: ["apartment", "house", "villa", "plot", "commercial"], required: true, description: "Property type" },
      { name: "price", type: "number", required: true, description: "Price in INR" },
      { name: "area", type: "number", required: true, description: "Area in sq ft" },
      { name: "bedrooms", type: "number", required: true, description: "Bedrooms" },
      { name: "location", type: "string", required: true, description: "Location" },
      { name: "status", type: "enum", enumValues: ["available", "sold", "rented", "under-construction"], required: true, description: "Status" },
    ]},
    { id: "lead", name: "Lead", plural: "Leads", description: "Potential buyer/tenant", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Lead ID" },
      { name: "name", type: "string", required: true, description: "Name" },
      { name: "phone", type: "string", required: true, description: "Phone" },
      { name: "email", type: "string", required: false, description: "Email" },
      { name: "budget", type: "number", required: true, description: "Budget in INR" },
      { name: "status", type: "enum", enumValues: ["new", "contacted", "visit-scheduled", "negotiating", "booked", "lost"], required: true, description: "Lead status" },
    ]},
    { id: "visit", name: "Visit", plural: "Visits", description: "Property visit", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Visit ID" },
      { name: "leadId", type: "ref", refEntity: "lead", required: true, description: "Lead" },
      { name: "propertyId", type: "ref", refEntity: "property", required: true, description: "Property" },
      { name: "date", type: "string", required: true, description: "Visit date" },
      { name: "feedback", type: "string", required: false, description: "Visit feedback" },
    ]},
    { id: "deal", name: "Deal", plural: "Deals", description: "Property deal", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Deal ID" },
      { name: "leadId", type: "ref", refEntity: "lead", required: true, description: "Lead" },
      { name: "propertyId", type: "ref", refEntity: "property", required: true, description: "Property" },
      { name: "amount", type: "number", required: true, description: "Deal amount in INR" },
      { name: "status", type: "enum", enumValues: ["negotiation", "agreement", "registration", "completed", "cancelled"], required: true, description: "Deal status" },
    ]},
  ],

  workflows: [
    { id: "wf-sale", name: "Property Sale", description: "Lead → Visit → Deal → Sale", trigger: "New lead",
      steps: [
        { id: "capture", name: "Capture Lead", description: "Inquiry received" },
        { id: "match", name: "Match Property", description: "Find matching properties" },
        { id: "visit", name: "Schedule Visit", description: "Property visit" },
        { id: "negotiate", name: "Negotiate", description: "Price negotiation" },
        { id: "book", name: "Book", description: "Token payment" },
        { id: "register", name: "Register", description: "Final registration" },
      ], outputEntity: "deal" },
    { id: "wf-rental", name: "Rental Process", description: "Lead → Visit → Agreement → Move-in", trigger: "Rental inquiry",
      steps: [
        { id: "inquiry", name: "Rental Inquiry", description: "Tenant inquiry" },
        { id: "match", name: "Match Property", description: "Find rental properties" },
        { id: "visit", name: "Schedule Visit", description: "Property visit" },
        { id: "agreement", name: "Rental Agreement", description: "Sign agreement" },
        { id: "movein", name: "Move-in", description: "Tenant moves in" },
      ], outputEntity: "deal" },
    { id: "wf-followup", name: "Lead Follow-up", description: "New lead → Contact → Nurture → Convert", trigger: "New lead captured",
      steps: [
        { id: "capture", name: "Lead Captured", description: "Inquiry received" },
        { id: "contact", name: "First Contact", description: "Agent calls" },
        { id: "nurture", name: "Nurture", description: "Regular follow-ups" },
        { id: "convert", name: "Convert", description: "Lead becomes client" },
      ], outputEntity: "lead" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "deal", description: "Agency overview" },
    { id: "properties", name: "Properties", route: "/properties", type: "list", primaryEntity: "property", description: "Property listings" },
    { id: "leads", name: "Leads", route: "/leads", type: "kanban", primaryEntity: "lead", description: "Lead pipeline" },
    { id: "visits", name: "Visits", route: "/visits", type: "calendar", primaryEntity: "visit", description: "Visit schedule" },
    { id: "deals", name: "Deals", route: "/deals", type: "kanban", primaryEntity: "deal", description: "Deal pipeline" },
  ],

  dashboards: [
    { id: "owner", name: "Agency Dashboard", description: "Real estate performance", persona: "owner",
      widgets: [
        { id: "total-properties", name: "Properties", type: "metric", dataEntity: "property", aggregation: "count", description: "Active listings" },
        { id: "leads", name: "Leads", type: "metric", dataEntity: "lead", aggregation: "count", description: "Total leads" },
        { id: "deals-value", name: "Deal Value", type: "metric", dataEntity: "deal", aggregation: "sum", description: "Total deal value" },
        { id: "conversion", name: "Conversion Rate", type: "chart", dataEntity: "deal", aggregation: "group-by", description: "Lead → Deal conversion" },
      ] },
  ],

  businessRules: [
    { id: "br-follow-up", name: "Follow-up Reminder", description: "Remind if no contact in 3 days", entity: "lead", condition: "status == 'contacted' && daysSinceLastContact > 3", action: "Send follow-up reminder" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

const HOTEL_BOOKING: DomainBlueprint = {
  id: "hotel-booking",
  name: "Hotel Booking",
  tier: 1,
  category: "property",
  description: "Hotel management with rooms, reservations, guests, and payments",
  keywords: ["hotel", "booking", "room", "reservation", "guest", "stay", "accommodation", "lodge"],

  entities: [
    { id: "room", name: "Room", plural: "Rooms", description: "Hotel room", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Room ID" },
      { name: "number", type: "number", required: true, unique: true, description: "Room number" },
      { name: "type", type: "enum", enumValues: ["single", "double", "suite", "deluxe", "presidential"], required: true, description: "Room type" },
      { name: "pricePerNight", type: "number", required: true, description: "Price per night in INR" },
      { name: "status", type: "enum", enumValues: ["available", "occupied", "maintenance", "reserved"], required: true, description: "Status" },
      { name: "amenities", type: "string", required: true, description: "Room amenities" },
    ]},
    { id: "guest", name: "Guest", plural: "Guests", description: "Hotel guest", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Guest ID" },
      { name: "name", type: "string", required: true, description: "Full name" },
      { name: "phone", type: "string", required: true, description: "Phone" },
      { name: "email", type: "string", required: false, description: "Email" },
      { name: "idProof", type: "string", required: true, description: "ID proof type" },
    ]},
    { id: "reservation", name: "Reservation", plural: "Reservations", description: "Room reservation", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Reservation ID" },
      { name: "guestId", type: "ref", refEntity: "guest", required: true, description: "Guest" },
      { name: "roomId", type: "ref", refEntity: "room", required: true, description: "Room" },
      { name: "checkIn", type: "string", required: true, description: "Check-in date" },
      { name: "checkOut", type: "string", required: true, description: "Check-out date" },
      { name: "nights", type: "number", required: true, description: "Number of nights" },
      { name: "totalAmount", type: "number", required: true, description: "Total amount in INR" },
      { name: "status", type: "enum", enumValues: ["confirmed", "checked-in", "checked-out", "cancelled"], required: true, description: "Status" },
    ]},
    { id: "payment", name: "Payment", plural: "Payments", description: "Hotel payment", fields: [
      { name: "id", type: "string", required: true, unique: true, description: "Payment ID" },
      { name: "reservationId", type: "ref", refEntity: "reservation", required: true, description: "Reservation" },
      { name: "amount", type: "number", required: true, description: "Amount in INR" },
      { name: "method", type: "enum", enumValues: ["cash", "card", "upi", "bank-transfer"], required: true, description: "Payment method" },
      { name: "status", type: "enum", enumValues: ["paid", "pending", "refunded"], required: true, description: "Status" },
    ]},
  ],

  workflows: [
    { id: "wf-booking", name: "Room Booking", description: "Reservation → Check-in → Stay → Check-out", trigger: "Guest makes reservation",
      steps: [
        { id: "reserve", name: "Reserve", description: "Book room" },
        { id: "confirm", name: "Confirm", description: "Confirm booking" },
        { id: "checkin", name: "Check-in", description: "Guest arrives" },
        { id: "stay", name: "Stay", description: "Guest stays" },
        { id: "checkout", name: "Check-out", description: "Guest departs" },
        { id: "bill", name: "Bill", description: "Final billing" },
      ], outputEntity: "reservation" },
  ],

  pages: [
    { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "reservation", description: "Hotel overview" },
    { id: "rooms", name: "Rooms", route: "/rooms", type: "kanban", primaryEntity: "room", description: "Room status" },
    { id: "reservations", name: "Reservations", route: "/reservations", type: "calendar", primaryEntity: "reservation", description: "Booking calendar" },
    { id: "guests", name: "Guests", route: "/guests", type: "list", primaryEntity: "guest", description: "Guest directory" },
    { id: "payments", name: "Payments", route: "/payments", type: "list", primaryEntity: "payment", description: "Payment records" },
  ],

  dashboards: [
    { id: "owner", name: "Hotel Dashboard", description: "Hotel performance", persona: "owner",
      widgets: [
        { id: "occupancy", name: "Occupancy Rate", type: "metric", dataEntity: "room", aggregation: "group-by", description: "Room occupancy %" },
        { id: "revenue", name: "Revenue", type: "metric", dataEntity: "payment", aggregation: "sum", description: "Total revenue" },
        { id: "today-checkins", name: "Today's Check-ins", type: "metric", dataEntity: "reservation", aggregation: "count", description: "Arrivals today" },
        { id: "room-status", name: "Room Status", type: "chart", dataEntity: "room", aggregation: "group-by", description: "Room availability" },
      ] },
  ],

  businessRules: [
    { id: "br-checkout", name: "Checkout Reminder", description: "Remind guest at 11 AM", entity: "reservation", condition: "checkOut == today && status == 'checked-in'", action: "Send checkout reminder" },
    { id: "br-maintenance", name: "Maintenance Alert", description: "Alert for occupied rooms needing maintenance", entity: "room", condition: "status == 'maintenance' && reservation exists", action: "Notify front desk" },
  ],

  mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
};

// ═══════════════════════════════════════════════════════════
// TIER 2 — HIGH DEMAND (15 domains — definitions)
// ═══════════════════════════════════════════════════════════

// Tier 2 domains defined as minimal blueprints — expanded as needed
const TIER2_DOMAINS: DomainBlueprint[] = [
  { id: "beauty-salon", name: "Beauty Salon", tier: 2, category: "services", description: "Salon with appointments, staff, services, memberships",
    keywords: ["salon", "beauty", "hair", "styling", "grooming"],
    entities: [
      { id: "appointment", name: "Appointment", plural: "Appointments", description: "Salon appointment", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "customerName", type: "string", required: true, description: "Customer" },
        { name: "service", type: "string", required: true, description: "Service" },
        { name: "staffId", type: "ref", refEntity: "staff", required: true, description: "Staff" },
        { name: "date", type: "string", required: true, description: "Date" },
        { name: "time", type: "string", required: true, description: "Time" },
        { name: "status", type: "enum", enumValues: ["scheduled", "in-progress", "completed", "cancelled"], required: true, description: "Status" },
      ]},
      { id: "staff", name: "Staff", plural: "Staff", description: "Salon staff", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "role", type: "string", required: true, description: "Role" },
        { name: "specialization", type: "string", required: true, description: "Specialty" },
      ]},
      { id: "service", name: "Service", plural: "Services", description: "Salon service", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Service name" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
        { name: "duration", type: "number", required: true, description: "Duration in min" },
      ]},
    ],
    workflows: [
      { id: "wf-booking", name: "Service Booking", description: "Book and complete service", trigger: "Customer books",
        steps: [
          { id: "book", name: "Book", description: "Schedule appointment" },
          { id: "arrive", name: "Arrive", description: "Customer arrives" },
          { id: "serve", name: "Serve", description: "Perform service" },
          { id: "pay", name: "Pay", description: "Collect payment" },
        ], outputEntity: "appointment" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "appointment", description: "Salon overview" },
      { id: "appointments", name: "Appointments", route: "/appointments", type: "calendar", primaryEntity: "appointment", description: "Booking calendar" },
      { id: "staff", name: "Staff", route: "/staff", type: "list", primaryEntity: "staff", description: "Staff management" },
      { id: "services", name: "Services", route: "/services", type: "list", primaryEntity: "service", description: "Service menu" },
    ],
    dashboards: [
      { id: "owner", name: "Salon Dashboard", description: "Salon overview", persona: "owner",
        widgets: [
          { id: "today", name: "Today's Appointments", type: "metric", dataEntity: "appointment", aggregation: "count", description: "Appointments today" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "appointment", aggregation: "sum", description: "Today's revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  { id: "dental-clinic", name: "Dental Clinic", tier: 2, category: "healthcare", description: "Dental clinic with patients, treatments, and appointments",
    keywords: ["dental", "dentist", "teeth", "oral", "dental clinic"],
    entities: [
      { id: "patient", name: "Patient", plural: "Patients", description: "Dental patient", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "age", type: "number", required: true, description: "Age" },
      ]},
      { id: "treatment", name: "Treatment", plural: "Treatments", description: "Dental treatment", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "patientId", type: "ref", refEntity: "patient", required: true, description: "Patient" },
        { name: "procedure", type: "string", required: true, description: "Procedure" },
        { name: "cost", type: "number", required: true, description: "Cost in INR" },
        { name: "status", type: "enum", enumValues: ["planned", "in-progress", "completed"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-treatment", name: "Treatment Flow", description: "Diagnosis → Treatment → Follow-up", trigger: "Patient visits",
        steps: [
          { id: "diagnose", name: "Diagnose", description: "Examine patient" },
          { id: "plan", name: "Treatment Plan", description: "Plan procedures" },
          { id: "treat", name: "Treat", description: "Perform treatment" },
          { id: "followup", name: "Follow-up", description: "Schedule follow-up" },
        ], outputEntity: "treatment" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "treatment", description: "Clinic overview" },
      { id: "patients", name: "Patients", route: "/patients", type: "list", primaryEntity: "patient", description: "Patient list" },
      { id: "treatments", name: "Treatments", route: "/treatments", type: "list", primaryEntity: "treatment", description: "Treatment records" },
    ],
    dashboards: [
      { id: "admin", name: "Clinic Dashboard", description: "Clinic overview", persona: "admin",
        widgets: [
          { id: "today", name: "Today's Patients", type: "metric", dataEntity: "treatment", aggregation: "count", description: "Patients today" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "treatment", aggregation: "sum", description: "Today's revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  { id: "law-firm", name: "Law Firm", tier: 2, category: "services", description: "Law firm with cases, clients, documents, and billing",
    keywords: ["law", "legal", "lawyer", "attorney", "case", "court"],
    entities: [
      { id: "case", name: "Case", plural: "Cases", description: "Legal case", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "title", type: "string", required: true, description: "Case title" },
        { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
        { name: "type", type: "string", required: true, description: "Case type" },
        { name: "status", type: "enum", enumValues: ["open", "in-progress", "hearing", "closed", "won", "lost"], required: true, description: "Status" },
      ]},
      { id: "client", name: "Client", plural: "Clients", description: "Law firm client", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
      ]},
    ],
    workflows: [
      { id: "wf-case", name: "Case Lifecycle", description: "Intake → Research → Hearing → Resolution", trigger: "New client",
        steps: [
          { id: "intake", name: "Intake", description: "Client consultation" },
          { id: "research", name: "Research", description: "Legal research" },
          { id: "file", name: "File", description: "File case" },
          { id: "hearing", name: "Hearing", description: "Court hearings" },
          { id: "resolve", name: "Resolve", description: "Case resolution" },
        ], outputEntity: "case" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "case", description: "Firm overview" },
      { id: "cases", name: "Cases", route: "/cases", type: "list", primaryEntity: "case", description: "Case list" },
      { id: "clients", name: "Clients", route: "/clients", type: "list", primaryEntity: "client", description: "Client list" },
    ],
    dashboards: [
      { id: "partner", name: "Partner Dashboard", description: "Firm performance", persona: "owner",
        widgets: [
          { id: "active-cases", name: "Active Cases", type: "metric", dataEntity: "case", aggregation: "count", description: "Open cases" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "case", aggregation: "sum", description: "Total billing" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  { id: "coaching-center", name: "Coaching Center", tier: 2, category: "services", description: "Coaching center with students, batches, and attendance",
    keywords: ["coaching", "tuition", "batch", "class", "prep", "competitive"],
    entities: [
      { id: "student", name: "Student", plural: "Students", description: "Coaching student", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "batch", type: "string", required: true, description: "Batch" },
      ]},
      { id: "batch", name: "Batch", plural: "Batches", description: "Student batch", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Batch name" },
        { name: "subject", type: "string", required: true, description: "Subject" },
        { name: "timing", type: "string", required: true, description: "Timing" },
        { name: "capacity", type: "number", required: true, description: "Max students" },
      ]},
    ],
    workflows: [
      { id: "wf-enroll", name: "Enrollment", description: "Student enrollment in batch", trigger: "New student",
        steps: [
          { id: "register", name: "Register", description: "Student registers" },
          { id: "assign", name: "Assign Batch", description: "Assign to batch" },
          { id: "pay", name: "Pay Fee", description: "Collect fee" },
        ], outputEntity: "student" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "student", description: "Center overview" },
      { id: "students", name: "Students", route: "/students", type: "list", primaryEntity: "student", description: "Student list" },
      { id: "batches", name: "Batches", route: "/batches", type: "list", primaryEntity: "batch", description: "Batch list" },
    ],
    dashboards: [
      { id: "admin", name: "Admin Dashboard", description: "Center overview", persona: "admin",
        widgets: [
          { id: "students", name: "Students", type: "metric", dataEntity: "student", aggregation: "count", description: "Total students" },
          { id: "batches", name: "Active Batches", type: "metric", dataEntity: "batch", aggregation: "count", description: "Running batches" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  { id: "travel-agency", name: "Travel Agency", tier: 2, category: "services", description: "Travel agency with packages, bookings, and customers",
    keywords: ["travel", "tour", "trip", "vacation", "holiday", "booking"],
    entities: [
      { id: "package", name: "Package", plural: "Packages", description: "Travel package", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Package name" },
        { name: "destination", type: "string", required: true, description: "Destination" },
        { name: "duration", type: "string", required: true, description: "Duration" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
      ]},
      { id: "booking", name: "Booking", plural: "Bookings", description: "Travel booking", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "customerId", type: "ref", refEntity: "customer", required: true, description: "Customer" },
        { name: "packageId", type: "ref", refEntity: "package", required: true, description: "Package" },
        { name: "travelDate", type: "string", required: true, description: "Travel date" },
        { name: "status", type: "enum", enumValues: ["booked", "confirmed", "completed", "cancelled"], required: true, description: "Status" },
      ]},
      { id: "customer", name: "Customer", plural: "Customers", description: "Travel customer", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
      ]},
    ],
    workflows: [
      { id: "wf-book", name: "Booking Flow", description: "Inquiry → Book → Travel → Complete", trigger: "Customer inquiry",
        steps: [
          { id: "inquire", name: "Inquire", description: "Customer inquiry" },
          { id: "recommend", name: "Recommend", description: "Suggest packages" },
          { id: "book", name: "Book", description: "Confirm booking" },
          { id: "travel", name: "Travel", description: "Trip happens" },
          { id: "feedback", name: "Feedback", description: "Collect review" },
        ], outputEntity: "booking" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "booking", description: "Agency overview" },
      { id: "packages", name: "Packages", route: "/packages", type: "list", primaryEntity: "package", description: "Travel packages" },
      { id: "bookings", name: "Bookings", route: "/bookings", type: "list", primaryEntity: "booking", description: "Booking list" },
    ],
    dashboards: [
      { id: "owner", name: "Agency Dashboard", description: "Agency performance", persona: "owner",
        widgets: [
          { id: "bookings", name: "Bookings", type: "metric", dataEntity: "booking", aggregation: "count", description: "Total bookings" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "booking", aggregation: "sum", description: "Total revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },
];

// ═══════════════════════════════════════════════════════════
// TIER 3 + 4 — STUB DEFINITIONS
// ═══════════════════════════════════════════════════════════

const TIER3_STUBS: DomainBlueprint[] = [
  { id: "manufacturing-erp", name: "Manufacturing ERP", tier: 3, category: "industry", description: "Manufacturing with production, inventory, suppliers",
    keywords: ["manufacturing", "production", "factory", "erp"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "wholesale-distribution", name: "Wholesale Distribution", tier: 3, category: "industry", description: "Wholesale with dealers, warehouses, stock",
    keywords: ["wholesale", "distribution", "dealer", "warehouse"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "pharma-distribution", name: "Pharmaceutical Distribution", tier: 3, category: "industry", description: "Pharma with medicines, batches, expiry tracking",
    keywords: ["pharma", "pharmaceutical", "medicine", "drug"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "auto-dealership", name: "Automobile Dealership", tier: 3, category: "industry", description: "Auto dealership with vehicles, leads, service",
    keywords: ["automobile", "car", "vehicle", "dealership", "showroom"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "construction", name: "Construction Company", tier: 3, category: "industry", description: "Construction with projects, contractors, materials",
    keywords: ["construction", "building", "contractor", "project"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "logistics", name: "Logistics Company", tier: 3, category: "industry", description: "Logistics with shipments, tracking, routes",
    keywords: ["logistics", "shipping", "freight", "transport"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "courier", name: "Courier Service", tier: 3, category: "industry", description: "Courier with parcels, routes, delivery tracking",
    keywords: ["courier", "parcel", "delivery", "express"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "interior-design", name: "Interior Design Studio", tier: 3, category: "services", description: "Interior design with projects, quotations, clients",
    keywords: ["interior", "design", "decor", "renovation"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "architecture", name: "Architecture Firm", tier: 3, category: "services", description: "Architecture with drawings, projects, clients",
    keywords: ["architecture", "architect", "blueprint", "design"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "event-management", name: "Event Management", tier: 3, category: "services", description: "Event management with events, vendors, bookings",
    keywords: ["event", "wedding", "conference", "party"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
];

const TIER4_STUBS: DomainBlueprint[] = [
  { id: "insurance-crm", name: "Insurance CRM", tier: 4, category: "finance", description: "Insurance with policies, claims, agents",
    keywords: ["insurance", "policy", "claim", "premium"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "fintech", name: "Fintech Platform", tier: 4, category: "finance", description: "Fintech with accounts, transactions, KYC",
    keywords: ["fintech", "payments", "wallet", "upi"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "lending", name: "Lending Platform", tier: 4, category: "finance", description: "Lending with loans, repayments, credit scoring",
    keywords: ["lending", "loan", "emi", "credit"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "hrms", name: "HRMS", tier: 4, category: "software", description: "HR management with employees, payroll, leaves",
    keywords: ["hrms", "hr", "payroll", "employee"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "erp", name: "ERP System", tier: 4, category: "software", description: "ERP with procurement, finance, inventory",
    keywords: ["erp", "enterprise", "procurement", "finance"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "franchise", name: "Franchise Management", tier: 4, category: "services", description: "Franchise with franchisees, royalties, compliance",
    keywords: ["franchise", "franchisee", "royalty"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "membership-org", name: "Membership Organization", tier: 4, category: "services", description: "Membership org with members, renewals, events",
    keywords: ["membership", "association", "club", "organization"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "nonprofit", name: "Nonprofit Management", tier: 4, category: "services", description: "Nonprofit with donations, campaigns, volunteers",
    keywords: ["nonprofit", "ngo", "donation", "charity"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
  { id: "marketplace", name: "Multi-Vendor Marketplace", tier: 4, category: "commerce", description: "Marketplace with sellers, commissions, multi-vendor",
    keywords: ["marketplace", "multi-vendor", "seller", "vendor"], entities: [], workflows: [], pages: [], dashboards: [], businessRules: [], mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" } },
];

// ═══════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════

// Import expanded domain definitions
import { TIER2_EXPANDED, TIER3_EXPANDED, TIER4_EXPANDED } from "./domain-registry-expanded";

export const ALL_DOMAINS: DomainBlueprint[] = [
  // Tier 1 — Launch Critical (10)
  SUPPLEMENT_STORE, ECOMMERCE_STORE, GYM_CRM, SAAS_PLATFORM, AGENCY_CRM,
  RESTAURANT, HEALTHCARE_CLINIC, EDUCATION_PLATFORM, REAL_ESTATE_CRM, HOTEL_BOOKING,
  // Tier 2 — High Demand (15: 5 original + 10 expanded)
  ...TIER2_DOMAINS, ...TIER2_EXPANDED,
  // Tier 3 — Industry Specific (10: fully defined)
  ...TIER3_EXPANDED,
  // Tier 4 — Enterprise (9: fully defined)
  ...TIER4_EXPANDED,
];

export const TIER1_DOMAINS = ALL_DOMAINS.filter(d => d.tier === 1);
export const TIER2_DOMAINS_ACTIVE = ALL_DOMAINS.filter(d => d.tier === 2);
export const TIER3_DOMAINS = ALL_DOMAINS.filter(d => d.tier === 3);
export const TIER4_DOMAINS = ALL_DOMAINS.filter(d => d.tier === 4);

// ═══════════════════════════════════════════════════════════
// LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════

export function getDomainById(id: string): DomainBlueprint | undefined {
  return ALL_DOMAINS.find(d => d.id === id);
}

export function detectDomain(prompt: string): DomainBlueprint | null {
  const lower = prompt.toLowerCase();
  const scored = ALL_DOMAINS.map(d => ({
    domain: d,
    score: d.keywords.reduce((acc, kw) => lower.includes(kw.toLowerCase()) ? acc + 1 : acc, 0),
  })).sort((a, b) => b.score - a.score);

  if (!scored.length || scored[0].score === 0) return null;
  return scored[0].domain;
}

export function getTier1Domains(): DomainBlueprint[] {
  return TIER1_DOMAINS;
}

export function getDomainCount(): { total: number; tier1: number; tier2: number; tier3: number; tier4: number } {
  return {
    total: ALL_DOMAINS.length,
    tier1: TIER1_DOMAINS.length,
    tier2: TIER2_DOMAINS_ACTIVE.length,
    tier3: TIER3_DOMAINS.length,
    tier4: TIER4_DOMAINS.length,
  };
}
