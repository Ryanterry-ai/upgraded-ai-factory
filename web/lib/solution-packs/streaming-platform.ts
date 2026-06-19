import type { SolutionPack } from "../solution-engine"

export const StreamingPlatformPack = {
id: "streaming-platform",

name: "Streaming Platform",

domains: ["media", "streaming"],

keywords: [
"netflix",
"streaming",
"video",
"ott",
"movies"
],

solution: {
domain: "streaming",
businessType: "subscription",


userProblems: [
  "content discovery",
  "content consumption",
  "user retention"
],

businessGoals: [
  "increase watch time",
  "increase subscriptions"
],

systems: [
  {
    name: "Profiles",
    purpose: "Manage viewers",
    entities: ["Profile"],
    workflows: [
      "create_profile",
      "switch_profile"
    ],
    metrics: [
      "active_profiles"
    ]
  },

  {
    name: "Playback",
    purpose: "Watch content",
    entities: ["Video"],
    workflows: [
      "play_video",
      "continue_watching"
    ],
    metrics: [
      "watch_time"
    ]
  },

  {
    name: "Recommendations",
    purpose: "Suggest content",
    entities: ["Recommendation"],
    workflows: [
      "generate_recommendations"
    ],
    metrics: [
      "recommendation_ctr"
    ]
  }
]

}
}
