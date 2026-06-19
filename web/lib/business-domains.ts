import {
  BusinessState, BusinessEntities, BusinessEvent, BusinessWorkflow,
  Customer, Product, Order, InventoryMovement,
  computeMetrics, getWorkflows,
} from "./business-data-provider";

// ═══════════════════════════════════════════════════════════
// SUPPLEMENT STORE — real Indian brands
// ═══════════════════════════════════════════════════════════

export function generateSupplementBusiness(): BusinessState {
  const products: Product[] = [
    { id: "P-1", name: "MuscleBlaze Biozyme Whey", brand: "MuscleBlaze", price: 2399, originalPrice: 3199, category: "protein", stock: 142, reorderPoint: 20, rating: 4.7, reviewCount: 12847, badge: "Best Seller", veg: false, fssai: "10019062000", weight: "1 kg", flavor: "Chocolate", benefits: ["25g protein per serving", "Biozyme blend for absorption", "Lab-tested"] },
    { id: "P-2", name: "Optimum Nutrition Gold Standard Whey", brand: "ON", price: 3299, originalPrice: 4199, category: "protein", stock: 89, reorderPoint: 15, rating: 4.8, reviewCount: 8923, badge: "Top Rated", veg: false, fssai: "10019062000", weight: "2 lbs", flavor: "Double Rich Chocolate", benefits: ["24g protein", "5.5g BCAAs", "Global #1 whey"] },
    { id: "P-3", name: "Avvatar Whey Protein", brand: "Avvatar", price: 1999, originalPrice: 2599, category: "protein", stock: 8, reorderPoint: 15, rating: 4.6, reviewCount: 3456, veg: true, fssai: "10019062000", weight: "1 kg", flavor: "Malai Kulfi", benefits: ["100% vegetarian", "Indian brand", "No artificial sweeteners"] },
    { id: "P-4", name: "GNC Pro Performance Whey", brand: "GNC", price: 2899, originalPrice: 3599, category: "protein", stock: 67, reorderPoint: 15, rating: 4.5, reviewCount: 2103, badge: "New", veg: false, fssai: "10019062000", weight: "2 lbs", flavor: "Chocolate Deluxe", benefits: ["30g protein", "Pro Performance formula", "GMP certified"] },
    { id: "P-5", name: "MuscleTech NitroTech Whey", brand: "MuscleTech", price: 2799, originalPrice: 3499, category: "protein", stock: 203, reorderPoint: 30, rating: 4.7, reviewCount: 5201, veg: false, fssai: "10019062000", weight: "2 lbs", flavor: "Milk Chocolate", benefits: ["30g protein", "Creatine monohydrate", "Nitrosurge blend"] },
    { id: "P-6", name: "MuscleBlaze Creatine Monohydrate", brand: "MuscleBlaze", price: 899, originalPrice: 1299, category: "recovery", stock: 0, reorderPoint: 10, rating: 4.6, reviewCount: 4987, badge: "Popular", veg: true, fssai: "10019062000", weight: "250 g", flavor: "Unflavored", benefits: ["5g micronized creatine", "Lab-tested purity", "No fillers"] },
    { id: "P-7", name: "Himalayan Ashwagandha KSM-66", brand: "Himalayan", price: 699, originalPrice: 999, category: "brain", stock: 156, reorderPoint: 20, rating: 4.7, reviewCount: 6156, badge: "Trending", veg: true, fssai: "10019062000", weight: "60 capsules", benefits: ["600mg KSM-66", "Reduces cortisol", "Boosts focus"] },
    { id: "P-8", name: "Carbamide Forte Glucosamine", brand: "Carbamide Forte", price: 599, originalPrice: 899, category: "recovery", stock: 5, reorderPoint: 10, rating: 4.4, reviewCount: 1876, veg: true, fssai: "10019062000", weight: "60 tablets", benefits: ["Joint support", "MSM + turmeric", "Made in India"] },
    { id: "P-9", name: "HealthKart HK Vitals Green Tea", brand: "HealthKart", price: 449, originalPrice: 699, category: "weight", stock: 78, reorderPoint: 15, rating: 4.3, reviewCount: 3543, veg: true, fssai: "10019062000", weight: "60 capsules", benefits: ["Green tea extract", "EGCG for metabolism", "Appetite support"] },
  ];

  const customers: Customer[] = [
    { id: "C-101", name: "Rajesh Kumar", email: "rajesh.k@gmail.com", phone: "+91 98765 43210", city: "Mumbai", totalSpent: 34590, orderIds: ["ORD-2847"], lastOrderDate: "2026-06-10", membership: "gold", createdAt: "2025-11-15" },
    { id: "C-102", name: "Priya Sharma", email: "priya.s@outlook.com", phone: "+91 87654 32109", city: "Bangalore", totalSpent: 22400, orderIds: ["ORD-2848", "ORD-2852"], lastOrderDate: "2026-06-16", membership: "silver", createdAt: "2026-01-20" },
    { id: "C-103", name: "Vikram Singh", email: "vikram.singh@yahoo.com", phone: "+91 76543 21098", city: "Noida", totalSpent: 48200, orderIds: ["ORD-2849", "ORD-2853"], lastOrderDate: "2026-06-17", membership: "platinum", createdAt: "2025-08-03" },
    { id: "C-104", name: "Ananya Reddy", email: "ananya.r@gmail.com", phone: "+91 65432 10987", city: "Hyderabad", totalSpent: 6497, orderIds: ["ORD-2850"], lastOrderDate: "2026-06-18", membership: "bronze", createdAt: "2026-05-10" },
    { id: "C-105", name: "Karthik Menon", email: "karthik.m@gmail.com", phone: "+91 54321 09876", city: "Bangalore", totalSpent: 67800, orderIds: ["ORD-2851"], lastOrderDate: "2026-06-08", membership: "platinum", createdAt: "2025-06-22" },
  ];

  const orders: Order[] = [
    { id: "ORD-2847", customerId: "C-101", items: [{ productId: "P-1", name: "MuscleBlaze Biozyme Whey", qty: 2, price: 2399 }, { productId: "P-5", name: "MuscleTech NitroTech Whey", qty: 1, price: 2799 }], total: 7597, status: "delivered", paymentMethod: "upi", shippingAddress: "Andheri West, Mumbai 400058", createdAt: "2026-06-10", updatedAt: "2026-06-14" },
    { id: "ORD-2848", customerId: "C-102", items: [{ productId: "P-2", name: "Optimum Nutrition Gold Standard Whey", qty: 1, price: 3299 }, { productId: "P-7", name: "Himalayan Ashwagandha KSM-66", qty: 1, price: 699 }], total: 3998, status: "shipped", paymentMethod: "card", shippingAddress: "Koramangala, Bangalore 560034", createdAt: "2026-06-15", updatedAt: "2026-06-17" },
    { id: "ORD-2849", customerId: "C-103", items: [{ productId: "P-3", name: "Avvatar Whey Protein", qty: 3, price: 1999 }], total: 5997, status: "processing", paymentMethod: "upi", shippingAddress: "Sector 62, Noida 201301", createdAt: "2026-06-17", updatedAt: "2026-06-17" },
    { id: "ORD-2850", customerId: "C-104", items: [{ productId: "P-1", name: "MuscleBlaze Biozyme Whey", qty: 1, price: 2399 }, { productId: "P-9", name: "HealthKart HK Vitals Green Tea", qty: 2, price: 449 }], total: 3297, status: "pending", paymentMethod: "cod", shippingAddress: "Jubilee Hills, Hyderabad 500033", createdAt: "2026-06-18", updatedAt: "2026-06-18" },
    { id: "ORD-2851", customerId: "C-105", items: [{ productId: "P-4", name: "GNC Pro Performance Whey", qty: 1, price: 2899 }], total: 2899, status: "delivered", paymentMethod: "netbanking", shippingAddress: "HSR Layout, Bangalore 560102", createdAt: "2026-06-08", updatedAt: "2026-06-12" },
    { id: "ORD-2852", customerId: "C-102", items: [{ productId: "P-9", name: "HealthKart HK Vitals Green Tea", qty: 2, price: 449 }, { productId: "P-5", name: "MuscleTech NitroTech Whey", qty: 1, price: 2799 }], total: 3697, status: "shipped", paymentMethod: "upi", shippingAddress: "Koramangala, Bangalore 560034", createdAt: "2026-06-16", updatedAt: "2026-06-18" },
    { id: "ORD-2853", customerId: "C-103", items: [{ productId: "P-8", name: "Carbamide Forte Glucosamine", qty: 1, price: 599 }], total: 599, status: "cancelled", paymentMethod: "cod", shippingAddress: "Sector 62, Noida 201301", createdAt: "2026-06-14", updatedAt: "2026-06-15" },
  ];

  const inventoryMovements: InventoryMovement[] = [
    { id: "MOV-1", productId: "P-1", quantity: -2, type: "sale", orderId: "ORD-2847", note: "Sold 2x MuscleBlaze Biozyme Whey", timestamp: "2026-06-10T10:30:00Z" },
    { id: "MOV-2", productId: "P-5", quantity: -1, type: "sale", orderId: "ORD-2847", note: "Sold 1x MuscleTech NitroTech Whey", timestamp: "2026-06-10T10:30:00Z" },
    { id: "MOV-3", productId: "P-2", quantity: -1, type: "sale", orderId: "ORD-2848", note: "Sold 1x ON Gold Standard Whey", timestamp: "2026-06-15T14:20:00Z" },
    { id: "MOV-4", productId: "P-7", quantity: -1, type: "sale", orderId: "ORD-2848", note: "Sold 1x Himalayan Ashwagandha", timestamp: "2026-06-15T14:20:00Z" },
    { id: "MOV-5", productId: "P-3", quantity: -3, type: "sale", orderId: "ORD-2849", note: "Sold 3x Avvatar Whey Protein", timestamp: "2026-06-17T09:15:00Z" },
    { id: "MOV-6", productId: "P-6", quantity: 50, type: "restock", note: "Restocked 50x MuscleBlaze Creatine", timestamp: "2026-06-12T11:00:00Z" },
  ];

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements };
  const metrics = computeMetrics(entities);
  const workflows = getWorkflows();
  const events: BusinessEvent[] = orders.map(o => ({
    id: "EVT-" + o.id, type: "ORDER_PLACED" as const, entityId: o.id, entity_type: "order",
    data: { orderId: o.id, customerId: o.customerId, total: o.total }, timestamp: o.createdAt,
  }));
  return { entities, workflows, metrics, events };
}

// ═══════════════════════════════════════════════════════════
// GYM CRM
// ═══════════════════════════════════════════════════════════

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: "walk-in" | "referral" | "instagram" | "google-ads";
  status: "new" | "contacted" | "tour-scheduled" | "tour-completed" | "membership-sold" | "lost";
  assignedTrainer?: string;
  tourDate?: string;
  notes: string;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  memberId: string;
  memberName: string;
  checkInTime: string;
  checkOutTime?: string;
  activity: "gym-floor" | "yoga-class" | "hiit-class" | "personal-training" | "swimming";
}

export interface GymMembership {
  id: string;
  memberId: string;
  memberName: string;
  tier: "basic" | "standard" | "premium" | "vip";
  monthlyFee: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "suspended" | "pending-renewal";
  paymentStatus: "paid" | "overdue" | "pending";
}

export function generateGymBusiness(): BusinessState {
  const customers: Customer[] = [
    { id: "GM-1", name: "Rahul Sharma", email: "rahul@gmail.com", phone: "+91 98765 11111", city: "Mumbai", totalSpent: 54000, orderIds: ["GYM-001"], lastOrderDate: "2026-06-18", membership: "gold", createdAt: "2025-03-15" },
    { id: "GM-2", name: "Priya Patel", email: "priya.p@gmail.com", phone: "+91 87654 22222", city: "Mumbai", totalSpent: 30000, orderIds: ["GYM-002"], lastOrderDate: "2026-06-17", membership: "silver", createdAt: "2025-09-20" },
    { id: "GM-3", name: "Amit Singh", email: "amit.s@gmail.com", phone: "+91 76543 33333", city: "Delhi", totalSpent: 108000, orderIds: ["GYM-003"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2024-12-01" },
    { id: "GM-4", name: "Neha Gupta", email: "neha.g@gmail.com", phone: "+91 65432 44444", city: "Gurgaon", totalSpent: 18000, orderIds: ["GYM-004"], lastOrderDate: "2026-06-15", membership: "bronze", createdAt: "2026-01-10" },
    { id: "GM-5", name: "Vikram Rao", email: "vikram.r@gmail.com", phone: "+91 54321 55555", city: "Pune", totalSpent: 72000, orderIds: ["GYM-005"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2025-02-14" },
  ];

  const products: Product[] = [
    { id: "GP-1", name: "Basic Membership", brand: "FitZone", price: 1499, originalPrice: 1499, category: "membership", stock: 999, reorderPoint: 0, rating: 4.5, reviewCount: 234, veg: true, fssai: "", weight: "", benefits: ["Gym floor access", "Locker room", "Basic equipment"] },
    { id: "GP-2", name: "Standard Membership", brand: "FitZone", price: 2499, originalPrice: 2499, category: "membership", stock: 999, reorderPoint: 0, rating: 4.7, reviewCount: 189, veg: true, fssai: "", weight: "", benefits: ["Gym + group classes", "Sauna access", "Nutrition guide"] },
    { id: "GP-3", name: "Premium Membership", brand: "FitZone", price: 4499, originalPrice: 4499, category: "membership", stock: 999, reorderPoint: 0, rating: 4.8, reviewCount: 156, veg: true, fssai: "", weight: "", benefits: ["All access", "4 PT sessions/month", "Spa + recovery"] },
    { id: "GP-4", name: "VIP Membership", brand: "FitZone", price: 7999, originalPrice: 7999, category: "membership", stock: 999, reorderPoint: 0, rating: 4.9, reviewCount: 67, veg: true, fssai: "", weight: "", benefits: ["Unlimited everything", "Dedicated trainer", "Meal plans", "Priority booking"] },
  ];

  const orders: Order[] = [
    { id: "GYM-001", customerId: "GM-1", items: [{ productId: "GP-3", name: "Premium Membership", qty: 1, price: 4499 }], total: 4499, status: "delivered", paymentMethod: "upi", shippingAddress: "FitZone Andheri", createdAt: "2026-06-01", updatedAt: "2026-06-01" },
    { id: "GYM-002", customerId: "GM-2", items: [{ productId: "GP-2", name: "Standard Membership", qty: 1, price: 2499 }], total: 2499, status: "delivered", paymentMethod: "card", shippingAddress: "FitZone Bandra", createdAt: "2026-06-05", updatedAt: "2026-06-05" },
    { id: "GYM-003", customerId: "GM-3", items: [{ productId: "GP-4", name: "VIP Membership", qty: 1, price: 7999 }], total: 7999, status: "delivered", paymentMethod: "netbanking", shippingAddress: "FitZone Delhi", createdAt: "2026-06-10", updatedAt: "2026-06-10" },
    { id: "GYM-004", customerId: "GM-4", items: [{ productId: "GP-1", name: "Basic Membership", qty: 1, price: 1499 }], total: 1499, status: "delivered", paymentMethod: "upi", shippingAddress: "FitZone Gurgaon", createdAt: "2026-06-12", updatedAt: "2026-06-12" },
    { id: "GYM-005", customerId: "GM-5", items: [{ productId: "GP-3", name: "Premium Membership", qty: 1, price: 4499 }], total: 4499, status: "delivered", paymentMethod: "upi", shippingAddress: "FitZone Pune", createdAt: "2026-06-15", updatedAt: "2026-06-15" },
  ];

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements: [] };
  const metrics = computeMetrics(entities);
  const workflows: BusinessWorkflow[] = [
    { id: "wf-lead", name: "Lead Conversion", trigger: "LEAD_CREATED", steps: ["Lead Created", "Contacted", "Tour Scheduled", "Tour Completed", "Membership Sold"], currentStep: 0, status: "idle" },
    { id: "wf-checkin", name: "Check-in Flow", trigger: "MEMBER_ARRIVES", steps: ["Scan ID", "Check-in Recorded", "Activity Logged", "Dashboard Updated"], currentStep: 0, status: "idle" },
    { id: "wf-billing", name: "Billing & Renewal", trigger: "MEMBERSHIP_EXPIRING", steps: ["Expiry Detected", "Renewal Reminder", "Payment Processed", "Membership Extended"], currentStep: 0, status: "idle" },
  ];
  const events: BusinessEvent[] = [];
  return { entities, workflows, metrics, events };
}

// ═══════════════════════════════════════════════════════════
// RESTAURANT
// ═══════════════════════════════════════════════════════════

export interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  currentOrder?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tableId: string;
  date: string;
  time: string;
  status: "confirmed" | "seated" | "completed" | "no-show" | "cancelled";
  specialRequests?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: "starters" | "mains" | "breads" | "rice" | "desserts" | "beverages";
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  prepTime: number; // minutes
  description: string;
}

export interface KitchenOrder {
  id: string;
  orderId: string;
  tableNumber: number;
  items: { name: string; qty: number; status: "pending" | "cooking" | "ready" | "served" }[];
  status: "received" | "preparing" | "ready" | "served" | "billed";
  createdAt: string;
}

export function generateRestaurantBusiness(): BusinessState {
  const customers: Customer[] = [
    { id: "RC-1", name: "Arjun Mehta", email: "arjun.m@gmail.com", phone: "+91 98765 10101", city: "Mumbai", totalSpent: 12400, orderIds: ["RST-001"], lastOrderDate: "2026-06-18", membership: "gold", createdAt: "2025-08-20" },
    { id: "RC-2", name: "Sneha Kapoor", email: "sneha.k@gmail.com", phone: "+91 87654 20202", city: "Mumbai", totalSpent: 8900, orderIds: ["RST-002"], lastOrderDate: "2026-06-17", membership: "silver", createdAt: "2026-01-05" },
    { id: "RC-3", name: "Rohan Joshi", email: "rohan.j@gmail.com", phone: "+91 76543 30303", city: "Delhi", totalSpent: 21500, orderIds: ["RST-003"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2025-05-12" },
  ];

  const products: Product[] = [
    { id: "RM-1", name: "Butter Chicken", brand: "Spice Garden", price: 380, originalPrice: 380, category: "mains", stock: 999, reorderPoint: 0, rating: 4.8, reviewCount: 342, veg: false, fssai: "10019062000", weight: "Full", benefits: ["Creamy tomato gravy", "Tender chicken"] },
    { id: "RM-2", name: "Paneer Tikka Masala", brand: "Spice Garden", price: 320, originalPrice: 320, category: "mains", stock: 999, reorderPoint: 0, rating: 4.7, reviewCount: 289, veg: true, fssai: "10019062000", weight: "Full", benefits: ["Cottage cheese in rich gravy"] },
    { id: "RM-3", name: "Garlic Naan", brand: "Spice Garden", price: 60, originalPrice: 60, category: "breads", stock: 999, reorderPoint: 0, rating: 4.6, reviewCount: 567, veg: true, fssai: "10019062000", weight: "1 pc", benefits: ["Tandoor-baked"] },
    { id: "RM-4", name: "Jeera Rice", brand: "Spice Garden", price: 150, originalPrice: 150, category: "rice", stock: 999, reorderPoint: 0, rating: 4.5, reviewCount: 198, veg: true, fssai: "10019062000", weight: "Full", benefits: ["Basmati with cumin"] },
    { id: "RM-5", name: "Gulab Jamun", brand: "Spice Garden", price: 120, originalPrice: 120, category: "desserts", stock: 999, reorderPoint: 0, rating: 4.7, reviewCount: 456, veg: true, fssai: "10019062000", weight: "2 pcs", benefits: ["Hot, syrup-soaked"] },
    { id: "RM-6", name: "Masala Chai", brand: "Spice Garden", price: 40, originalPrice: 40, category: "beverages", stock: 999, reorderPoint: 0, rating: 4.8, reviewCount: 789, veg: true, fssai: "10019062000", weight: "1 cup", benefits: ["Freshly brewed"] },
  ];

  const orders: Order[] = [
    { id: "RST-001", customerId: "RC-1", items: [{ productId: "RM-1", name: "Butter Chicken", qty: 1, price: 380 }, { productId: "RM-3", name: "Garlic Naan", qty: 2, price: 60 }, { productId: "RM-6", name: "Masala Chai", qty: 2, price: 40 }], total: 580, status: "delivered", paymentMethod: "upi", shippingAddress: "Table 5", createdAt: "2026-06-18T19:30:00Z", updatedAt: "2026-06-18T20:45:00Z" },
    { id: "RST-002", customerId: "RC-2", items: [{ productId: "RM-2", name: "Paneer Tikka Masala", qty: 1, price: 320 }, { productId: "RM-4", name: "Jeera Rice", qty: 1, price: 150 }], total: 470, status: "delivered", paymentMethod: "card", shippingAddress: "Table 3", createdAt: "2026-06-17T13:00:00Z", updatedAt: "2026-06-17T14:15:00Z" },
    { id: "RST-003", customerId: "RC-3", items: [{ productId: "RM-1", name: "Butter Chicken", qty: 2, price: 380 }, { productId: "RM-2", name: "Paneer Tikka Masala", qty: 1, price: 320 }, { productId: "RM-3", name: "Garlic Naan", qty: 4, price: 60 }, { productId: "RM-5", name: "Gulab Jamun", qty: 2, price: 120 }], total: 1560, status: "processing", paymentMethod: "cod", shippingAddress: "Table 8", createdAt: "2026-06-18T20:00:00Z", updatedAt: "2026-06-18T20:10:00Z" },
  ];

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements: [] };
  const metrics = computeMetrics(entities);
  const workflows: BusinessWorkflow[] = [
    { id: "wf-reservation", name: "Reservation Flow", trigger: "RESERVATION_MADE", steps: ["Reservation Confirmed", "Table Assigned", "Guest Seated", "Order Taken", "Order Served", "Bill Generated", "Completed"], currentStep: 0, status: "idle" },
    { id: "wf-kitchen", name: "Kitchen Queue", trigger: "ORDER_PLACED", steps: ["Order Received", "Prepping", "Cooking", "Quality Check", "Ready to Serve", "Served"], currentStep: 0, status: "idle" },
  ];
  const events: BusinessEvent[] = [];
  return { entities, workflows, metrics, events };
}

// ═══════════════════════════════════════════════════════════
// SaaS DASHBOARD
// ═══════════════════════════════════════════════════════════

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  plan: "starter" | "professional" | "enterprise";
  monthlyPrice: number;
  status: "active" | "trial" | "cancelled" | "past-due";
  startDate: string;
  trialEnd?: string;
  mrr: number;
}

export interface FeatureUsage {
  userId: string;
  userName: string;
  feature: string;
  usageCount: number;
  limit: number;
  period: string;
}

export function generateSaaSBusiness(): BusinessState {
  const customers: Customer[] = [
    { id: "SU-1", name: "TechStart India", email: "hello@techstart.in", phone: "+91 98765 60601", city: "Bangalore", totalSpent: 59880, orderIds: ["SAAS-001"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2025-06-01" },
    { id: "SU-2", name: "GrowFast Solutions", email: "team@growfast.io", phone: "+91 87654 70702", city: "Pune", totalSpent: 35940, orderIds: ["SAAS-002"], lastOrderDate: "2026-06-17", membership: "gold", createdAt: "2025-09-15" },
    { id: "SU-3", name: "DataPulse Analytics", email: "ops@datapulse.co", phone: "+91 76543 80803", city: "Delhi", totalSpent: 119880, orderIds: ["SAAS-003"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2025-03-20" },
    { id: "SU-4", name: "FreshCart", email: "dev@freshcart.com", phone: "+91 65432 90904", city: "Chennai", totalSpent: 11940, orderIds: ["SAAS-004"], lastOrderDate: "2026-06-15", membership: "silver", createdAt: "2026-02-10" },
    { id: "SU-5", name: "MediConnect", email: "admin@mediconnect.in", phone: "+91 54321 10105", city: "Hyderabad", totalSpent: 23880, orderIds: ["SAAS-005"], lastOrderDate: "2026-06-18", membership: "gold", createdAt: "2025-11-05" },
    { id: "SU-6", name: "LearnHub Academy", email: "info@learnhub.edu", phone: "+91 43211 20206", city: "Kolkata", totalSpent: 5940, orderIds: ["SAAS-006"], lastOrderDate: "2026-06-10", membership: "bronze", createdAt: "2026-04-01" },
  ];

  const products: Product[] = [
    { id: "SP-1", name: "Starter Plan", brand: "SaaSify", price: 999, originalPrice: 999, category: "subscription", stock: 999, reorderPoint: 0, rating: 4.3, reviewCount: 89, veg: true, fssai: "", weight: "", benefits: ["5 users", "10GB storage", "Email support"] },
    { id: "SP-2", name: "Professional Plan", brand: "SaaSify", price: 2999, originalPrice: 2999, category: "subscription", stock: 999, reorderPoint: 0, rating: 4.6, reviewCount: 156, veg: true, fssai: "", weight: "", benefits: ["25 users", "100GB storage", "Priority support", "API access"] },
    { id: "SP-3", name: "Enterprise Plan", brand: "SaaSify", price: 9999, originalPrice: 9999, category: "subscription", stock: 999, reorderPoint: 0, rating: 4.8, reviewCount: 67, veg: true, fssai: "", weight: "", benefits: ["Unlimited users", "1TB storage", "Dedicated support", "Custom integrations", "SLA"] },
  ];

  const orders: Order[] = [
    { id: "SAAS-001", customerId: "SU-1", items: [{ productId: "SP-3", name: "Enterprise Plan", qty: 1, price: 9999 }], total: 9999, status: "delivered", paymentMethod: "card", shippingAddress: "Annual billing", createdAt: "2025-06-01", updatedAt: "2025-06-01" },
    { id: "SAAS-002", customerId: "SU-2", items: [{ productId: "SP-2", name: "Professional Plan", qty: 1, price: 2999 }], total: 2999, status: "delivered", paymentMethod: "card", shippingAddress: "Monthly billing", createdAt: "2025-09-15", updatedAt: "2025-09-15" },
    { id: "SAAS-003", customerId: "SU-3", items: [{ productId: "SP-3", name: "Enterprise Plan", qty: 1, price: 9999 }], total: 9999, status: "delivered", paymentMethod: "netbanking", shippingAddress: "Annual billing", createdAt: "2025-03-20", updatedAt: "2025-03-20" },
    { id: "SAAS-004", customerId: "SU-4", items: [{ productId: "SP-1", name: "Starter Plan", qty: 1, price: 999 }], total: 999, status: "delivered", paymentMethod: "upi", shippingAddress: "Monthly billing", createdAt: "2026-02-10", updatedAt: "2026-02-10" },
    { id: "SAAS-005", customerId: "SU-5", items: [{ productId: "SP-2", name: "Professional Plan", qty: 1, price: 2999 }], total: 2999, status: "delivered", paymentMethod: "card", shippingAddress: "Monthly billing", createdAt: "2025-11-05", updatedAt: "2025-11-05" },
    { id: "SAAS-006", customerId: "SU-6", items: [{ productId: "SP-1", name: "Starter Plan", qty: 1, price: 999 }], total: 999, status: "cancelled", paymentMethod: "upi", shippingAddress: "Monthly billing", createdAt: "2026-04-01", updatedAt: "2026-05-01" },
  ];

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements: [] };
  const metrics = computeMetrics(entities);
  const workflows: BusinessWorkflow[] = [
    { id: "wf-trial", name: "Trial Conversion", trigger: "TRIAL_STARTED", steps: ["Trial Started", "Onboarding Email", "Day 3 Check-in", "Day 7 Demo", "Day 14 Follow-up", "Conversion/Loss"], currentStep: 0, status: "idle" },
    { id: "wf-churn", name: "Churn Prevention", trigger: "USAGE_DROP", steps: ["Usage Drop Detected", "Automated Email", "CSM Outreach", "Retention Offer", "Win-back"], currentStep: 0, status: "idle" },
  ];
  const events: BusinessEvent[] = [];
  return { entities, workflows, metrics, events };
}

// ═══════════════════════════════════════════════════════════
// AGENCY CRM
// ═══════════════════════════════════════════════════════════

export interface AgencyClient {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: "lead" | "prospect" | "active" | "paused" | "churned";
  monthlyRetainer: number;
  startDate: string;
  projects: string[];
}

export interface AgencyProject {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  type: "website-redesign" | "seo" | "social-media" | "ppc" | "branding" | "content";
  status: "proposal" | "contract-signed" | "in-progress" | "review" | "completed" | "invoiced";
  budget: number;
  startDate: string;
  endDate: string;
  tasks: { name: string; status: "todo" | "in-progress" | "done" }[];
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
}

export function generateAgencyBusiness(): BusinessState {
  const customers: Customer[] = [
    { id: "AG-1", name: "TechNova Solutions", email: "ceo@technova.in", phone: "+91 98765 50501", city: "Bangalore", totalSpent: 480000, orderIds: ["AGY-001"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2025-01-15" },
    { id: "AG-2", name: "GreenLeaf Organics", email: "marketing@greenleaf.in", phone: "+91 87654 60602", city: "Mumbai", totalSpent: 240000, orderIds: ["AGY-002"], lastOrderDate: "2026-06-15", membership: "gold", createdAt: "2025-06-20" },
    { id: "AG-3", name: "UrbanFit Studios", email: "founder@urbanfit.in", phone: "+91 76543 70703", city: "Delhi", totalSpent: 120000, orderIds: ["AGY-003"], lastOrderDate: "2026-06-10", membership: "silver", createdAt: "2025-10-01" },
    { id: "AG-4", name: "CloudServe IT", email: "ops@cloudserve.in", phone: "+91 65432 80804", city: "Pune", totalSpent: 360000, orderIds: ["AGY-004"], lastOrderDate: "2026-06-18", membership: "platinum", createdAt: "2025-04-10" },
  ];

  const products: Product[] = [
    { id: "AP-1", name: "Website Redesign", brand: "PixelCraft Agency", price: 150000, originalPrice: 150000, category: "service", stock: 999, reorderPoint: 0, rating: 4.8, reviewCount: 24, veg: true, fssai: "", weight: "", benefits: ["Custom design", "Responsive", "CMS integration"] },
    { id: "AP-2", name: "SEO Package", brand: "PixelCraft Agency", price: 25000, originalPrice: 25000, category: "service", stock: 999, reorderPoint: 0, rating: 4.6, reviewCount: 31, veg: true, fssai: "", weight: "", benefits: ["Technical SEO", "Content strategy", "Link building"] },
    { id: "AP-3", name: "Social Media Management", brand: "PixelCraft Agency", price: 35000, originalPrice: 35000, category: "service", stock: 999, reorderPoint: 0, rating: 4.5, reviewCount: 18, veg: true, fssai: "", weight: "", benefits: ["Content creation", "Scheduling", "Analytics"] },
    { id: "AP-4", name: "PPC Campaign", brand: "PixelCraft Agency", price: 50000, originalPrice: 50000, category: "service", stock: 999, reorderPoint: 0, rating: 4.7, reviewCount: 12, veg: true, fssai: "", weight: "", benefits: ["Google Ads", "Facebook Ads", "Landing pages"] },
  ];

  const orders: Order[] = [
    { id: "AGY-001", customerId: "AG-1", items: [{ productId: "AP-1", name: "Website Redesign", qty: 1, price: 150000 }, { productId: "AP-2", name: "SEO Package", qty: 1, price: 25000 }], total: 175000, status: "delivered", paymentMethod: "netbanking", shippingAddress: "Milestone 1", createdAt: "2026-01-15", updatedAt: "2026-03-15" },
    { id: "AGY-002", customerId: "AG-2", items: [{ productId: "AP-3", name: "Social Media Management", qty: 3, price: 35000 }], total: 105000, status: "delivered", paymentMethod: "netbanking", shippingAddress: "Q1 2026", createdAt: "2026-01-01", updatedAt: "2026-03-31" },
    { id: "AGY-003", customerId: "AG-3", items: [{ productId: "AP-4", name: "PPC Campaign", qty: 1, price: 50000 }], total: 50000, status: "processing", paymentMethod: "card", shippingAddress: "Campaign setup", createdAt: "2026-06-10", updatedAt: "2026-06-12" },
    { id: "AGY-004", customerId: "AG-4", items: [{ productId: "AP-1", name: "Website Redesign", qty: 1, price: 150000 }, { productId: "AP-2", name: "SEO Package", qty: 1, price: 25000 }, { productId: "AP-3", name: "Social Media Management", qty: 1, price: 35000 }], total: 210000, status: "shipped", paymentMethod: "netbanking", shippingAddress: "Phase 2", createdAt: "2026-04-01", updatedAt: "2026-06-18" },
  ];

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements: [] };
  const metrics = computeMetrics(entities);
  const workflows: BusinessWorkflow[] = [
    { id: "wf-client", name: "Client Acquisition", trigger: "LEAD_INCOMING", steps: ["Lead Identified", "Discovery Call", "Proposal Sent", "Contract Signed", "Onboarding", "Active Client"], currentStep: 0, status: "idle" },
    { id: "wf-project", name: "Project Delivery", trigger: "PROJECT_STARTED", steps: ["Kickoff", "Strategy", "Execution", "Review", "Revision", "Delivery", "Invoice"], currentStep: 0, status: "idle" },
    { id: "wf-invoice", name: "Invoice Collection", trigger: "INVOICE_SENT", steps: ["Invoice Sent", "Payment Reminder", "Follow-up", "Payment Received", "Closed"], currentStep: 0, status: "idle" },
  ];
  const events: BusinessEvent[] = [];
  return { entities, workflows, metrics, events };
}

// ═══════════════════════════════════════════════════════════
// DOMAIN ROUTER
// ═══════════════════════════════════════════════════════════

export function generateBusinessForDomain(domain: string): BusinessState {
  switch (domain) {
    case "ecommerce":
    case "supplement":
      return generateSupplementBusiness();
    case "gym":
    case "fitness":
      return generateGymBusiness();
    case "restaurant":
    case "food":
      return generateRestaurantBusiness();
    case "saas":
    case "dashboard":
      return generateSaaSBusiness();
    case "agency":
    case "marketing":
      return generateAgencyBusiness();
    default:
      return generateSupplementBusiness();
  }
}
