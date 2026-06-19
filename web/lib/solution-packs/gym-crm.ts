import type { SolutionPack } from "../solution-engine"

export const GymCRMPack: SolutionPack = {
id: "gym-crm",
name: "Gym CRM",

domains: ["fitness", "crm", "membership"],

keywords: [
"gym",
"fitness",
"member management",
"attendance",
"lead management",
"staff management",
"gym owner"
],

solution: {
domain: "fitness",
businessType: "crm",


userProblems: [
  "lead conversion",
  "attendance tracking",
  "membership retention",
  "payment collection"
],

businessGoals: [
  "increase memberships",
  "reduce churn",
  "improve collections",
  "manage staff"
],

systems: [
  {
    name: "Lead Management",
    purpose: "Convert prospects into members",
    entities: ["Lead", "FollowUp", "Tour"],
    workflows: [
      "capture_lead",
      "follow_up",
      "schedule_tour",
      "convert_to_member"
    ],
    metrics: [
      "conversion_rate",
      "new_leads",
      "lead_sources"
    ]
  },

  {
    name: "Attendance",
    purpose: "Track member check-ins",
    entities: ["Member", "CheckIn"],
    workflows: [
      "member_checkin",
      "attendance_history"
    ],
    metrics: [
      "daily_checkins",
      "active_members"
    ]
  },

  {
    name: "Billing",
    purpose: "Manage memberships and payments",
    entities: ["Invoice", "Payment", "Membership"],
    workflows: [
      "generate_invoice",
      "collect_payment",
      "renew_membership"
    ],
    metrics: [
      "revenue",
      "overdue_invoices"
    ]
  }
]

}
}
