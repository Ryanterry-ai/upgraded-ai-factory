# Same.dev Runtime Specification

## Overview
The Same.dev Factory is a specialized website clone factory that transforms reference URLs into production-ready Next.js applications through a 11-step workflow. Each step has defined inputs, outputs, state transitions, memory usage, and artifact generation.

---

## Step 1: URL Intake & Validation

| Field | Value |
|-------|-------|
| **Input** | Reference URL string |
| **Owner** | Coordinator Agent |
| **Duration** | 5-15 seconds |
| **State** | `created` → `intake_complete` |

### Process
1. Coordinator Agent receives URL from user
2. Validates URL format (must be HTTPS or HTTP)
3. Checks for blocked domains (internal, auth-required, paywalled)
4. Creates project record in State Store with `project_id`
5. Stores URL in Project Memory

### Memory Usage
- **Working Memory**: Stores raw URL input
- **Project Memory**: Creates project record: `{project_id, url, created_at, status: "created"}`

### Artifacts
- `project-config.yaml` — Project ID, source URL, creation timestamp

### Error Handling
- Invalid URL → reject with validation error message
- Unreachable URL → retry 3x with exponential backoff, then escalate to Coordinator
- Blocked domain → reject with policy violation message

---

## Step 2: Screenshot Capture

| Field | Value |
|-------|-------|
| **Input** | Validated URL, project_config |
| **Owner** | Screenshot Vision Agent |
| **Duration** | 30-120 seconds |
| **State** | `intake_complete` → `screenshots_captured` |

### Process
1. Screenshot Vision Agent launches headless browser
2. Captures full-page screenshot at 1920x1080 viewport
3. Captures mobile screenshot at 375x812 viewport (iPhone)
4. Captures individual section screenshots (hero, nav, footer, etc.)
5. Saves all screenshots to Artifact Layer under `screenshots/`

### Memory Usage
- **Working Memory**: Browser session, viewport config
- **Project Memory**: Screenshot metadata: `{desktop_url, mobile_url, section_urls[], captured_at}`

### Artifacts
- `screenshots/desktop-full.png` — Full desktop screenshot
- `screenshots/mobile-full.png` — Full mobile screenshot
- `screenshots/sections/` — Individual section screenshots

### Dependencies
- Requires Step 1 complete
- Uses Screenshot Vision Agent from Website Intelligence department

---

## Step 3: Design Analysis

| Field | Value |
|-------|-------|
| **Input** | Screenshots, project_config |
| **Owner** | Design Reverse Engineer Agent |
| **Duration** | 60-180 seconds |
| **State** | `screenshots_captured` → `design_analyzed` |

### Process
1. Design Reverse Engineer Agent analyzes all screenshots
2. Extracts color palette (primary, secondary, accent, neutral, semantic)
3. Identifies typography hierarchy (font families, sizes, weights, line heights)
4. Maps spacing system (margins, padding, gaps — 4px/8px grid)
5. Detects layout patterns (grid, flex, sections, containers)
6. Identifies component boundaries (cards, buttons, forms, nav)
7. Creates design-tokens.json with all extracted values

### Memory Usage
- **Working Memory**: Analysis algorithms, vision processing
- **Project Memory**: Design tokens: `{colors, typography, spacing, layout, components}`

### Artifacts
- `design-tokens.json` — Complete design system extraction
- `design-analysis-report.md` — Human-readable summary

### Dependencies
- Requires Step 2 complete
- Uses Design Reverse Engineer Agent from Website Intelligence department

---

## Step 4: Component Extraction

| Field | Value |
|-------|-------|
| **Input** | Screenshots, design-tokens, project_config |
| **Owner** | Component Extractor Agent |
| **Duration** | 60-180 seconds |
| **State** | `design_analyzed` → `components_extracted` |

### Process
1. Component Extractor Agent identifies all UI components
2. Classifies components by type: atomic (button, input, badge), molecular (card, form, dropdown), organism (hero, nav, footer)
3. Maps component hierarchy (parent-child relationships)
4. Extracts component props and variants
5. Creates component registry with names, locations, and dependencies

### Memory Usage
- **Working Memory**: Component classification algorithms
- **Project Memory**: Component registry: `{components[], relationships[], variants[]}`

### Artifacts
- `component-registry.json` — Complete component inventory
- `component-hierarchy.md` — Visual component tree

### Dependencies
- Requires Step 3 complete
- Uses Component Extractor Agent from Website Intelligence department

---

## Step 5: Blueprint Generation

| Field | Value |
|-------|-------|
| **Input** | Design tokens, component registry, screenshots |
| **Owner** | Blueprint Generator Agent |
| **Duration** | 30-90 seconds |
| **State** | `components_extracted` → `blueprint_ready` |

### Process
1. Blueprint Generator Agent synthesizes all analysis data
2. Generates canonical Blueprint YAML (17 sections per Blueprint Schema)
3. Maps components to Next.js component structure
4. Defines page routes and navigation
5. Specifies responsive breakpoints
6. Defines animation requirements
7. Stores Blueprint in Artifact Layer

### Memory Usage
- **Working Memory**: Schema validation, YAML generation
- **Project Memory**: Complete Blueprint YAML

### Artifacts
- `blueprint.yaml` — Canonical 17-section Blueprint
- `blueprint-summary.md` — Quick reference for code gen agents

### Dependencies
- Requires Steps 3 and 4 complete
- Uses Blueprint Generator Agent from Website Intelligence department

---

## Step 6: Blueprint Review

| Field | Value |
|-------|-------|
| **Input** | Blueprint YAML |
| **Owner** | Coordinator Agent (Gate Owner) |
| **Duration** | 10-30 seconds (automated), variable (human) |
| **State** | `blueprint_ready` → `blueprint_approved` or `blueprint_rejected` |

### Process
1. Coordinator Agent validates Blueprint against schema
2. Runs quality checks: completeness, consistency, feasibility
3. Checks for missing sections or undefined components
4. If automated review passes → approve
5. If issues found → send to rework (back to Step 5)
6. If human approval required → pause and notify

### Gate Criteria
- [ ] All 17 Blueprint sections present
- [ ] Design tokens complete (colors, typography, spacing)
- [ ] Component hierarchy valid (no orphaned components)
- [ ] Page routes defined
- [ ] Responsive breakpoints specified

### Memory Usage
- **Working Memory**: Validation rules, gate criteria
- **Project Memory**: Review result: `{approved: bool, issues: [], reviewer, timestamp}`

### Artifacts
- `review/blueprint-review.md` — Review summary with pass/fail status

### Dependencies
- Requires Step 5 complete
- Uses Coordinator Agent (Gate Owner)

---

## Step 7: Code Generation

| Field | Value |
|-------|-------|
| **Input** | Approved Blueprint |
| **Owner** | UI/UX Pro Max Agent, Frontend Architect Agent |
| **Duration** | 5-30 minutes (complexity dependent) |
| **State** | `blueprint_approved` → `code_generated` |

### Process
1. UI/UX Pro Max Agent reads Blueprint and generates component code
2. Frontend Architect Agent sets up project scaffolding
3. Parallel execution where possible:
   - Layout components (Header, Footer, Sidebar)
   - Page components (Home, About, Contact)
   - UI atoms (Button, Input, Badge, Card)
   - Utility functions (helpers, hooks)
4. Each component follows existing code conventions from Blueprint
5. Uses 21st.dev Component Agent for pre-built component integration
6. Uses Framer Motion Agent for animation specifications

### Memory Usage
- **Working Memory**: Code generation context, component registry
- **Project Memory**: File manifest: `{files[], components[], dependencies[]}`

### Artifacts
- `src/` — Complete Next.js source code
- `package.json` — Dependencies and scripts
- `tailwind.config.ts` — Tailwind configuration
- `tsconfig.json` — TypeScript configuration
- `next.config.ts` — Next.js configuration

### Dependencies
- Requires Step 6 complete
- Uses UI/UX Pro Max Agent, Frontend Architect, 21st.dev Component Agent, Framer Motion Agent

---

## Step 8: Component Quality Check

| Field | Value |
|-------|-------|
| **Input** | Generated source code |
| **Owner** | Reviewer Agent (Gate Owner) |
| **Duration** | 60-180 seconds |
| **State** | `code_generated` → `components_approved` or `components_rejected` |

### Process
1. Reviewer Agent inspects all generated components
2. Validates component structure follows Blueprint
3. Checks for accessibility (WCAG 2.1 AA compliance)
4. Validates TypeScript types
5. Checks for responsive design patterns
6. Validates animation implementations
7. If issues found → send to rework (back to Step 7)

### Gate Criteria
- [ ] All Blueprint components implemented
- [ ] TypeScript types complete (no `any` types)
- [ ] Accessibility attributes present
- [ ] Responsive breakpoints implemented
- [ ] Animations match Blueprint specifications
- [ ] No placeholder or TODO comments

### Memory Usage
- **Working Memory**: Review rules, quality criteria
- **Project Memory**: Review result: `{approved: bool, issues: [], components_reviewed: int}`

### Artifacts
- `review/component-review.md` — Component quality report

### Dependencies
- Requires Step 7 complete
- Uses Reviewer Agent (Gate Owner)

---

## Step 9: Build & Integration Test

| Field | Value |
|-------|-------|
| **Input** | Source code, review approval |
| **Owner** | Frontend Architect Agent, QA Engineer Agent |
| **Duration** | 2-10 minutes |
| **State** | `components_approved` → `build_passed` or `build_failed` |

### Process
1. Frontend Architect Agent runs `npm run build`
2. Catches compilation errors and type errors
3. Fixes build issues if any
4. QA Engineer Agent runs integration tests
5. Validates all routes render correctly
6. Checks responsive behavior at all breakpoints
7. Validates no runtime errors in console

### Memory Usage
- **Working Memory**: Build logs, test results
- **Project Memory**: Build status: `{success: bool, errors: [], warnings: [], test_results: {}}`

### Artifacts
- `build/build-log.txt` — Full build output
- `build/test-results.json` — Test execution results

### Dependencies
- Requires Step 8 complete
- Uses Frontend Architect Agent, QA Engineer Agent

---

## Step 10: Final Review & Polish

| Field | Value |
|-------|-------|
| **Input** | Built application, test results |
| **Owner** | Coordinator Agent (Gate Owner) |
| **Duration** | 60-300 seconds |
| **State** | `build_passed` → `final_approved` or `final_rejected` |

### Process
1. Coordinator Agent performs final quality gate
2. Runs comprehensive check:
   - All Blueprint sections implemented
   - All components render correctly
   - All responsive breakpoints work
   - All animations functional
   - No console errors or warnings
   - Build passes clean
3. Takes final screenshots and compares to reference
4. If visual diff > threshold → send to rework
5. If all checks pass → approve for deployment

### Gate Criteria
- [ ] Build passes clean (zero errors)
- [ ] All routes accessible
- [ ] Responsive behavior matches reference
- [ ] Animations functional
- [ ] No console errors
- [ ] Visual similarity score > 85%

### Memory Usage
- **Working Memory**: Quality rules, comparison algorithms
- **Project Memory**: Final review: `{approved: bool, similarity_score: float, issues: []}`

### Artifacts
- `review/final-review.md` — Final quality report
- `review/screenshot-comparison.png` — Side-by-side comparison

### Dependencies
- Requires Step 9 complete
- Uses Coordinator Agent (Gate Owner)

---

## Step 11: Deployment Preparation

| Field | Value |
|-------|-------|
| **Input** | Approved application |
| **Owner** | Deployment Agent, DevOps Engineer Agent |
| **Duration** | 30-120 seconds |
| **State** | `final_approved` → `deployment_ready` |

### Process
1. Deployment Agent prepares deployment artifacts
2. Configures environment variables
3. Sets up deployment scripts (Vercel/Docker/VPS)
4. Creates deployment manifest
5. Packages application for deployment
6. Returns deployment instructions to user

### Memory Usage
- **Working Memory**: Deployment configuration
- **Project Memory**: Deployment manifest: `{platform, env_vars[], build_command, start_command}`

### Artifacts
- `deployment/manifest.yaml` — Deployment configuration
- `deployment/Dockerfile` — Docker configuration (if applicable)
- `deployment/.env.example` — Environment variable template
- `deployment/README.md` — Deployment instructions

### Dependencies
- Requires Step 10 complete
- Uses Deployment Agent, DevOps Engineer Agent

---

## State Machine Summary

```
created → intake_complete → screenshots_captured → design_analyzed
→ components_extracted → blueprint_ready → blueprint_approved
→ code_generated → components_approved → build_passed
→ final_approved → deployment_ready
```

### Rework Paths
- Step 6 rejected → back to Step 5
- Step 8 rejected → back to Step 7
- Step 10 rejected → back to Step 7 or Step 8

### Parallel Execution Opportunities
- Steps 2-4 can run concurrently (screenshot, design analysis, component extraction)
- Step 7 can parallelize component generation across independent components
- Steps 9-10 can run concurrently (build test + visual review)

---

## Memory Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    WORKING MEMORY                        │
│  (Redis - volatile, ms access)                          │
│  - Current step context                                 │
│  - Browser session state                                │
│  - Analysis algorithms                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   PROJECT MEMORY                        │
│  (PostgreSQL - persistent)                              │
│  - Project metadata                                     │
│  - Step results and timestamps                          │
│  - Review outcomes                                      │
│  - Blueprint YAML                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  ARTIFACT LAYER                          │
│  (Local filesystem / S3)                                │
│  - Screenshots                                           │
│  - Design tokens                                        │
│  - Component registry                                   │
│  - Blueprint YAML                                       │
│  - Source code                                          │
│  - Build artifacts                                      │
│  - Deployment config                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Targets

| Step | Target Duration | Max Duration | Timeout Action |
|------|----------------|--------------|----------------|
| Step 1 | 5-15s | 30s | Reject URL |
| Step 2 | 30-120s | 180s | Retry 3x, escalate |
| Step 3 | 60-180s | 300s | Retry 2x, escalate |
| Step 4 | 60-180s | 300s | Retry 2x, escalate |
| Step 5 | 30-90s | 120s | Retry 2x, escalate |
| Step 6 | 10-30s | 60s | Auto-approve if valid |
| Step 7 | 5-30min | 60min | Timeout, rework |
| Step 8 | 60-180s | 300s | Timeout, rework |
| Step 9 | 2-10min | 20min | Timeout, rework |
| Step 10 | 60-300s | 600s | Timeout, rework |
| Step 11 | 30-120s | 180s | Timeout, manual |

---

## Error Recovery

### Automatic Recovery
- Network timeouts → exponential backoff retry (3 attempts)
- Build failures → automatic fix attempts (2 cycles)
- Test failures → automatic fix attempts (2 cycles)

### Manual Escalation
- 3 consecutive failures → escalate to Coordinator Agent
- Blueprint validation failure → escalate to PM Agent
- Deployment failure → escalate to DevOps Engineer Agent

### State Rollback
- Each step stores rollback information
- Coordinator Agent can roll back to previous step
- Full project rollback restores to `created` state
