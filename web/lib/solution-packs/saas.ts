import type { SolutionPack } from "../solution-engine";

export const SaaSPack: SolutionPack = {
  id: "saas-platform",
  name: "SaaS Platform",
  domains: ["saas", "subscription", "analytics", "dashboard"],
  keywords: [
    "saas", "subscription", "dashboard", "analytics", "mrr", "arr",
    "churn", "engagement", "onboarding", "billing", "tenant",
    "multi-tenant", "licensing", "usage-based", "seats", "plan",
    "upgrade", "downgrade", "trial", "freemium", "recurring",
    "user engagement", "feature usage", "churn prediction", "revenue metrics"
  ],
  solution: {
    domain: "saas",
    businessType: "platform",
    userProblems: [
      "subscription churn",
      "low trial conversion",
      "unclear usage analytics",
      "billing disputes"
    ],
    businessGoals: [
      "reduce churn rate",
      "increase trial-to-paid conversion",
      "improve user engagement",
      "optimize pricing tiers"
    ],
    systems: [
      {
        name: "Subscription Management",
        purpose: "Manage subscription lifecycle — plans, billing, upgrades, downgrades",
        entities: ["Subscription", "Plan", "Invoice", "PaymentMethod"],
        workflows: [
          "create_subscription",
          "upgrade_plan",
          "downgrade_plan",
          "cancel_subscription",
          "process_payment",
          "handle_failed_payment"
        ],
        metrics: [
          "mrr",
          "arr",
          "churn_rate",
          "ltv",
          "arpu"
        ]
      },
      {
        name: "Usage Analytics",
        purpose: "Track user engagement, feature usage, and product analytics",
        entities: ["Event", "Session", "FeatureUsage", "EngagementScore"],
        workflows: [
          "track_event",
          "calculate_engagement",
          "identify_power_users",
          "detect_churn_risk"
        ],
        metrics: [
          "daily_active_users",
          "feature_adoption_rate",
          "session_duration",
          "activation_rate"
        ]
      },
      {
        name: "Tenant Admin",
        purpose: "Multi-tenant management — teams, roles, permissions, settings",
        entities: ["Tenant", "Team", "Member", "Role", "Permission"],
        workflows: [
          "provision_tenant",
          "invite_member",
          "assign_role",
          "manage_permissions"
        ],
        metrics: [
          "tenant_count",
          "team_size",
          "admin_activation_rate"
        ]
      },
      {
        name: "Billing Portal",
        purpose: "Self-service billing — invoices, payment methods, subscription changes",
        entities: ["Invoice", "PaymentMethod", "Coupon", "CreditNote"],
        workflows: [
          "generate_invoice",
          "process_refund",
          "apply_coupon",
          "update_payment_method"
        ],
        metrics: [
          "invoice_accuracy",
          "payment_success_rate",
          "refund_rate"
        ]
      }
    ]
  }
};
