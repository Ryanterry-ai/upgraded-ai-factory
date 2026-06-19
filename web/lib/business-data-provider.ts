/**
 * Business Entity Layer (BEL)
 *
 * Every number in the UI is derived from entities.
 * Every entity change emits an SSE event.
 * Every component reads from entities, not hardcoded data.
 *
 * Flow: Customer → Places Order → Inventory Reduced → Revenue Increased
 *       → Order Status Changes → Customer History Updated → Dashboard Recalculates
 */

// ═══════════════════════════════════════════════════════════
// ENTITY INTERFACES
// ═══════════════════════════════════════════════════════════

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpent: number;
  orderIds: string[];
  lastOrderDate: string;
  membership: "bronze" | "silver" | "gold" | "platinum";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  category: string;
  stock: number;
  reorderPoint: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  veg: boolean;
  fssai: string;
  weight: string;
  flavor?: string;
  benefits: string[];
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  items: { productId: string; name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  paymentMethod: "upi" | "cod" | "card" | "netbanking";
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  quantity: number;
  type: "sale" | "restock" | "adjustment";
  orderId?: string;
  note: string;
  timestamp: string;
}

export interface BusinessEntities {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  inventoryMovements: InventoryMovement[];
}

export interface BusinessWorkflow {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  currentStep: number;
  status: "idle" | "running" | "completed" | "failed";
}

export interface BusinessMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  repeatCustomerRate: number;
  lowStockItems: number;
  outOfStockItems: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: { productId: string; name: string; revenue: number; units: number }[];
  membershipBreakdown: Record<string, number>;
  inventoryHealth: { inStock: number; lowStock: number; outOfStock: number };
}

export interface BusinessEvent {
  id: string;
  type: "ORDER_PLACED" | "ORDER_STATUS_CHANGED" | "INVENTORY_UPDATED" | "RESTOCK";
  entityId: string;
  entity_type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface BusinessState {
  entities: BusinessEntities;
  workflows: BusinessWorkflow[];
  metrics: BusinessMetrics;
  events: BusinessEvent[];
}

// ═══════════════════════════════════════════════════════════
// METRICS — derived from entities, never hardcoded
// ═══════════════════════════════════════════════════════════

export function computeMetrics(entities: BusinessEntities): BusinessMetrics {
  const { customers, products, orders } = entities;
  const validOrders = orders.filter(o => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const repeatCustomers = customers.filter(c => c.orderIds.length > 1).length;
  const repeatCustomerRate = customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0;
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.reorderPoint).length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;

  const revenueByDay: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayRevenue = validOrders
      .filter(o => o.createdAt.startsWith(dateStr))
      .reduce((sum, o) => sum + o.total, 0);
    revenueByDay.push({ date: dateStr, revenue: dayRevenue });
  }

  const ordersByStatus: Record<OrderStatus, number> = {
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const productRevenue: Record<string, { name: string; revenue: number; units: number }> = {};
  for (const order of validOrders) {
    for (const item of order.items) {
      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = { name: item.name, revenue: 0, units: 0 };
      }
      productRevenue[item.productId].revenue += item.price * item.qty;
      productRevenue[item.productId].units += item.qty;
    }
  }
  const topProducts = Object.entries(productRevenue)
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const membershipBreakdown: Record<string, number> = {};
  for (const c of customers) {
    membershipBreakdown[c.membership] = (membershipBreakdown[c.membership] || 0) + 1;
  }

  return {
    totalRevenue, totalOrders: orders.length,
    activeOrders: orders.filter(o => ["pending", "processing", "shipped"].includes(o.status)).length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    cancelledOrders: orders.filter(o => o.status === "cancelled").length,
    averageOrderValue, totalCustomers: customers.length, repeatCustomerRate,
    lowStockItems, outOfStockItems, revenueByDay, ordersByStatus, topProducts,
    membershipBreakdown,
    inventoryHealth: { inStock: products.filter(p => p.stock > p.reorderPoint).length, lowStock: lowStockItems, outOfStock: outOfStockItems },
  };
}

// ═══════════════════════════════════════════════════════════
// BUSINESS ACTIONS — each action mutates entities + emits event
// ═══════════════════════════════════════════════════════════

export function placeOrder(state: BusinessState, order: Omit<Order, "id" | "createdAt" | "updatedAt">): { state: BusinessState; event: BusinessEvent } {
  const now = new Date().toISOString();
  const orderId = "ORD-" + String(state.entities.orders.length + 2847).padStart(4, "0");
  const newOrder: Order = { ...order, id: orderId, createdAt: now, updatedAt: now };

  const orders = [...state.entities.orders, newOrder];
  const products = state.entities.products.map(p => {
    const item = order.items.find(i => i.productId === p.id);
    return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
  });
  const customers = state.entities.customers.map(c => {
    if (c.id === order.customerId) {
      return { ...c, totalSpent: c.totalSpent + order.total, orderIds: [...c.orderIds, orderId], lastOrderDate: now.split("T")[0] };
    }
    return c;
  });
  const movements: InventoryMovement[] = order.items.map((item, i) => ({
    id: "MOV-" + Date.now() + "-" + i, productId: item.productId, quantity: -item.qty,
    type: "sale" as const, orderId, note: "Sold " + item.qty + "x " + item.name, timestamp: now,
  }));

  const event: BusinessEvent = { id: "EVT-" + Date.now(), type: "ORDER_PLACED", entityId: orderId, entity_type: "order", data: { orderId, customerId: order.customerId, total: order.total }, timestamp: now };
  const newEntities = { customers, products, orders, inventoryMovements: [...state.entities.inventoryMovements, ...movements] };
  return { state: { ...state, entities: newEntities, metrics: computeMetrics(newEntities), events: [...state.events, event] }, event };
}

export function updateOrderStatus(state: BusinessState, orderId: string, newStatus: OrderStatus): { state: BusinessState; event: BusinessEvent } {
  const now = new Date().toISOString();
  const orders = state.entities.orders.map(o => o.id === orderId ? { ...o, status: newStatus, updatedAt: now } : o);
  const event: BusinessEvent = { id: "EVT-" + Date.now(), type: "ORDER_STATUS_CHANGED", entityId: orderId, entity_type: "order", data: { orderId, newStatus }, timestamp: now };
  const newEntities = { ...state.entities, orders };
  return { state: { ...state, entities: newEntities, metrics: computeMetrics(newEntities), events: [...state.events, event] }, event };
}

export function restockProduct(state: BusinessState, productId: string, quantity: number): { state: BusinessState; event: BusinessEvent } {
  const now = new Date().toISOString();
  const products = state.entities.products.map(p => p.id === productId ? { ...p, stock: p.stock + quantity } : p);
  const movement: InventoryMovement = { id: "MOV-" + Date.now(), productId, quantity, type: "restock", note: "Restocked " + quantity + " units", timestamp: now };
  const event: BusinessEvent = { id: "EVT-" + Date.now(), type: "RESTOCK", entityId: productId, entity_type: "product", data: { productId, quantity }, timestamp: now };
  const newEntities = { ...state.entities, products, inventoryMovements: [...state.entities.inventoryMovements, movement] };
  return { state: { ...state, entities: newEntities, metrics: computeMetrics(newEntities), events: [...state.events, event] }, event };
}

// ═══════════════════════════════════════════════════════════
// WORKFLOWS
// ═══════════════════════════════════════════════════════════

export function getWorkflows(): BusinessWorkflow[] {
  return [
    { id: "wf-order", name: "Order Fulfillment", trigger: "ORDER_PLACED", steps: ["Received", "Payment verified", "Packing", "Shipped", "Delivered"], currentStep: 0, status: "idle" },
    { id: "wf-reorder", name: "Inventory Reorder", trigger: "INVENTORY_LOW", steps: ["Low stock detected", "PO created", "Supplier confirmed", "Received", "Stock updated"], currentStep: 0, status: "idle" },
  ];
}
