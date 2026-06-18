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
 */
export function getRPSEDashboardStats(domain: string): Array<{ label: string; value: string; change: string; trend: "up" | "down" }> {
  return getRPSEData(domain).dashboardStats;
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
    /placeholder/i,
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
`;
}
