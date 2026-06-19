import type { SolutionPack } from "../solution-engine"

export const EcommerceAdminPack: SolutionPack = {
id: "ecommerce-admin",
name: "Ecommerce Admin",

domains: ["ecommerce", "operations"],

keywords: [
"orders",
"inventory",
"analytics",
"customers",
"admin dashboard"
],

solution: {
domain: "ecommerce",
businessType: "admin",


userProblems: [
  "order management",
  "inventory visibility",
  "customer retention",
  "revenue monitoring"
],

businessGoals: [
  "fulfill orders",
  "reduce stockouts",
  "increase customer value",
  "grow revenue"
],

systems: [
  {
    name: "Order Management",
    purpose: "Handle customer orders",
    entities: ["Order", "Invoice"],
    workflows: [
      "create_order",
      "ship_order",
      "cancel_order",
      "refund_order"
    ],
    metrics: [
      "orders_today",
      "pending_orders"
    ]
  },

  {
    name: "Inventory",
    purpose: "Track stock",
    entities: ["Product", "InventoryItem"],
    workflows: [
      "track_stock",
      "restock",
      "inventory_adjustment"
    ],
    metrics: [
      "low_stock",
      "inventory_value"
    ]
  },

  {
    name: "Customer Management",
    purpose: "Track customer activity",
    entities: ["Customer"],
    workflows: [
      "customer_profile",
      "customer_history",
      "customer_segmentation"
    ],
    metrics: [
      "ltv",
      "repeat_purchase_rate"
    ]
  }
]

}
}
