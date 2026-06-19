import type { SolutionPack } from "../solution-engine"

export const SupplementStorePack = {
id: "supplement-store",

name: "Supplement Store",

domains: ["ecommerce", "supplements"],

keywords: [
"supplement",
"protein",
"creatine",
"whey",
"nutrition",
"health store"
],

solution: {
domain: "supplements",
businessType: "ecommerce",


userProblems: [
  "product discovery",
  "trust building",
  "goal shopping",
  "repeat purchases"
],

businessGoals: [
  "increase conversion",
  "increase AOV",
  "increase retention"
],

systems: [
  {
    name: "Goal Based Shopping",
    purpose: "Help customers buy by goal",
    entities: ["Goal", "Product"],
    workflows: [
      "select_goal",
      "recommend_products"
    ],
    metrics: [
      "goal_conversion_rate"
    ]
  },

  {
    name: "Brand Store",
    purpose: "Browse by brand",
    entities: ["Brand"],
    workflows: [
      "brand_discovery",
      "brand_browse"
    ],
    metrics: [
      "brand_sales"
    ]
  }
]

}
}
