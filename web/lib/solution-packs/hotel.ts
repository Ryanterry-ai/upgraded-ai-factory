import type { SolutionPack } from "../solution-engine"

export const HotelPack: SolutionPack = {
  id: "hotel",
  name: "Hotel Booking",

  domains: ["hotel", "hospitality", "accommodation"],

  keywords: [
    "hotel",
    "booking",
    "room",
    "reservation",
    "guest",
    "hospitality",
    "resort",
    "lodging",
    "accommodation",
    "check-in",
    "check-out",
  ],

  solution: {
    domain: "hotel",
    businessType: "management",

    userProblems: [
      "room availability",
      "reservation management",
      "guest check-in/out",
      "billing and folio",
      "occupancy optimization",
    ],

    businessGoals: [
      "increase occupancy rate",
      "improve guest satisfaction",
      "maximize revenue per room",
      "streamline operations",
    ],

    systems: [
      {
        name: "Room Management",
        purpose: "Track room availability and status",
        entities: ["Room", "RoomType", "Maintenance"],
        workflows: [
          "check_availability",
          "assign_room",
          "check_in",
          "check_out",
          "clean",
        ],
        metrics: [
          "occupancy_rate",
          "average_daily_rate",
          "revenue_per_available_room",
        ],
      },
      {
        name: "Reservation System",
        purpose: "Book and manage guest reservations",
        entities: ["Reservation", "Guest", "Payment"],
        workflows: [
          "search_rooms",
          "select_dates",
          "book",
          "confirm",
          "check_in",
          "check_out",
          "bill",
        ],
        metrics: [
          "booking_rate",
          "no_show_rate",
          "average_stay_duration",
        ],
      },
      {
        name: "Guest Management",
        purpose: "Manage guest profiles and preferences",
        entities: ["Guest", "Preference", "Feedback"],
        workflows: [
          "register_guest",
          "record_preferences",
          "provide_service",
          "collect_feedback",
          "loyalty_program",
        ],
        metrics: [
          "guest_satisfaction",
          "return_rate",
          "loyalty_program_growth",
        ],
      },
    ],
  },
}
