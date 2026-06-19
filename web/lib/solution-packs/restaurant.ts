import type { SolutionPack } from "../solution-engine"

export const RestaurantPack: SolutionPack = {
  id: "restaurant",
  name: "Restaurant Management",

  domains: ["restaurant", "food", "dining"],

  keywords: [
    "restaurant",
    "food",
    "menu",
    "dining",
    "cafe",
    "order",
    "delivery",
    "reservation",
    "kitchen",
    "chef",
    "cuisine",
    "bistro",
    "pizzeria",
    "sushi",
  ],

  solution: {
    domain: "restaurant",
    businessType: "management",

    userProblems: [
      "order management",
      "table reservations",
      "menu management",
      "kitchen order queue",
      "staff scheduling",
    ],

    businessGoals: [
      "increase table turnover",
      "reduce wait times",
      "improve order accuracy",
      "boost online orders",
    ],

    systems: [
      {
        name: "Order Management",
        purpose: "Process dine-in and delivery orders",
        entities: ["Order", "OrderItem", "Table"],
        workflows: [
          "place_order",
          "kitchen_queue",
          "prepare",
          "serve",
          "complete",
        ],
        metrics: [
          "average_order_value",
          "order_accuracy",
          "delivery_time",
        ],
      },
      {
        name: "Reservation System",
        purpose: "Manage table bookings and walk-ins",
        entities: ["Reservation", "Table", "Guest"],
        workflows: [
          "book_table",
          "confirm_reservation",
          "check_in",
          "seat_guest",
          "complete",
        ],
        metrics: [
          "table_utilization",
          "no_show_rate",
          "average_seating_time",
        ],
      },
      {
        name: "Menu Management",
        purpose: "Manage menu items, pricing, and categories",
        entities: ["MenuItem", "Category", "Modifier"],
        workflows: [
          "add_item",
          "set_price",
          "update_availability",
        ],
        metrics: [
          "popular_dishes",
          "menu_profitability",
          "waste_reduction",
        ],
      },
    ],
  },
}
