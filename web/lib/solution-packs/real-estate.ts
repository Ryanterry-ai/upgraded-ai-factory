import type { SolutionPack } from "../solution-engine"

export const RealEstatePack: SolutionPack = {
  id: "real-estate",
  name: "Real Estate CRM",

  domains: ["real estate", "property", "realty"],

  keywords: [
    "real estate",
    "property",
    "properties",
    "listing",
    "agent",
    "realty",
    "home",
    "house",
    "apartment",
    "villa",
    "commercial property",
  ],

  solution: {
    domain: "real estate",
    businessType: "crm",

    userProblems: [
      "lead capture",
      "property listing",
      "site visit scheduling",
      "deal pipeline management",
      "document management",
    ],

    businessGoals: [
      "increase property sales",
      "reduce lead response time",
      "improve agent productivity",
      "close deals faster",
    ],

    systems: [
      {
        name: "Lead Management",
        purpose: "Capture and nurture property leads",
        entities: ["Lead", "FollowUp", "Source"],
        workflows: [
          "capture_lead",
          "qualify",
          "match_property",
          "schedule_visit",
          "convert",
        ],
        metrics: [
          "conversion_rate",
          "response_time",
          "lead_source_roi",
        ],
      },
      {
        name: "Property Listings",
        purpose: "Manage property inventory and details",
        entities: ["Property", "Image", "Feature"],
        workflows: [
          "add_property",
          "upload_images",
          "set_price",
          "publish",
          "update",
        ],
        metrics: [
          "listing_views",
          "inquiry_rate",
          "days_on_market",
        ],
      },
      {
        name: "Deal Pipeline",
        purpose: "Track deals from offer to registration",
        entities: ["Deal", "Offer", "Document"],
        workflows: [
          "create_deal",
          "negotiate",
          "book",
          "register",
          "complete",
        ],
        metrics: [
          "pipeline_value",
          "close_rate",
          "average_deal_size",
        ],
      },
    ],
  },
}
