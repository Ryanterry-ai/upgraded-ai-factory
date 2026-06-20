/**
 * RPSE — Realistic Product Simulation Engine
 *
 * Sits AFTER blueprint generation and BEFORE final output.
 * Converts scaffolded components into production-looking products with:
 *   1. Domain-specific realistic mock data
 *   2. UI state simulation (loading, empty, populated, error)
 *   3. Workflow state transitions
 *   4. Real-world business metrics
 *
 * GOAL: Every generated app must feel like a live production SaaS.
 */

import { detectBlueprint } from "./domain-blueprints";
import {
  ECOMMERCE_MOCK,
  GYM_CRM_MOCK,
  STREAMING_MOCK,
  RESTAURANT_MOCK,
  ADMIN_DASHBOARD_MOCK,
  GENERIC_MOCK,
} from "./mock-data";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface RPSEContext {
  domain: string;
  companyName: string;
  blueprintId: string | null;
}

export interface RPSEDataBundle {
  /** Chart/graph data — monthly revenue, attendance trends, etc. */
  chartData: Array<{ label: string; value: number }>;
  /** Dashboard stats — KPI cards with real metrics */
  dashboardStats: Array<{ label: string; value: string; change: string; trend: "up" | "down" }>;
  /** Table data — orders, members, content, etc. */
  tableData: Array<Record<string, string>>;
  /** Card data — products, content items, menu items */
  cardData: Array<{ id: string; title: string; description: string; image?: string; price?: string; badge?: string }>;
  /** Pipeline/kanban data — leads, tasks, orders */
  pipelineData: Array<{ id: string; title: string; value: string; stage: string }>;
  /** Menu data — food items, service offerings */
  menuData: Array<{ id: string; name: string; category: string; price: number; description: string }>;
  /** Activity feed data — recent actions */
  activityFeed: Array<{ action: string; subject: string; time: string; icon: string }>;
  /** Business metrics — real KPIs */
  metrics: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN DATA BUNDLES
// ═══════════════════════════════════════════════════════════

const ECOMMERCE_DATA: RPSEDataBundle = {
  chartData: [
    { label: "Jan", value: 42800 }, { label: "Feb", value: 38200 },
    { label: "Mar", value: 51400 }, { label: "Apr", value: 47900 },
    { label: "May", value: 62300 }, { label: "Jun", value: 58100 },
    { label: "Jul", value: 71200 }, { label: "Aug", value: 68500 },
    { label: "Sep", value: 79400 }, { label: "Oct", value: 85200 },
    { label: "Nov", value: 92100 }, { label: "Dec", value: 108300 },
  ],
  dashboardStats: [
    { label: "Total Revenue", value: "$805,400", change: "+18.3%", trend: "up" },
    { label: "Orders", value: "12,847", change: "+12.1%", trend: "up" },
    { label: "Avg Order Value", value: "$62.70", change: "+5.4%", trend: "up" },
    { label: "Conversion Rate", value: "3.82%", change: "-0.2%", trend: "down" },
  ],
  tableData: [
    { id: "ORD-4521", customer: "Sarah Mitchell", email: "sarah.m@email.com", amount: "$149.97", status: "completed", date: "2024-06-15", items: "3 items" },
    { id: "ORD-4520", customer: "James Rodriguez", email: "james.r@email.com", amount: "$89.98", status: "shipped", date: "2024-06-15", items: "2 items" },
    { id: "ORD-4519", customer: "Emily Chen", email: "emily.c@email.com", amount: "$234.95", status: "processing", date: "2024-06-14", items: "5 items" },
    { id: "ORD-4518", customer: "Michael Brown", email: "michael.b@email.com", amount: "$59.99", status: "completed", date: "2024-06-14", items: "1 item" },
    { id: "ORD-4517", customer: "Lisa Anderson", email: "lisa.a@email.com", amount: "$179.96", status: "pending", date: "2024-06-14", items: "4 items" },
    { id: "ORD-4516", customer: "David Kim", email: "david.k@email.com", amount: "$44.99", status: "completed", date: "2024-06-13", items: "1 item" },
  ],
  cardData: [
    { id: "1", title: "Whey Protein Isolate", description: "Premium grass-fed whey with 25g protein per serving. Zero artificial sweeteners.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop", price: "$49.99", badge: "Best Seller" },
    { id: "2", title: "Creatine Monohydrate", description: "5g micronized creatine per serving. Lab-tested for purity. Unflavored.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop", price: "$29.99", badge: "Top Rated" },
    { id: "3", title: "BCAA Recovery Powder", description: "2:1:1 BCAA ratio with electrolytes. Tropical flavor.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop", price: "$34.99" },
    { id: "4", title: "Pre-Workout Ignite", description: "Explosive energy with 200mg caffeine, beta-alanine, and citrulline malate.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop", price: "$39.99", badge: "New" },
  ],
  pipelineData: [
    { id: "ORD-4521", title: "Sarah Mitchell — 3 items", value: "$149.97", stage: "Completed" },
    { id: "ORD-4520", title: "James Rodriguez — 2 items", value: "$89.98", stage: "Shipped" },
    { id: "ORD-4519", title: "Emily Chen — 5 items", value: "$234.95", stage: "Processing" },
    { id: "ORD-4518", title: "Michael Brown — 1 item", value: "$59.99", stage: "Completed" },
  ],
  menuData: [],
  activityFeed: [
    { action: "Order completed", subject: "Sarah Mitchell — $149.97", time: "2 min ago", icon: "check" },
    { action: "New order", subject: "James Rodriguez — $89.98", time: "15 min ago", icon: "plus" },
    { action: "Payment received", subject: "Emily Chen — $234.95", time: "1 hour ago", icon: "dollar" },
    { action: "Refund processed", subject: "Michael Brown — $59.99", time: "3 hours ago", icon: "rotate" },
  ],
  metrics: {
    revenue: "$805,400",
    orders: "12,847",
    customers: "8,234",
    conversionRate: "3.82%",
    avgOrderValue: "$62.70",
    repeatRate: "42%",
    returnRate: "2.1%",
    nps: "72",
  },
};

const GYM_CRM_DATA: RPSEDataBundle = {
  chartData: [
    { label: "Jan", value: 1180 }, { label: "Feb", value: 1220 },
    { label: "Mar", value: 1247 }, { label: "Apr", value: 1310 },
    { label: "May", value: 1345 }, { label: "Jun", value: 1389 },
    { label: "Jul", value: 1420 }, { label: "Aug", value: 1395 },
    { label: "Sep", value: 1450 }, { label: "Oct", value: 1510 },
    { label: "Nov", value: 1480 }, { label: "Dec", value: 1520 },
  ],
  dashboardStats: [
    { label: "Total Members", value: "1,524", change: "+12%", trend: "up" },
    { label: "Monthly Revenue", value: "$89,450", change: "+8.2%", trend: "up" },
    { label: "Avg Attendance", value: "92/day", change: "+5.1%", trend: "up" },
    { label: "Retention Rate", value: "78.3%", change: "-1.2%", trend: "down" },
  ],
  tableData: [
    { id: "M001", name: "Alex Thompson", email: "alex@email.com", membership: "Premium", status: "Active", joinDate: "Jan 2024", lastVisit: "2 days ago" },
    { id: "M002", name: "Maria Garcia", email: "maria@email.com", membership: "Standard", status: "Active", joinDate: "Feb 2024", lastVisit: "Today" },
    { id: "M003", name: "David Kim", email: "david@email.com", membership: "Premium", status: "Active", joinDate: "Mar 2024", lastVisit: "Yesterday" },
    { id: "M004", name: "Sarah Wilson", email: "sarah@email.com", membership: "Basic", status: "Expired", joinDate: "Nov 2023", lastVisit: "2 weeks ago" },
    { id: "M005", name: "James Brown", email: "james@email.com", membership: "Premium", status: "Active", joinDate: "Apr 2024", lastVisit: "Today" },
    { id: "M006", name: "Lisa Anderson", email: "lisa@email.com", membership: "Standard", status: "Active", joinDate: "May 2024", lastVisit: "3 days ago" },
  ],
  cardData: [
    { id: "M001", title: "Alex Thompson", description: "Premium member since Jan 2024. 47 visits this month.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", badge: "Premium" },
    { id: "M002", title: "Maria Garcia", description: "Standard member since Feb 2024. 32 visits this month.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", badge: "Standard" },
    { id: "M003", title: "David Kim", description: "Premium member since Mar 2024. 41 visits this month.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", badge: "Premium" },
    { id: "M004", title: "Sarah Wilson", description: "Basic member since Nov 2023. Last visit 2 weeks ago.", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", badge: "Expired" },
  ],
  pipelineData: [
    { id: "L001", title: "Jennifer Taylor — Website inquiry", value: "$1,200/yr", stage: "New" },
    { id: "L002", title: "Robert Martinez — Referral", value: "$2,400/yr", stage: "Qualified" },
    { id: "L003", title: "Amanda White — Social media", value: "$1,800/yr", stage: "Contacted" },
    { id: "L004", title: "Christopher Lee — Walk-in", value: "$3,600/yr", stage: "Negotiation" },
  ],
  menuData: [
    { id: "C001", name: "HIIT Blast", category: "Cardio", price: 0, description: "High-intensity interval training. 45 min. Instructor: Mike Johnson." },
    { id: "C002", name: "Yoga Flow", category: "Mind & Body", price: 0, description: "Vinyasa flow for flexibility and balance. 60 min. Instructor: Emma Davis." },
    { id: "C003", name: "Spin Cycle", category: "Cardio", price: 0, description: "Indoor cycling with interval training. 45 min. Instructor: Chris Lee." },
    { id: "C004", name: "Strength Training", category: "Strength", price: 0, description: "Full-body weight training. 50 min. Instructor: Mike Johnson." },
    { id: "C005", name: "Pilates", category: "Mind & Body", price: 0, description: "Core strengthening and flexibility. 55 min. Instructor: Emma Davis." },
  ],
  activityFeed: [
    { action: "New check-in", subject: "Alex Thompson — Premium", time: "5 min ago", icon: "check" },
    { action: "Payment received", subject: "Maria Garcia — $49.99", time: "30 min ago", icon: "dollar" },
    { action: "Class booked", subject: "David Kim — HIIT Blast", time: "1 hour ago", icon: "calendar" },
    { action: "Membership renewed", subject: "James Brown — Premium", time: "3 hours ago", icon: "refresh" },
    { action: "Lead converted", subject: "Robert Martinez — $2,400/yr", time: "5 hours ago", icon: "user" },
  ],
  metrics: {
    totalMembers: "1,524",
    monthlyRevenue: "$89,450",
    avgAttendance: "92/day",
    retentionRate: "78.3%",
    churnRate: "4.2%",
    leadConversion: "28%",
    avgLifetimeValue: "$1,840",
    classUtilization: "76%",
  },
};

const STREAMING_DATA: RPSEDataBundle = {
  chartData: [
    { label: "Jan", value: 2100000 }, { label: "Feb", value: 2250000 },
    { label: "Mar", value: 2180000 }, { label: "Apr", value: 2340000 },
    { label: "May", value: 2420000 }, { label: "Jun", value: 2510000 },
  ],
  dashboardStats: [
    { label: "Total Subscribers", value: "2.5M", change: "+4.2%", trend: "up" },
    { label: "Monthly Revenue", value: "$34.2M", change: "+6.8%", trend: "up" },
    { label: "Avg Watch Time", value: "2h 14m", change: "+8.3%", trend: "up" },
    { label: "Churn Rate", value: "2.1%", change: "-0.3%", trend: "down" },
  ],
  tableData: [
    { id: "1", title: "The Last Frontier", type: "Movie", genre: "Action, Sci-Fi", rating: "PG-13", duration: "2h 14m", views: "4.2M", match: "98%" },
    { id: "2", title: "Cyber Wars", type: "Series", genre: "Thriller", rating: "TV-MA", duration: "3 Seasons", views: "3.8M", match: "95%" },
    { id: "3", title: "Ocean's Memory", type: "Movie", genre: "Drama, Mystery", rating: "PG", duration: "1h 48m", views: "2.1M", match: "92%" },
    { id: "4", title: "Code Breakers", type: "Series", genre: "Documentary", rating: "TV-14", duration: "2 Seasons", views: "1.9M", match: "89%" },
    { id: "5", title: "Mountain Peak", type: "Movie", genre: "Adventure", rating: "R", duration: "2h 2m", views: "3.1M", match: "87%" },
    { id: "6", title: "The Heist", type: "Movie", genre: "Crime, Thriller", rating: "TV-MA", duration: "1h 56m", views: "4.5M", match: "94%" },
  ],
  cardData: [
    { id: "1", title: "The Last Frontier", description: "In a future where Earth is dying, a team embarks on a mission to find a new home.", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=170&fit=crop", badge: "98% Match" },
    { id: "2", title: "Cyber Wars", description: "A hacker discovers a global conspiracy and must choose between truth and family.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&h=170&fit=crop", badge: "New Season" },
    { id: "3", title: "Ocean's Memory", description: "A marine biologist uncovers secrets from her past.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=170&fit=crop", badge: "92% Match" },
    { id: "4", title: "The Heist", description: "A master thief assembles a crew for one last job.", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=170&fit=crop", badge: "94% Match" },
  ],
  pipelineData: [],
  menuData: [],
  activityFeed: [
    { action: "New release", subject: "The Last Frontier — Now Streaming", time: "1 day ago", icon: "play" },
    { action: "Trending", subject: "Cyber Wars — #1 in 42 countries", time: "3 days ago", icon: "trending" },
    { action: "Award", subject: "Ocean's Memory — Best Drama Nominee", time: "1 week ago", icon: "award" },
  ],
  metrics: {
    subscribers: "2.5M",
    monthlyRevenue: "$34.2M",
    avgWatchTime: "2h 14m",
    churnRate: "2.1%",
    contentLibrary: "12,400+",
    countriesAvailable: "190+",
    streamsPerDay: "180M",
    avgSessionLength: "72 min",
  },
};

const RESTAURANT_DATA: RPSEDataBundle = {
  chartData: [
    { label: "Mon", value: 142 }, { label: "Tue", value: 168 },
    { label: "Wed", value: 155 }, { label: "Thu", value: 189 },
    { label: "Fri", value: 234 }, { label: "Sat", value: 287 },
    { label: "Sun", value: 198 },
  ],
  dashboardStats: [
    { label: "Today's Revenue", value: "$4,892", change: "+12%", trend: "up" },
    { label: "Reservations", value: "47", change: "+8", trend: "up" },
    { label: "Avg Table Turn", value: "42 min", change: "-3 min", trend: "down" },
    { label: "Customer Rating", value: "4.8/5", change: "+0.1", trend: "up" },
  ],
  tableData: [
    { id: "1", name: "Salmon Sashimi", category: "Sashimi", price: "$16.99", status: "Popular", description: "Fresh Atlantic salmon, thinly sliced" },
    { id: "2", name: "Dragon Roll", category: "Rolls", price: "$18.99", status: "Popular", description: "Shrimp tempura, avocado, eel sauce" },
    { id: "3", name: "Spicy Tuna Roll", category: "Rolls", price: "$14.99", status: "Active", description: "Fresh tuna, spicy mayo, cucumber" },
    { id: "4", name: "Chicken Teriyaki", category: "Entrees", price: "$15.99", status: "Active", description: "Grilled chicken with house teriyaki" },
    { id: "5", name: "Miso Ramen", category: "Ramen", price: "$16.99", status: "Popular", description: "Rich miso broth, chashu pork, soft egg" },
    { id: "6", name: "Tempura Udon", category: "Ramen", price: "$14.99", status: "Active", description: "Udon in dashi broth with shrimp tempura" },
  ],
  cardData: [
    { id: "1", title: "Salmon Sashimi", description: "Fresh Atlantic salmon, thinly sliced. Served with wasabi and soy sauce.", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", price: "$16.99", badge: "Popular" },
    { id: "2", title: "Dragon Roll", description: "Shrimp tempura, avocado, eel sauce, and tobiko. 8 pieces.", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop", price: "$18.99", badge: "Chef's Pick" },
    { id: "3", title: "Miso Ramen", description: "Rich miso broth, chashu pork, soft egg, nori, and green onions.", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", price: "$16.99" },
    { id: "4", title: "Chicken Teriyaki", description: "Grilled chicken thigh glazed with house teriyaki. Served with steamed rice.", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", price: "$15.99" },
  ],
  pipelineData: [],
  menuData: [
    { id: "1", name: "Salmon Sashimi", category: "Sashimi", price: 16.99, description: "Fresh Atlantic salmon, thinly sliced. Served with wasabi and soy sauce." },
    { id: "2", name: "Dragon Roll", category: "Rolls", price: 18.99, description: "Shrimp tempura, avocado, eel sauce, and tobiko. 8 pieces." },
    { id: "3", name: "Spicy Tuna Roll", category: "Rolls", price: 14.99, description: "Fresh tuna, spicy mayo, cucumber, and sesame seeds. 8 pieces." },
    { id: "4", name: "Chicken Teriyaki", category: "Entrees", price: 15.99, description: "Grilled chicken thigh glazed with house teriyaki. Served with steamed rice." },
    { id: "5", name: "Miso Ramen", category: "Ramen", price: 16.99, description: "Rich miso broth, chashu pork, soft egg, nori, and green onions." },
    { id: "6", name: "Edamame", category: "Appetizers", price: 6.99, description: "Steamed soybeans with sea salt. A classic appetizer." },
    { id: "7", name: "Gyoza", category: "Appetizers", price: 8.99, description: "Pan-fried pork dumplings with dipping sauce. 6 pieces." },
  ],
  activityFeed: [
    { action: "Reservation", subject: "Table 5 — 7:00 PM, 4 guests", time: "10 min ago", icon: "calendar" },
    { action: "Order placed", subject: "Table 12 — Dragon Roll, Miso Ramen", time: "25 min ago", icon: "plus" },
    { action: "Payment received", subject: "Table 3 — $67.96", time: "1 hour ago", icon: "dollar" },
    { action: "Review posted", subject: "Michael Chang — 5 stars", time: "2 hours ago", icon: "star" },
  ],
  metrics: {
    todayRevenue: "$4,892",
    weeklyRevenue: "$28,450",
    monthlyRevenue: "$112,300",
    avgPartySize: "3.2",
    avgCheck: "$42.80",
    reservationRate: "68%",
    deliveryOrders: "45/day",
    customerRating: "4.8/5",
  },
};

const ADMIN_DASHBOARD_DATA: RPSEDataBundle = {
  chartData: [
    { label: "Jan", value: 89400 }, { label: "Feb", value: 95200 },
    { label: "Mar", value: 102800 }, { label: "Apr", value: 98500 },
    { label: "May", value: 115300 }, { label: "Jun", value: 124563 },
  ],
  dashboardStats: [
    { label: "Total Revenue", value: "$124,563", change: "+14.2%", trend: "up" },
    { label: "Total Orders", value: "3,456", change: "+8.1%", trend: "up" },
    { label: "Active Users", value: "12,345", change: "+5.7%", trend: "up" },
    { label: "Conversion Rate", value: "3.24%", change: "-0.4%", trend: "down" },
  ],
  tableData: [
    { id: "ORD-7891", customer: "John Smith", email: "john@email.com", amount: "$299.99", status: "Completed", date: "2024-06-15", items: "3 items" },
    { id: "ORD-7892", customer: "Sarah Johnson", email: "sarah@email.com", amount: "$149.50", status: "Processing", date: "2024-06-15", items: "2 items" },
    { id: "ORD-7893", customer: "Mike Davis", email: "mike@email.com", amount: "$89.99", status: "Shipped", date: "2024-06-14", items: "1 item" },
    { id: "ORD-7894", customer: "Emily Brown", email: "emily@email.com", amount: "$459.00", status: "Completed", date: "2024-06-14", items: "5 items" },
    { id: "ORD-7895", customer: "Chris Wilson", email: "chris@email.com", amount: "$199.99", status: "Pending", date: "2024-06-14", items: "2 items" },
  ],
  cardData: [
    { id: "P001", title: "Wireless Headphones", description: "Premium noise-cancelling over-ear headphones", price: "$79.99", badge: "In Stock (145)" },
    { id: "P002", title: "Running Shoes", description: "Lightweight performance running shoes", price: "$129.99", badge: "In Stock (89)" },
    { id: "P003", title: "Coffee Maker", description: "Programmable 12-cup drip coffee maker", price: "$49.99", badge: "Low Stock (23)" },
    { id: "P004", title: "Yoga Mat", description: "Non-slip premium exercise yoga mat", price: "$34.99", badge: "Out of Stock" },
  ],
  pipelineData: [
    { id: "ORD-7891", title: "John Smith — 3 items", value: "$299.99", stage: "Completed" },
    { id: "ORD-7892", title: "Sarah Johnson — 2 items", value: "$149.50", stage: "Processing" },
    { id: "ORD-7893", title: "Mike Davis — 1 item", value: "$89.99", stage: "Shipped" },
    { id: "ORD-7894", title: "Emily Brown — 5 items", value: "$459.00", stage: "Completed" },
  ],
  menuData: [],
  activityFeed: [
    { action: "Order completed", subject: "John Smith — $299.99", time: "5 min ago", icon: "check" },
    { action: "New order", subject: "Sarah Johnson — $149.50", time: "20 min ago", icon: "plus" },
    { action: "Payment received", subject: "Mike Davis — $89.99", time: "1 hour ago", icon: "dollar" },
    { action: "Low stock alert", subject: "Coffee Maker — 23 units left", time: "3 hours ago", icon: "alert" },
  ],
  metrics: {
    totalRevenue: "$124,563",
    totalOrders: "3,456",
    activeUsers: "12,345",
    conversionRate: "3.24%",
    avgOrderValue: "$36.04",
    returnRate: "1.8%",
    inventoryValue: "$45,200",
    customerSatisfaction: "4.6/5",
  },
};

const GENERIC_DATA: RPSEDataBundle = {
  chartData: [
    { label: "Jan", value: 1200 }, { label: "Feb", value: 1800 },
    { label: "Mar", value: 1500 }, { label: "Apr", value: 2200 },
    { label: "May", value: 1900 }, { label: "Jun", value: 2800 },
  ],
  dashboardStats: [
    { label: "Total Users", value: "10,234", change: "+12.5%", trend: "up" },
    { label: "Revenue", value: "$84,500", change: "+8.3%", trend: "up" },
    { label: "Tasks Completed", value: "1,847", change: "+15.2%", trend: "up" },
    { label: "Satisfaction", value: "94.2%", change: "+2.1%", trend: "up" },
  ],
  tableData: [
    { id: "USR-001", name: "Alex Johnson", email: "alex@company.com", role: "Admin", status: "Active", lastActive: "2 min ago" },
    { id: "USR-002", name: "Sarah Chen", email: "sarah@company.com", role: "Manager", status: "Active", lastActive: "15 min ago" },
    { id: "USR-003", name: "Mike Rodriguez", email: "mike@company.com", role: "Developer", status: "Active", lastActive: "1 hour ago" },
    { id: "USR-004", name: "Emily Davis", email: "emily@company.com", role: "Designer", status: "Away", lastActive: "3 hours ago" },
  ],
  cardData: [
    { id: "1", title: "Lightning Fast", description: "Built for speed with modern architecture and optimized rendering.", badge: "Performance" },
    { id: "2", title: "Secure by Default", description: "Enterprise-grade security with end-to-end encryption.", badge: "Security" },
    { id: "3", title: "Easy to Use", description: "Intuitive interface your team will love. No training required.", badge: "UX" },
  ],
  pipelineData: [
    { id: "TSK-001", title: "Design new landing page", value: "High", stage: "In Progress" },
    { id: "TSK-002", title: "Implement auth system", value: "Critical", stage: "Review" },
    { id: "TSK-003", title: "Write API documentation", value: "Medium", stage: "Done" },
  ],
  menuData: [],
  activityFeed: [
    { action: "Task completed", subject: "Design new landing page", time: "10 min ago", icon: "check" },
    { action: "New comment", subject: "Sarah Chen on auth system", time: "30 min ago", icon: "comment" },
    { action: "Deploy success", subject: "v2.1.0 pushed to production", time: "2 hours ago", icon: "rocket" },
  ],
  metrics: {
    users: "10,234",
    revenue: "$84,500",
    tasks: "1,847",
    satisfaction: "94.2%",
    uptime: "99.98%",
    responseTime: "42ms",
    bugs: "3 open",
    deployments: "12 this week",
  },
};

// ═══════════════════════════════════════════════════════════
// RPSE CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Detect the RPSE context from a user prompt.
 */
export function detectRPSEContext(prompt: string): RPSEContext {
  const blueprint = detectBlueprint(prompt);
  const domain = blueprint?.id || "generic";

  const companyNames: Record<string, string> = {
    ecommerce: ECOMMERCE_MOCK.companyName,
    "gym-crm": GYM_CRM_MOCK.companyName,
    streaming: STREAMING_MOCK.companyName,
    restaurant: RESTAURANT_MOCK.companyName,
    "admin-dashboard": ADMIN_DASHBOARD_MOCK.companyName,
    generic: GENERIC_MOCK.companyName,
  };

  return {
    domain,
    companyName: companyNames[domain] || GENERIC_MOCK.companyName,
    blueprintId: blueprint?.id || null,
  };
}

/**
 * Get the full RPSE data bundle for a domain.
 */
export function getRPSEData(domain: string): RPSEDataBundle {
  switch (domain) {
    case "ecommerce": return ECOMMERCE_DATA;
    case "gym-crm": return GYM_CRM_DATA;
    case "streaming": return STREAMING_DATA;
    case "restaurant": return RESTAURANT_DATA;
    case "admin-dashboard": return ADMIN_DASHBOARD_DATA;
    default: return GENERIC_DATA;
  }
}

/**
 * Get chart data for a domain — real business metrics, not "Jan: 120".
 */
export function getRPSEChartData(domain: string): Array<{ label: string; value: number }> {
  return getRPSEData(domain).chartData;
}

/**
 * Get dashboard stats for a domain — real KPIs with trends.
 * Intent-driven: biases stats to reflect the user's stated problem.
 */
export function getRPSEDashboardStats(
  domain: string,
  intentProfile?: { successMetrics?: Array<{ metric: string; direction: string; targetHint?: string }>; primaryProblem?: string; primaryGoal?: string } | null
): Array<{ label: string; value: string; change: string; trend: "up" | "down" }> {
  const stats = getRPSEData(domain).dashboardStats;

  if (!intentProfile) return stats;

  const problem = (intentProfile.primaryProblem || "").toLowerCase();
  const goal = (intentProfile.primaryGoal || "").toLowerCase();

  // Intent-driven problem patterns: bias dashboard stats to reflect stated problem
  const problemPatterns: Array<{ keywords: string[]; labelMatch: string[]; change: string; trend: "up" | "down" }> = [
    { keywords: ["churn", "losing", "retention", "leaving"], labelMatch: ["retention", "churn", "active", "member"], change: "+18% concern", trend: "down" },
    { keywords: ["payment", "invoice", "collection", "overdue"], labelMatch: ["payment", "invoice", "revenue", "collection"], change: "30% overdue", trend: "down" },
    { keywords: ["lead", "conversion", "pipeline", "acquisition"], labelMatch: ["lead", "conversion", "pipeline", "prospect"], change: "Below target", trend: "down" },
    { keywords: ["inventory", "stock", "out of stock", "reorder"], labelMatch: ["inventory", "stock", "product"], change: "Low stock alert", trend: "down" },
    { keywords: ["wait", "waitlist", "booking", "reservation"], labelMatch: ["booking", "reservation", "waitlist", "table"], change: "High demand", trend: "down" },
    { keywords: ["engagement", "usage", "adoption", "activation"], labelMatch: ["usage", "engagement", "active", "feature"], change: "Below target", trend: "down" },
    { keywords: ["revenue", "growth", "sales", "upsell"], labelMatch: ["revenue", "sales", "order", "growth"], change: "Needs improvement", trend: "down" },
    { keywords: ["no-show", "attendance", "show up"], labelMatch: ["attendance", "check-in", "show", "visit"], change: "12% no-show", trend: "down" },
    { keywords: ["satisfaction", "review", "complaint", "nps"], labelMatch: ["satisfaction", "rating", "review", "nps"], change: "Below 4.0", trend: "down" },
  ];

  return stats.map(stat => {
    const statLabel = stat.label.toLowerCase();

    // Check problem patterns
    for (const pattern of problemPatterns) {
      const matchesProblem = pattern.keywords.some(k => problem.includes(k));
      const matchesLabel = pattern.labelMatch.some(l => statLabel.includes(l));
      if (matchesProblem && matchesLabel) {
        return { ...stat, change: pattern.change, trend: pattern.trend };
      }
    }

    // Check goal alignment: if goal mentions a metric, highlight it
    if (goal) {
      const goalKeywords = goal.split(/\s+/).filter(w => w.length > 4);
      for (const kw of goalKeywords) {
        if (statLabel.includes(kw)) {
          return { ...stat, change: "Focus area", trend: "up" };
        }
      }
    }

    return stat;
  });
}

/**
 * Get table data for a domain — realistic rows with multiple columns.
 */
export function getRPSETableData(domain: string): Array<Record<string, string>> {
  return getRPSEData(domain).tableData;
}

/**
 * Get card data for a domain — products, content, menu items.
 */
export function getRPSECardData(domain: string): Array<{ id: string; title: string; description: string; image?: string; price?: string; badge?: string }> {
  return getRPSEData(domain).cardData;
}

/**
 * Get pipeline/kanban data for a domain — leads, orders, tasks.
 */
export function getRPSEPipelineData(domain: string): Array<{ id: string; title: string; value: string; stage: string }> {
  return getRPSEData(domain).pipelineData;
}

/**
 * Get menu data for a domain — food items, class schedules, service offerings.
 */
export function getRPSEMenuData(domain: string): Array<{ id: string; name: string; category: string; price: number; description: string }> {
  return getRPSEData(domain).menuData;
}

/**
 * Get activity feed data for a domain — recent actions with timestamps.
 */
export function getRPSEActivityFeed(domain: string): Array<{ action: string; subject: string; time: string; icon: string }> {
  return getRPSEData(domain).activityFeed;
}

/**
 * Get business metrics for a domain — real KPIs.
 */
export function getRPSEMetrics(domain: string): Record<string, string> {
  return getRPSEData(domain).metrics;
}

// ═══════════════════════════════════════════════════════════
// UI STATE SIMULATION
// ═══════════════════════════════════════════════════════════

/**
 * Generate UI state simulation code for a component.
 * Returns TSX snippets for loading, empty, error, and populated states.
 */
export function generateUIStates(componentType: string, domain: string): string {
  const data = getRPSEData(domain);

  switch (componentType) {
    case "table":
      return `
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-800 font-medium">Failed to load data</p>
      <p className="text-red-600 text-sm mt-1">{error}</p>
      <button onClick={() => setError(null)} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Retry</button>
    </div>
  );`;

    case "chart":
      return `
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
  );`;

    case "cards":
      return `
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse border rounded-lg p-4 space-y-3">
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );`;

    case "dashboard":
      return `
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
  );`;

    default:
      return "";
  }
}

// ═══════════════════════════════════════════════════════════
// REALISM VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Validate that generated files have realistic content.
 * Returns a score 0-100 and list of issues found.
 */
export function validateRealism(
  files: Array<{ path: string; content: string; type: string }>,
  domain: string
): { score: number; issues: string[]; passed: boolean } {
  const issues: string[] = [];
  let score = 100;

  // Check 1: No placeholder text patterns
  const placeholderPatterns = [
    /Product\s+[A-Z]\b/,
    /User\s+[A-Z]\b/,
    /Sample\s+Data/i,
    /Lorem\s+ipsum/i,
    /TODO/i,
    /Coming\s+soon/i,
    /Activity\s+item\s+\d/i,
    /\$12,345/,
    /\$1,234/,
  ];

  for (const file of files.filter(f => f.type === "component")) {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(file.content)) {
        issues.push(`Placeholder pattern "${pattern.source}" found in ${file.path}`);
        score -= 5;
      }
    }
  }

  // Check 2: Components should have "use client" directive
  const componentFiles = files.filter(f => f.type === "component" && f.path.endsWith(".tsx"));
  const clientDirectiveCount = componentFiles.filter(f => f.content.includes('"use client"')).length;
  if (componentFiles.length > 0 && clientDirectiveCount / componentFiles.length < 0.5) {
    issues.push(`Only ${clientDirectiveCount}/${componentFiles.length} components have "use client" directive`);
    score -= 10;
  }

  // Check 3: Tables should have real data (not just id/name/status/date)
  const tableFiles = files.filter(f => f.type === "component" && f.content.includes("<table"));
  for (const tf of tableFiles) {
    if (tf.content.includes('"Product A"') || tf.content.includes('"User A"')) {
      issues.push(`Generic data found in table component: ${tf.path}`);
      score -= 10;
    }
  }

  // Check 4: Charts should have domain-specific data
  const chartFiles = files.filter(f => f.type === "component" && (f.path.toLowerCase().includes("chart") || f.content.includes("barChart")));
  for (const cf of chartFiles) {
    if (cf.content.includes("value: 120") && !cf.content.includes("value: 1200")) {
      issues.push(`Generic chart data (value: 120) found in ${cf.path}`);
      score -= 10;
    }
  }

  // Check 5: Domain-specific validation
  if (domain === "ecommerce") {
    const hasProducts = files.some(f => f.content.toLowerCase().includes("whey protein") || f.content.toLowerCase().includes("creatine"));
    if (!hasProducts) {
      issues.push("Ecommerce project missing product-specific content");
      score -= 15;
    }
  } else if (domain === "gym-crm") {
    const hasMembers = files.some(f => f.content.includes("Alex Thompson") || f.content.includes("Maria Garcia"));
    if (!hasMembers) {
      issues.push("Gym CRM project missing member-specific content");
      score -= 15;
    }
  } else if (domain === "streaming") {
    const hasContent = files.some(f => f.content.includes("The Last Frontier") || f.content.includes("Cyber Wars"));
    if (!hasContent) {
      issues.push("Streaming project missing content-specific data");
      score -= 15;
    }
  } else if (domain === "restaurant") {
    const hasMenu = files.some(f => f.content.includes("Salmon Sashimi") || f.content.includes("Dragon Roll"));
    if (!hasMenu) {
      issues.push("Restaurant project missing menu-specific data");
      score -= 15;
    }
  }

  // Check 6: Activity feed should have real timestamps
  const activityFiles = files.filter(f => f.type === "component" && (f.content.includes("ago") || f.content.includes("Activity")));
  for (const af of activityFiles) {
    if (af.content.includes("Activity item 1") || af.content.includes("Activity item 2")) {
      issues.push(`Generic activity items found in ${af.path}`);
      score -= 5;
    }
  }

  // Check 7: Business metrics should be realistic
  const metricPatterns = [
    /\$\d{1,3}(,\d{3})+/,
    /\d+(\.\d+)?%/,
    /\d{1,3}(,\d{3})+/,
  ];

  const hasRealMetrics = files.some(f =>
    metricPatterns.some(p => p.test(f.content))
  );
  if (!hasRealMetrics && files.length > 5) {
    issues.push("No realistic business metrics found in generated files");
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    passed: score >= 70,
  };
}

// ═══════════════════════════════════════════════════════════
// HUMAN PERCEPTION BENCHMARK
// "Would someone believe this business exists?"
// ═══════════════════════════════════════════════════════════

export interface HumanPerceptionResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: { name: string; passed: boolean; weight: number; detail: string }[];
  verdict: string;
}

export function evaluateHumanPerception(
  files: Array<{ path: string; content: string; type: string }>,
  domain: string,
  brandName?: string
): HumanPerceptionResult {
  const checks: HumanPerceptionResult["checks"] = [];

  // 1. Brand name is NOT generic (weight: 15)
  const allContent = files.map(f => f.content).join("\n");
  const genericNames = ["my-project", "project", "my app", "the app", "untitled"];
  const hasRealBrand = brandName && !genericNames.includes(brandName.toLowerCase());
  checks.push({
    name: "Brand Name",
    passed: !!hasRealBrand,
    weight: 15,
    detail: hasRealBrand ? `Brand "${brandName}" is specific` : "Generic brand name detected",
  });

  // 2. Realistic pricing with currency (weight: 15)
  const hasCurrency = /₹\s*\d|Rs\.?\s*\d|\$\s*\d|€\s*\d|£\s*\d/.test(allContent);
  const hasPricing = /plan|pricing|price|per month|\/mo|\/year/i.test(allContent);
  checks.push({
    name: "Pricing",
    passed: hasCurrency && hasPricing,
    weight: 15,
    detail: hasCurrency && hasPricing ? "Real currency and pricing found" : "Missing realistic pricing",
  });

  // 3. Real testimonials with names and locations (weight: 15)
  const indianNames = /Priya|Amit|Rahul|Sneha|Vikram|Neha|Arjun|Deepa|Karan|Meera|Alex|Sarah|Mike|Priya|Viren/i;
  const hasTestimonials = /testimonial|review|customer|client/i.test(allContent);
  const hasNames = indianNames.test(allContent);
  checks.push({
    name: "Testimonials",
    passed: hasTestimonials && hasNames,
    weight: 15,
    detail: hasTestimonials && hasNames ? "Real testimonials with named customers" : "Missing or generic testimonials",
  });

  // 4. Domain-specific products (weight: 15)
  const domainProducts: Record<string, RegExp> = {
    ecommerce: /whey protein|creatine|protein powder|pre-workout|bcaa|fish oil|multivitamin/i,
    restaurant: /sashimi|roll|nigiri|tempura|edamame|miso|teriyaki|ramen/i,
    "gym-crm": /membership|trainer|workout|plan|session|class/i,
    saas: /dashboard|analytics|report|api|integration|team/i,
    healthcare: /doctor|appointment|consultation|treatment|patient|clinic/i,
  };
  const pattern = domainProducts[domain];
  const hasDomainContent = pattern ? pattern.test(allContent) : true;
  checks.push({
    name: "Domain Products",
    passed: hasDomainContent,
    weight: 15,
    detail: hasDomainContent ? `Domain-specific content for "${domain}" found` : `No ${domain}-specific products`,
  });

  // 5. No placeholder images (weight: 10)
  const hasPlaceholders = /\/api\/placeholder|lorem\s+ipsum|placeholder\.com/i.test(allContent);
  checks.push({
    name: "No Placeholders",
    passed: !hasPlaceholders,
    weight: 10,
    detail: hasPlaceholders ? "Placeholder images or text detected" : "Clean — no placeholder content",
  });

  // 6. Realistic business stats (weight: 10)
  const hasStats = /\d{1,3}(,\d{3})+|\d+(\.\d+)?%|\d+\+?\s*(customers|users|members|orders)/i.test(allContent);
  checks.push({
    name: "Business Stats",
    passed: hasStats,
    weight: 10,
    detail: hasStats ? "Realistic business metrics present" : "No business metrics found",
  });

  // 7. Checkout/cart or CTA flow exists (weight: 10)
  const hasFlow = /cart|checkout|buy|order|sign up|get started|subscribe/i.test(allContent);
  checks.push({
    name: "Conversion Flow",
    passed: hasFlow,
    weight: 10,
    detail: hasFlow ? "Action flow (cart/checkout/CTA) present" : "No conversion mechanism found",
  });

  // Calculate score
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = checks.filter(c => c.passed).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  let grade: HumanPerceptionResult["grade"];
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  const failedChecks = checks.filter(c => !c.passed);
  const verdict = failedChecks.length === 0
    ? "A real customer would believe this business exists."
    : `Needs improvement: ${failedChecks.map(c => c.name).join(", ")}.`;

  return { score, grade, checks, verdict };
}

// ═══════════════════════════════════════════════════════════
// WORKFLOW REALITY SCORE
// "Can the user actually complete the core job?"
// ═══════════════════════════════════════════════════════════

export interface WorkflowRealityResult {
  score: number;
  workflows: { name: string; score: number; checks: string[] }[];
  verdict: string;
}

const DOMAIN_WORKFLOWS: Record<string, { name: string; required: string[] }[]> = {
  ecommerce: [
    { name: "Browse & Search", required: ["searchQuery", "activeCategory", "sortBy", "filter"] },
    { name: "Add to Cart", required: ["addItem", "useCart", "onClick"] },
    { name: "Checkout", required: ["step", "address", "paymentMethod", "placeOrder"] },
    { name: "Order Tracking", required: ["orderId", "delivery", "status"] },
  ],
  "gym-crm": [
    { name: "Create Member", required: ["addMember", "form", "onSubmit"] },
    { name: "Assign Trainer", required: ["trainer", "assign", "select"] },
    { name: "Track Attendance", required: ["attendance", "checkin", "present"] },
    { name: "Generate Invoice", required: ["invoice", "amount", "pay"] },
  ],
  saas: [
    { name: "Create Workspace", required: ["workspace", "create", "name"] },
    { name: "Invite Users", required: ["invite", "email", "role"] },
    { name: "Manage Subscription", required: ["plan", "subscribe", "billing"] },
    { name: "View Analytics", required: ["chart", "metric", "period"] },
  ],
  restaurant: [
    { name: "Browse Menu", required: ["menu", "category", "item"] },
    { name: "Place Order", required: ["order", "quantity", "checkout"] },
    { name: "Table Reservation", required: ["reservation", "date", "time", "guests"] },
    { name: "Track Order", required: ["status", "preparing", "delivered"] },
  ],
  "healthcare-clinic": [
    { name: "Book Appointment", required: ["appointment", "doctor", "date", "time"] },
    { name: "View Records", required: ["patient", "history", "record"] },
    { name: "Make Payment", required: ["payment", "amount", "receipt"] },
  ],
};

export function evaluateWorkflowReality(
  files: Array<{ path: string; content: string; type: string }>,
  domain: string
): WorkflowRealityResult {
  const allContent = files.map(f => f.content).join("\n");
  const workflows = DOMAIN_WORKFLOWS[domain] || DOMAIN_WORKFLOWS.ecommerce;

  const results = workflows.map(wf => {
    const checks = wf.required.filter(keyword => {
      const regex = new RegExp(keyword, "i");
      return regex.test(allContent);
    });
    const score = Math.round((checks.length / wf.required.length) * 100);
    return { name: wf.name, score, checks: wf.required.map(r => `${r}: ${allContent.includes(r) ? "✓" : "✗"}`) };
  });

  const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  const failedWorkflows = results.filter(r => r.score < 80);
  const verdict = failedWorkflows.length === 0
    ? "All core workflows are functional."
    : `Needs improvement: ${failedWorkflows.map(w => w.name).join(", ")}.`;

  return { score: avgScore, workflows: results, verdict };
}

// ═══════════════════════════════════════════════════════════
// DATA PROVIDER FILE GENERATOR
// ═══════════════════════════════════════════════════════════

/**
 * Generate a shared data provider file for the output app.
 * This provides a single source of truth for all mock data.
 */
export function generateDataProvider(domain: string): string {
  const data = getRPSEData(domain);
  const ctx = detectRPSEContext(domain === "generic" ? "" : domain);

  return `/**
 * Data Provider — RPSE-generated realistic mock data
 * Domain: ${domain}
 * Company: ${ctx.companyName}
 *
 * All components import from this file for consistent, realistic data.
 * Edit this file to customize the demo data.
 */

// ═══════════════════════════════════════════════════════════
// COMPANY INFO
// ═══════════════════════════════════════════════════════════

export const COMPANY = {
  name: "${ctx.companyName}",
  domain: "${domain}",
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════

export const DASHBOARD_STATS = ${JSON.stringify(data.dashboardStats, null, 2)};

// ═══════════════════════════════════════════════════════════
// CHART DATA
// ═══════════════════════════════════════════════════════════

export const CHART_DATA = ${JSON.stringify(data.chartData, null, 2)};

// ═══════════════════════════════════════════════════════════
// TABLE DATA
// ═══════════════════════════════════════════════════════════

export const TABLE_DATA = ${JSON.stringify(data.tableData, null, 2)};

// ═══════════════════════════════════════════════════════════
// CARD DATA
// ═══════════════════════════════════════════════════════════

export const CARD_DATA = ${JSON.stringify(data.cardData, null, 2)};

// ═══════════════════════════════════════════════════════════
// PIPELINE / KANBAN DATA
// ═══════════════════════════════════════════════════════════

export const PIPELINE_DATA = ${JSON.stringify(data.pipelineData, null, 2)};

// ═══════════════════════════════════════════════════════════
// MENU DATA
// ═══════════════════════════════════════════════════════════

export const MENU_DATA = ${JSON.stringify(data.menuData, null, 2)};

// ═══════════════════════════════════════════════════════════
// ACTIVITY FEED
// ═══════════════════════════════════════════════════════════

export const ACTIVITY_FEED = ${JSON.stringify(data.activityFeed, null, 2)};

// ═══════════════════════════════════════════════════════════
// BUSINESS METRICS
// ═══════════════════════════════════════════════════════════

export const METRICS = ${JSON.stringify(data.metrics, null, 2)};

// ═══════════════════════════════════════════════════════════
// HELPER: Avatar URL generator
// ═══════════════════════════════════════════════════════════

export function getAvatarUrl(seed: string): string {
  return \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${encodeURIComponent(seed)}\`;
}

// ═══════════════════════════════════════════════════════════
// HELPER: Status color mapping
// ═══════════════════════════════════════════════════════════

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  expired: "bg-red-100 text-red-800",
  inactive: "bg-red-100 text-red-800",
  "out of stock": "bg-red-100 text-red-800",
  popular: "bg-orange-100 text-orange-800",
  "low stock": "bg-yellow-100 text-yellow-800",
};

// ═══════════════════════════════════════════════════════════
// PRODUCTS CATALOG (shared across all components)
// ═══════════════════════════════════════════════════════════

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  category: string;
  badge?: string;
  veg: boolean;
  fssai: string;
  labTested: boolean;
  weight: string;
  flavor?: string;
  benefits: string[];
}

export const PRODUCTS: Product[] = [
  { id: "1", name: "Whey Protein Isolate", brand: "FuelCore", price: 2499, originalPrice: 3299, rating: 4.8, reviews: 2847, category: "protein", badge: "Best Seller", veg: false, fssai: "10019062000", labTested: true, weight: "1 kg", flavor: "Chocolate Dream", benefits: ["27g protein per serving", "Low carb, low fat", "Fast absorbing isolate"] },
  { id: "2", name: "Creatine Monohydrate", brand: "FuelCore", price: 1499, originalPrice: 1899, rating: 4.7, reviews: 1923, category: "protein", badge: "Top Rated", veg: true, fssai: "10019062000", labTested: true, weight: "500 g", flavor: "Unflavored", benefits: ["5g micronized creatine", "Enhances strength & power", "Micronized for better mixability"] },
  { id: "3", name: "BCAA Recovery Complex", brand: "ActiveEdge", price: 1999, originalPrice: 2499, rating: 4.6, reviews: 1456, category: "recovery", veg: true, fssai: "10019062000", labTested: true, weight: "300 g", flavor: "Tropical Mango", benefits: ["2:1:1 BCAA ratio", "Enhanced recovery", "Electrolyte blend included"] },
  { id: "4", name: "Pre-Workout Surge", brand: "FuelCore", price: 2299, originalPrice: 2999, rating: 4.5, reviews: 1203, category: "vitality", badge: "New", veg: true, fssai: "10019062000", labTested: true, weight: "300 g", flavor: "Blue Raspberry", benefits: ["200mg caffeine", "Beta-alanine + citrulline", "No crash formula"] },
  { id: "5", name: "Omega-3 Fish Oil", brand: "PureNutri", price: 999, originalPrice: 1499, rating: 4.8, reviews: 3201, category: "vitality", veg: false, fssai: "10019062000", labTested: true, weight: "90 softgels", benefits: ["EPA + DHA formula", "Heart & brain health", "Enteric coated, no fishy aftertaste"] },
  { id: "6", name: "Mass Gainer Pro", brand: "FuelCore", price: 2999, originalPrice: 3799, rating: 4.4, reviews: 987, category: "protein", badge: "Popular", veg: false, fssai: "10019062000", labTested: true, weight: "2 kg", flavor: "Double Chocolate", benefits: ["50g protein + 250g carbs", "1250 calories per serving", "Added digestive enzymes"] },
  { id: "7", name: "Ashwagandha KSM-66", brand: "PureNutri", price: 799, originalPrice: 1199, rating: 4.7, reviews: 2156, category: "brain", badge: "Trending", veg: true, fssai: "10019062000", labTested: true, weight: "60 capsules", benefits: ["600mg KSM-66 extract", "Reduces cortisol & stress", "Boosts focus & vitality"] },
  { id: "8", name: "Glucosamine Chondroitin", brand: "ActiveEdge", price: 1299, originalPrice: 1699, rating: 4.5, reviews: 876, category: "recovery", veg: true, fssai: "10019062000", labTested: true, weight: "120 tablets", benefits: ["Joint support formula", "MSM + turmeric added", "Reduces joint stiffness"] },
  { id: "9", name: "Green Tea Fat Burner", brand: "PureNutri", price: 699, originalPrice: 999, rating: 4.3, reviews: 1543, category: "weight", veg: true, fssai: "10019062000", labTested: true, weight: "90 capsules", benefits: ["500mg green tea extract", "EGCG for metabolism", "Appetite support"] },
];

// ═══════════════════════════════════════════════════════════
// BRANDS
// ═══════════════════════════════════════════════════════════

export const BRANDS = [
  { id: "fuelcore", name: "FuelCore", tagline: "Performance Nutrition", description: "Lab-tested, FSSAI certified sports supplements. Trusted by 50,000+ Indian athletes.", products: 24, rating: 4.8, color: "from-amber-500 to-orange-600", emoji: "🔥" },
  { id: "activeedge", name: "ActiveEdge", tagline: "Science-Backed Formulas", description: "Clinically dosed formulations with transparent labeling. No proprietary blends.", products: 18, rating: 4.7, color: "from-blue-500 to-indigo-600", emoji: "⚡" },
  { id: "purenutri", name: "PureNutri", tagline: "Wellness Essentials", description: "Ayurvedic wisdom meets modern science. 100% vegetarian supplements.", products: 31, rating: 4.6, color: "from-green-500 to-emerald-600", emoji: "🌿" },
];

// ═══════════════════════════════════════════════════════════
// REVIEWS (linked to product IDs)
// ═══════════════════════════════════════════════════════════

export const REVIEWS = [
  { id: "r1", productId: "1", author: "Rajesh K.", rating: 5, date: "2 days ago", verified: true, title: "Best whey protein I've used", body: "Mixes smoothly, no bloating. Chocolate flavor tastes real, not artificial.", helpful: 47, avatar: "RK" },
  { id: "r2", productId: "1", author: "Priya M.", rating: 4, date: "1 week ago", verified: true, title: "Good product, slightly expensive", body: "Quality is excellent and FSSAI certified. Only reason for 4 stars is the price.", helpful: 23, avatar: "PM" },
  { id: "r3", productId: "2", author: "Vikram S.", rating: 5, date: "2 weeks ago", verified: true, title: "Clean ingredients, no junk", body: "Finally a supplement without proprietary blends. Every ingredient listed with exact amounts.", helpful: 31, avatar: "VS" },
  { id: "r4", productId: "3", author: "Ananya R.", rating: 5, date: "3 weeks ago", verified: false, title: "Great for recovery", body: "BCAA ratio is perfect. Recovery time cut in half. Tropical mango flavor is amazing.", helpful: 15, avatar: "AR" },
  { id: "r5", productId: "5", author: "Karthik I.", rating: 5, date: "1 month ago", verified: true, title: "No fishy aftertaste", body: "Enteric coated omega-3 that actually works. No burps, no fishy taste.", helpful: 38, avatar: "KI" },
];

// ═══════════════════════════════════════════════════════════
// CATEGORIES (for goal-based filtering)
// ═══════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: "all", label: "All Products", icon: "🔥" },
  { id: "protein", label: "Muscle & Strength", icon: "💪" },
  { id: "weight", label: "Weight Management", icon: "⚖️" },
  { id: "vitality", label: "Vitality & Wellness", icon: "⚡" },
  { id: "brain", label: "Brain & Focus", icon: "🧠" },
  { id: "recovery", label: "Joints & Recovery", icon: "🦴" },
];

// ═══════════════════════════════════════════════════════════
// CART CONTEXT (shared state across all components)
// ═══════════════════════════════════════════════════════════

export const PROMO_CODES: Record<string, { discount: number; type: "percent" | "flat"; minOrder: number; label: string }> = {
  PRISTINE10: { discount: 10, type: "percent", minOrder: 0, label: "10% off everything" },
  FITINDIA: { discount: 500, type: "flat", minOrder: 4000, label: "₹500 off above ₹4,000" },
  FREESHIP: { discount: 0, type: "flat", minOrder: 0, label: "Free express shipping" },
};

export const SHIPPING_THRESHOLD = 999;

// ═══════════════════════════════════════════════════════════
// BUSINESS DATA — Orders, Customers, Inventory
// ═══════════════════════════════════════════════════════════

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: { productId: string; name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  paymentMethod: "upi" | "cod" | "card" | "netbanking";
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export const ORDERS: Order[] = [
  { id: "ORD-2847", customerName: "Rajesh Kumar", customerPhone: "+91 98765 43210", items: [{ productId: "1", name: "Whey Protein Isolate", qty: 2, price: 2499 }, { productId: "5", name: "Omega-3 Fish Oil", qty: 1, price: 999 }], total: 5997, status: "delivered", paymentMethod: "upi", shippingAddress: "Andheri West, Mumbai 400058", createdAt: "2026-06-10", updatedAt: "2026-06-14" },
  { id: "ORD-2848", customerName: "Priya Sharma", customerPhone: "+91 87654 32109", items: [{ productId: "2", name: "Creatine Monohydrate", qty: 1, price: 1499 }, { productId: "4", name: "Pre-Workout Surge", qty: 1, price: 2299 }], total: 3798, status: "shipped", paymentMethod: "card", shippingAddress: "Koramangala, Bangalore 560034", createdAt: "2026-06-15", updatedAt: "2026-06-17" },
  { id: "ORD-2849", customerName: "Vikram Singh", customerPhone: "+91 76543 21098", items: [{ productId: "7", name: "Ashwagandha KSM-66", qty: 3, price: 799 }], total: 2397, status: "processing", paymentMethod: "upi", shippingAddress: "Sector 62, Noida 201301", createdAt: "2026-06-17", updatedAt: "2026-06-17" },
  { id: "ORD-2850", customerName: "Ananya Reddy", customerPhone: "+91 65432 10987", items: [{ productId: "1", name: "Whey Protein Isolate", qty: 1, price: 2499 }, { productId: "3", name: "BCAA Recovery Complex", qty: 2, price: 1999 }], total: 6497, status: "pending", paymentMethod: "cod", shippingAddress: "Jubilee Hills, Hyderabad 500033", createdAt: "2026-06-18", updatedAt: "2026-06-18" },
  { id: "ORD-2851", customerName: "Karthik Menon", customerPhone: "+91 54321 09876", items: [{ productId: "6", name: "Mass Gainer Pro", qty: 1, price: 2999 }], total: 2999, status: "delivered", paymentMethod: "netbanking", shippingAddress: "HSR Layout, Bangalore 560102", createdAt: "2026-06-08", updatedAt: "2026-06-12" },
  { id: "ORD-2852", customerName: "Neha Gupta", customerPhone: "+91 43210 98765", items: [{ productId: "9", name: "Green Tea Fat Burner", qty: 2, price: 699 }, { productId: "5", name: "Omega-3 Fish Oil", qty: 1, price: 999 }], total: 2397, status: "shipped", paymentMethod: "upi", shippingAddress: "Salt Lake, Kolkata 700091", createdAt: "2026-06-16", updatedAt: "2026-06-18" },
  { id: "ORD-2853", customerName: "Arjun Patel", customerPhone: "+91 32109 87654", items: [{ productId: "8", name: "Glucosamine Chondroitin", qty: 1, price: 1299 }], total: 1299, status: "cancelled", paymentMethod: "cod", shippingAddress: "Vastrapur, Ahmedabad 380015", createdAt: "2026-06-14", updatedAt: "2026-06-15" },
];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  membership: "bronze" | "silver" | "gold" | "platinum";
}

export const CUSTOMERS: Customer[] = [
  { id: "C-101", name: "Rajesh Kumar", phone: "+91 98765 43210", email: "rajesh.k@gmail.com", city: "Mumbai", totalOrders: 12, totalSpent: 34590, lastOrder: "2026-06-10", membership: "gold" },
  { id: "C-102", name: "Priya Sharma", phone: "+91 87654 32109", email: "priya.s@outlook.com", city: "Bangalore", totalOrders: 8, totalSpent: 22400, lastOrder: "2026-06-15", membership: "silver" },
  { id: "C-103", name: "Vikram Singh", phone: "+91 76543 21098", email: "vikram.singh@yahoo.com", city: "Noida", totalOrders: 15, totalSpent: 48200, lastOrder: "2026-06-17", membership: "platinum" },
  { id: "C-104", name: "Ananya Reddy", phone: "+91 65432 10987", email: "ananya.r@gmail.com", city: "Hyderabad", totalOrders: 3, totalSpent: 8900, lastOrder: "2026-06-18", membership: "bronze" },
  { id: "C-105", name: "Karthik Menon", phone: "+91 54321 09876", email: "karthik.m@gmail.com", city: "Bangalore", totalOrders: 21, totalSpent: 67800, lastOrder: "2026-06-08", membership: "platinum" },
];

export const INVENTORY = [
  { productId: "1", name: "Whey Protein Isolate", stock: 142, lowStock: 20, status: "in_stock" as const },
  { productId: "2", name: "Creatine Monohydrate", stock: 89, lowStock: 15, status: "in_stock" as const },
  { productId: "3", name: "BCAA Recovery Complex", stock: 8, lowStock: 15, status: "low_stock" as const },
  { productId: "4", name: "Pre-Workout Surge", stock: 67, lowStock: 15, status: "in_stock" as const },
  { productId: "5", name: "Omega-3 Fish Oil", stock: 203, lowStock: 30, status: "in_stock" as const },
  { productId: "6", name: "Mass Gainer Pro", stock: 0, lowStock: 10, status: "out_of_stock" as const },
  { productId: "7", name: "Ashwagandha KSM-66", stock: 156, lowStock: 20, status: "in_stock" as const },
  { productId: "8", name: "Glucosamine Chondroitin", stock: 5, lowStock: 10, status: "low_stock" as const },
  { productId: "9", name: "Green Tea Fat Burner", stock: 78, lowStock: 15, status: "in_stock" as const },
];

// ═══════════════════════════════════════════════════════════
// ORDER STATUS WORKFLOW
// ═══════════════════════════════════════════════════════════

export const ORDER_STATUS_FLOW: Record<OrderStatus, { label: string; color: string; next: OrderStatus[] }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", next: ["processing", "cancelled"] },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", next: ["shipped", "cancelled"] },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800", next: ["delivered"] },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", next: [] },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", next: [] },
};

// ═══════════════════════════════════════════════════════════
// BUSINESS METRICS (computed from real data)
// ═══════════════════════════════════════════════════════════

export const BUSINESS_METRICS = {
  totalRevenue: ORDERS.reduce((sum, o) => o.status !== "cancelled" ? sum + o.total : sum, 0),
  totalOrders: ORDERS.length,
  activeOrders: ORDERS.filter(o => ["pending", "processing", "shipped"].includes(o.status)).length,
  deliveredOrders: ORDERS.filter(o => o.status === "delivered").length,
  cancelledOrders: ORDERS.filter(o => o.status === "cancelled").length,
  averageOrderValue: Math.round(ORDERS.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0) / ORDERS.filter(o => o.status !== "cancelled").length),
  totalCustomers: CUSTOMERS.length,
  repeatCustomers: CUSTOMERS.filter(c => c.totalOrders > 1).length,
  lowStockItems: INVENTORY.filter(i => i.status === "low_stock").length,
  outOfStockItems: INVENTORY.filter(i => i.status === "out_of_stock").length,
  membershipBreakdown: {
    platinum: CUSTOMERS.filter(c => c.membership === "platinum").length,
    gold: CUSTOMERS.filter(c => c.membership === "gold").length,
    silver: CUSTOMERS.filter(c => c.membership === "silver").length,
    bronze: CUSTOMERS.filter(c => c.membership === "bronze").length,
  },
};

// ═══════════════════════════════════════════════════════════
// CART PROVIDER (shared cart state)
// ═══════════════════════════════════════════════════════════

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// ═══════════════════════════════════════════════════════════
// WISHLIST PROVIDER (shared wishlist state)
// ═══════════════════════════════════════════════════════════

interface WishlistContextType {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  count: number;
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Product[]>([]);

  const toggleWishlist = (product: Product) => {
    setItems(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => items.some(p => p.id === productId);
  const count = items.length;

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist, count }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = React.useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENT: CSS-Only Product Image
// ═══════════════════════════════════════════════════════════

export function ProductImage({ product, size = "md" }: { product: Product; size?: "sm" | "md" | "lg" }) {
  const sizes: Record<string, string> = { sm: "w-12 h-12", md: "w-full h-48", lg: "w-full h-64" };
  const productColors: Record<string, string> = {
    protein: "from-emerald-400 to-green-600",
    recovery: "from-blue-400 to-indigo-600",
    vitality: "from-orange-400 to-red-600",
    brain: "from-purple-400 to-violet-600",
    weight: "from-teal-400 to-cyan-600",
  };
  const color = productColors[product.category] || "from-amber-400 to-orange-600";
  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className={"relative " + sizeClass + " rounded-lg overflow-hidden"}>
      <div className={"absolute inset-0 bg-gradient-to-br " + color + " flex items-center justify-center"}>
        <div className="w-16 h-24 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <span className="text-2xl">💪</span>
        </div>
      </div>
      {product.badge && (
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
          {product.badge}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENT: Star Rating
// ═══════════════════════════════════════════════════════════

export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={sizeClass + (i <= Math.round(rating) ? " text-amber-400" : " text-gray-200")} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENT: Price Display (Indian Rupees)
// ═══════════════════════════════════════════════════════════

export function PriceDisplay({ price, originalPrice, size = "md" }: { price: number; originalPrice: number; size?: "sm" | "md" | "lg" }) {
  const savePercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  const textSizes: Record<string, string> = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
  const textClass = textSizes[size] || textSizes.md;
  return (
    <div className="flex items-center gap-2">
      <span className={textClass + " font-bold text-gray-900"}>{"₹" + price.toLocaleString("en-IN")}</span>
      {originalPrice > price && (
        <>
          <span className="text-sm text-gray-400 line-through">{"₹" + originalPrice.toLocaleString("en-IN")}</span>
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{"Save " + savePercent + "%"}</span>
        </>
      )}
    </div>
  );
}
`;
}
