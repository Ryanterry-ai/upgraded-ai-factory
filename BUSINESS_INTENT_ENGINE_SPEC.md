# Business Intent Engine — Concrete Spec

## Problem Statement

The system currently does: `"build a gym CRM"` → keyword regex → `"gym-crm category"` → 8 pre-written pages with hardcoded data.

It never asks **why**. What's the gym owner actually trying to fix? Churn? Billing collection? Staff scheduling chaos?

Without that intent, every generated app is **generic-for-the-category** instead of **useful-for-the-business**.

## Goal

Insert a Business Intent Engine between the user prompt and the SolutionEngine that extracts:

1. **The real problem** — What pain is the user trying to solve?
2. **The business context** — What kind of business? What scale? What constraints?
3. **The success criteria** — What does "working" look like to them?
4. **The priority order** — Which problems matter most right now?

This output then drives everything downstream: which pages to generate, which components to build, which data models to create, and what mock data to use.

---

## Architecture

```
User Prompt
    │
    ▼
┌─────────────────────────┐
│  Business Intent Engine │ ← LLM (Claude) with structured output
│  (NEW — this spec)      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  BusinessIntent         │ ← Structured output (see schema below)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  SolutionEngine (FIXED) │ ← Uses intent to select/refine solution pack
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Architecture Engine    │ ← Uses intent-driven solution to plan routes, components, data models
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Generation Pipeline    │ ← Generates code based on intent, not just category
└─────────────────────────┘
```

---

## Input Schema

The engine receives the raw user prompt plus optional context:

```typescript
interface IntentExtractionInput {
  prompt: string;                    // Raw user prompt
  followUpQuestions?: string[];      // Previous Q&A if multi-turn
  scrapedSite?: ScrapedSite;         // If URL was provided
  existingContext?: {
    projectName?: string;
    industry?: string;
    businessSize?: string;
  };
}
```

---

## Output Schema — BusinessIntent

```typescript
interface BusinessIntent {
  // ─── CORE PROBLEM ───
  coreProblem: {
    description: string;             // "This gym is losing 22% of members monthly due to poor retention tracking"
    category: "retention" | "acquisition" | "operations" | "revenue" | "compliance" | "efficiency" | "visibility" | "automation";
    severity: "critical" | "high" | "medium" | "low";
    evidence: string[];              // What in the prompt led to this conclusion
  };

  // ─── BUSINESS CONTEXT ───
  business: {
    type: string;                    // "gym", "ecommerce store", "SaaS startup"
    domain: string;                  // "fitness", "retail", "technology"
    scale: "solo" | "small" | "medium" | "enterprise";  // 1 person / 2-10 / 11-100 / 100+
    stage: "idea" | "mvp" | "growing" | "established";   // Where they are
    geography?: string;              // "India", "US", "global"
    currency?: string;               // "₹", "$", "€"
    constraints: string[];           // ["budget-limited", "no-developer", "needs-mobile"]
  };

  // ─── STAKEHOLDERS ───
  stakeholders: Array<{
    role: string;                    // "gym owner", "front desk staff", "members"
    primaryGoal: string;             // What they want to accomplish
    painPoint: string;               // What's blocking them
    technicalLevel: "non-technical" | "basic" | "intermediate" | "advanced";
  }>;

  // ─── PRIORITY PROBLEMS ───
  problems: Array<{
    id: string;
    description: string;             // "Members join but never come back after month 2"
    impact: "revenue-loss" | "time-waste" | "member-experience" | "operational-chaos" | "data-blindness";
    currentSolution: string;         // "Spreadsheet tracking, manual follow-ups"
    idealSolution: string;           // "Automated churn alerts, retention workflows"
    priority: number;                // 1 = most urgent
  }>;

  // ─── SUCCESS CRITERIA ───
  successCriteria: Array<{
    metric: string;                  // "monthly churn rate"
    currentValue?: string;           // "22%"
    targetValue?: string;            // "< 10%"
    measurementMethod: string;       // "track member check-ins vs active membership"
  }>;

  // ─── WORKFLOWS THAT MATTER ───
  criticalWorkflows: Array<{
    name: string;                    // "Member Retention Alert"
    trigger: string;                 // "Member hasn't checked in for 14 days"
    actions: string[];               // ["Send SMS", "Notify trainer", "Create follow-up task"]
    frequency: "realtime" | "daily" | "weekly" | "monthly";
    priority: "must-have" | "should-have" | "nice-to-have";
  }>;

  // ─── DATA THAT MATTERS ───
  keyEntities: Array<{
    name: string;                    // "Member"
    purpose: string;                 // "Track gym membership and activity"
    criticalFields: string[];        // ["name", "join_date", "last_checkin", "membership_status"]
    relationships: string[];         // ["has_many checkins", "belongs_to membership_plan"]
    mockDataStrategy: "realistic" | "generic";  // Whether to use domain-specific mock data
  }>;

  // ─── PAGE PRIORITY ───
  pagePriority: Array<{
    page: string;                    // "Dashboard"
    reason: string;                  // "Owner needs to see churn metrics at a glance"
    priority: "critical" | "important" | "useful";
    dataShown: string[];             // ["active members", "revenue", "churn alerts"]
  }>;

  // ─── CONFIDENCE & CLARIFICATION ───
  confidence: number;                // 0-1, how confident we are in this extraction
  clarificationNeeded: string[];     // Questions we couldn't answer from the prompt alone
  assumptions: string[];             // What we assumed when the prompt was ambiguous
}
```

---

## Processing Logic

### Step 1: LLM Extraction (Claude)

Use Claude with a structured prompt that asks it to extract the BusinessIntent from the user's prompt.

**System Prompt:**

```
You are a business analyst for a website generation platform. Your job is to understand
WHAT the user is actually trying to build and WHY, not just categorize their prompt.

Given a user prompt, extract a BusinessIntent object. Think like a consultant:
- What pain are they trying to solve?
- What does their business actually look like?
- What would make this app genuinely useful vs. just category-correct?
- What problems matter most to them RIGHT NOW?

Be specific. "Build a gym CRM" could mean:
- A 24-hour gym in Mumbai struggling with 22% monthly churn
- A boutique yoga studio needing class booking
- A CrossFit box with 200 members and 5 trainers

The more specific your extraction, the better the generated app.
```

**User Prompt Template:**

```
Analyze this prompt and extract the BusinessIntent:

"{user_prompt}"

{if followUpQuestions}
Previous context:
{followUpQuestions.map(q => `- ${q}`).join("\n")}
{/if}

{if scrapedSite}
Additional context from scraped site:
- Industry: {scrapedSite.techStack}
- Pages found: {scrapedSite.pages.length}
- Business type indicators: {scrapedSite.components}
{/if}

Return a JSON object matching the BusinessIntent schema.
```

### Step 2: Fallback Rules (No LLM)

If LLM is unavailable or confidence is low, use rule-based extraction:

```typescript
function extractIntentRules(prompt: string): BusinessIntent {
  const lower = prompt.toLowerCase();

  // Detect business type
  const businessType = detectBusinessType(lower);
  
  // Detect problems from keywords
  const problems = detectProblems(lower, businessType);
  
  // Detect scale indicators
  const scale = detectScale(lower);
  
  // Detect geography/currency
  const { geography, currency } = detectGeography(lower);
  
  // Build intent from rules
  return buildIntentFromRules(businessType, problems, scale, geography, currency);
}
```

### Step 3: Intent Refinement

If the LLM returns low confidence or many clarification questions, the system can:
1. Use the partial intent to guide generation
2. Apply reasonable defaults for missing fields
3. Log assumptions for transparency

---

## Integration Points

### 1. Before SolutionEngine

```typescript
// In generation-pipeline.ts, BEFORE detectBlueprint()
const intent = await extractBusinessIntent(request.prompt, {
  followUpQuestions: request.followUpQuestions,
  scrapedSite: scraped,
});

// Intent drives blueprint selection, not just keyword matching
const solution = solutionEngine.detectFromIntent(intent);
```

### 2. SolutionEngine Enhancement

```typescript
// solution-engine.ts — NEW METHOD
detectFromIntent(intent: BusinessIntent): SolutionModel | null {
  // First: try to match against existing packs using intent
  const packMatch = this.detect(intent.coreProblem.description);
  
  if (packMatch) {
    // Refine the pack with intent-specific overrides
    return this.refinePack(packMatch, intent);
  }
  
  // Second: build a custom SolutionModel from intent
  return this.buildFromIntent(intent);
}

private buildFromIntent(intent: BusinessIntent): SolutionModel {
  return {
    domain: intent.business.domain,
    businessType: intent.business.type,
    userProblems: intent.problems.map(p => p.description),
    businessGoals: intent.successCriteria.map(s => `${s.metric}: ${s.currentValue} → ${s.targetValue}`),
    systems: intent.criticalWorkflows.map(w => ({
      name: w.name,
      purpose: w.trigger,
      entities: intent.keyEntities.map(e => e.name),
      workflows: [w.name.toLowerCase().replace(/\s+/g, "_")],
      metrics: intent.successCriteria.map(s => s.metric),
    })),
  };
}
```

### 3. Architecture Engine Enhancement

```typescript
// architecture-engine.ts — intent-driven page priority
export function analyzeRequirements(
  prompt: string, 
  blueprint?: DomainBlueprint | null,
  intent?: BusinessIntent | null
): RequirementMatrix {
  // ... existing logic ...
  
  // NEW: If intent is available, prioritize pages based on intent.pagePriority
  if (intent) {
    // Reorder pages by priority
    pages.sort((a, b) => {
      const aPriority = intent.pagePriority.find(p => 
        p.page.toLowerCase() === a.name.toLowerCase()
      );
      const bPriority = intent.pagePriority.find(p => 
        p.page.toLowerCase() === b.name.toLowerCase()
      );
      const order = { critical: 0, important: 1, useful: 2 };
      return (order[aPriority?.priority || "useful"] - order[bPriority?.priority || "useful"]);
    });
    
    // Add intent-specific features
    for (const workflow of intent.criticalWorkflows) {
      features.push({
        id: `feature-${workflow.name.toLowerCase().replace(/\s+/g, "-")}`,
        type: "feature",
        name: workflow.name,
        description: `Trigger: ${workflow.trigger}. Actions: ${workflow.actions.join(", ")}`,
        required: workflow.priority === "must-have",
        keywords: [workflow.name.toLowerCase(), workflow.trigger.toLowerCase()],
      });
    }
  }
  
  return requirementMatrix;
}
```

### 4. Mock Data Enhancement

```typescript
// generation-pipeline.ts — intent-driven mock data
function getMockDataForIntent(intent: BusinessIntent): MockDataBundle {
  const bundle: MockDataBundle = {
    entities: {},
    workflows: {},
    metrics: {},
  };
  
  for (const entity of intent.keyEntities) {
    if (entity.mockDataStrategy === "realistic") {
      bundle.entities[entity.name] = generateRealisticMocks(entity, intent.business);
    }
  }
  
  for (const workflow of intent.criticalWorkflows) {
    bundle.workflows[workflow.name] = {
      trigger: workflow.trigger,
      actions: workflow.actions,
      frequency: workflow.frequency,
    };
  }
  
  return bundle;
}
```

---

## Example: "Build a gym CRM"

### Current Output (No Intent)
```
Category: gym-crm
Pages: Dashboard, Members, Leads, Attendance, Billing, Staff, Classes, Reports
Components: DataTable, Calendar, Pipeline, InvoiceTable
Mock Data: Generic Indian names, ₹ currency
```

### New Output (With Intent)
```json
{
  "coreProblem": {
    "description": "Gym owner losing 22% of members monthly due to poor retention tracking and manual billing follow-ups",
    "category": "retention",
    "severity": "critical",
    "evidence": ["gym CRM", "member management", "attendance tracking"]
  },
  "business": {
    "type": "gym",
    "domain": "fitness",
    "scale": "small",
    "stage": "growing",
    "geography": "India",
    "currency": "₹",
    "constraints": ["budget-limited", "needs-mobile"]
  },
  "stakeholders": [
    {
      "role": "gym owner",
      "primaryGoal": "Reduce member churn and automate billing",
      "painPoint": "Manually tracking who's about to leave, chasing payments",
      "technicalLevel": "basic"
    },
    {
      "role": "front desk staff",
      "primaryGoal": "Quick member check-ins and class bookings",
      "painPoint": "Paper sign-in sheets, phone-based class bookings",
      "technicalLevel": "non-technical"
    }
  ],
  "problems": [
    {
      "id": "churn-tracking",
      "description": "No visibility into which members are at risk of leaving",
      "impact": "revenue-loss",
      "currentSolution": "Manual spreadsheet tracking, staff intuition",
      "idealSolution": "Automated churn risk scoring with alerts",
      "priority": 1
    },
    {
      "id": "billing-collection",
      "description": "Pending invoices tracked manually, 30% are overdue",
      "impact": "revenue-loss",
      "currentSolution": "WhatsApp reminders, paper receipts",
      "idealSolution": "Automated payment reminders, UPI integration",
      "priority": 2
    },
    {
      "id": "attendance-insight",
      "description": "No data on visit patterns to predict churn",
      "impact": "data-blindness",
      "currentSolution": "Paper sign-in sheet at reception",
      "idealSolution": "Digital check-in with analytics dashboard",
      "priority": 3
    }
  ],
  "successCriteria": [
    {
      "metric": "monthly churn rate",
      "currentValue": "22%",
      "targetValue": "< 10%",
      "measurementMethod": "track member check-ins vs active membership"
    },
    {
      "metric": "invoice collection rate",
      "currentValue": "70%",
      "targetValue": "> 95%",
      "measurementMethod": "paid vs pending invoices"
    }
  ],
  "criticalWorkflows": [
    {
      "name": "Churn Risk Alert",
      "trigger": "Member hasn't checked in for 14 days",
      "actions": ["Send retention SMS", "Notify assigned trainer", "Create follow-up task"],
      "frequency": "daily",
      "priority": "must-have"
    },
    {
      "name": "Payment Reminder",
      "trigger": "Invoice is 3 days overdue",
      "actions": ["Send WhatsApp reminder", "Notify owner", "Flag in dashboard"],
      "frequency": "daily",
      "priority": "must-have"
    },
    {
      "name": "New Member Onboarding",
      "trigger": "Member converts from lead",
      "actions": ["Create member profile", "Assign plan", "Send welcome SMS", "Schedule intro session"],
      "frequency": "realtime",
      "priority": "should-have"
    }
  ],
  "keyEntities": [
    {
      "name": "Member",
      "purpose": "Track gym membership, activity, and retention risk",
      "criticalFields": ["name", "phone", "join_date", "last_checkin", "membership_plan", "churn_risk_score"],
      "relationships": ["has_many checkins", "has_many invoices", "belongs_to membership_plan"],
      "mockDataStrategy": "realistic"
    },
    {
      "name": "CheckIn",
      "purpose": "Track daily gym attendance for churn prediction",
      "criticalFields": ["member_id", "checkin_time", "checkout_time", "activity_type"],
      "relationships": ["belongs_to member"],
      "mockDataStrategy": "realistic"
    },
    {
      "name": "Invoice",
      "purpose": "Track billing and payment collection",
      "criticalFields": ["member_id", "amount", "status", "due_date", "paid_date", "payment_method"],
      "relationships": ["belongs_to member"],
      "mockDataStrategy": "realistic"
    }
  ],
  "pagePriority": [
    {
      "page": "Dashboard",
      "reason": "Owner needs to see churn metrics, overdue invoices, and today's check-ins at a glance",
      "priority": "critical",
      "dataShown": ["churn risk alerts", "overdue invoices", "today's check-ins", "monthly revenue"]
    },
    {
      "page": "Members",
      "reason": "Core entity — need to see all members with retention status",
      "priority": "critical",
      "dataShown": ["member list with churn risk", "last check-in date", "membership status"]
    },
    {
      "page": "Attendance",
      "reason": "Check-in data feeds churn prediction — critical for the core problem",
      "priority": "critical",
      "dataShown": ["today's check-ins", "attendance trends", "no-show alerts"]
    },
    {
      "page": "Billing",
      "reason": "Revenue collection is the second priority problem",
      "priority": "important",
      "dataShown": ["pending invoices", "overdue alerts", "payment history"]
    },
    {
      "page": "Leads",
      "reason": "Acquisition is less urgent than retention right now",
      "priority": "useful",
      "dataShown": ["lead pipeline", "conversion tracking"]
    },
    {
      "page": "Staff",
      "reason": "Nice to have for scheduling but not core problem",
      "priority": "useful",
      "dataShown": ["staff list", "shift schedule"]
    }
  ],
  "confidence": 0.85,
  "clarificationNeeded": [
    "What's the gym's current membership count?",
    "How many trainers/staff work there?",
    "Do they offer group classes or just gym floor access?"
  ],
  "assumptions": [
    "Indian market (based on common gym CRM use cases)",
    "Small gym (2-10 staff, <500 members)",
    "Budget-conscious (prefers automation over manual tracking)",
    "Retention is more urgent than acquisition"
  ]
}
```

### What Changes in Generation

| Aspect | Before (No Intent) | After (With Intent) |
|--------|--------------------|--------------------|
| **Dashboard** | Generic stats cards | Churn risk alerts, overdue invoice panel, today's check-ins |
| **Members** | Basic table with name/email | Member list with churn risk score, last check-in, retention status |
| **Attendance** | Calendar view only | Digital check-in scanner + attendance trends + no-show alerts |
| **Billing** | Invoice list | Payment reminder workflow, overdue alerts, UPI/COD integration |
| **Mock Data** | Generic Indian names | Realistic gym members with check-in history, churn indicators |
| **Components** | DataTable, Calendar | ChurnRiskCard, AttendanceTrendChart, PaymentReminderBanner |
| **Workflows** | None | Churn Alert, Payment Reminder, New Member Onboarding |

---

## Implementation Steps

### Phase 1: Fix Foundation (No LLM)
1. Fix syntax errors in solution-engine.ts (remove backtick code fences)
2. Fix syntax errors in all 4 solution-packs (remove backtick code fences)
3. Wire SolutionEngine into pipeline (import + call before detectBlueprint)
4. Verify it compiles and runs

### Phase 2: Rule-Based Intent (No LLM)
1. Create `business-intent-engine.ts` with rule-based extraction
2. Define business type detection rules (gym, ecommerce, SaaS, etc.)
3. Define problem detection rules (keywords → problems)
4. Define scale/geography detection rules
5. Wire into pipeline before SolutionEngine
6. Test with 10 prompts, verify intent extraction

### Phase 3: LLM-Powered Intent (With Claude)
1. Create structured prompt for Claude
2. Implement `extractBusinessIntent()` with LLM call
3. Add fallback to rules when LLM unavailable
4. Wire into pipeline
5. Test with 20 prompts, compare rule-based vs LLM output

### Phase 4: Intent-Driven Generation
1. Enhance SolutionEngine with `detectFromIntent()`
2. Enhance ArchitectureEngine with intent-driven page priority
3. Enhance mock data generation with intent-driven content
4. Enhance component generation with intent-driven features
5. End-to-end test: prompt → intent → generation → preview

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Business Understanding Score | 3.1/10 | 7.5/10 |
| "Is this app useful for MY business?" | ~20% yes | ~70% yes |
| Mock data relevance | Generic | Domain-specific |
| Page priority alignment | Alphabetical | Intent-driven |
| Workflow presence | 0 | 2-4 per app |
| Clarification questions | 0 | 2-5 per prompt |

---

## File Structure

```
web/lib/
├── business-intent-engine.ts    # NEW — Main engine
├── intent-extraction-rules.ts   # NEW — Rule-based fallback
├── intent-llm-prompt.ts         # NEW — Claude prompt template
├── solution-engine.ts           # FIXED — Remove backticks, add detectFromIntent()
├── solution-packs/              # FIXED — Remove backticks from all 4 files
│   ├── ecommerce-admin.ts
│   ├── gym-crm.ts
│   ├── streaming-platform.ts
│   └── supplement-store.ts
├── architecture-engine.ts       # ENHANCED — Accept intent parameter
├── generation-pipeline.ts       # ENHANCED — Wire intent before blueprint detection
└── mock-data.ts                 # ENHANCED — Intent-driven mock data
```
