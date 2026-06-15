# Clone Website Playbook

## Overview
Step-by-step playbook for cloning an existing website into a production-ready Next.js application.

## When to Use
- User provides a reference website URL
- User wants to recreate an existing design
- User needs a pixel-perfect clone

## Prerequisites
- Reference URL must be publicly accessible
- No authentication required to view
- Not a single-page application with heavy JS rendering

## Steps

### Step 1: URL Validation
**Agent**: Coordinator Agent
**Action**: Validate URL format and accessibility
**Output**: Validated URL or rejection with reason

### Step 2: Screenshot Capture
**Agent**: Screenshot Vision Agent
**Action**: Capture desktop, mobile, and section screenshots
**Output**: Screenshot files in `screenshots/` directory

### Step 3: Technical Analysis
**Agent**: Website Analyzer Agent
**Action**: Analyze technical architecture, performance, SEO
**Output**: Technical analysis report

### Step 4: Design Analysis
**Agent**: Design Reverse Engineer Agent
**Action**: Extract color palette, typography, spacing, layout
**Output**: `design-tokens.json` and design analysis report

### Step 5: Component Extraction
**Agent**: Component Extractor Agent
**Action**: Identify and classify all UI components
**Output**: `component-registry.json` and component hierarchy

### Step 6: Blueprint Generation
**Agent**: Blueprint Generator Agent
**Action**: Generate canonical 17-section Blueprint YAML
**Output**: `blueprint.yaml` and summary

### Step 7: Blueprint Review
**Agent**: Coordinator Agent (Gate)
**Action**: Validate Blueprint completeness and accuracy
**Output**: Approval or rework request

### Step 8: Project Scaffolding
**Agent**: Frontend Architect Agent
**Action**: Set up Next.js project structure
**Output**: Scaffolded project with configuration

### Step 9: Component Generation
**Agent**: UI/UX Pro Max Agent
**Action**: Generate React components from Blueprint
**Output**: Component source code

### Step 10: Code Review
**Agent**: Reviewer Agent (Gate)
**Action**: Review code quality and Blueprint compliance
**Output**: Approval or rework request

### Step 11: Build & Test
**Agent**: Frontend Architect + QA Engineer
**Action**: Build project and run tests
**Output**: Build success/failure, test results

### Step 12: Final Review
**Agent**: Coordinator Agent (Gate)
**Action**: Final quality gate and visual comparison
**Output**: Approval for deployment

### Step 13: Deployment
**Agent**: Deployment Agent
**Action**: Prepare deployment artifacts
**Output**: Deployment configuration and instructions

## Quality Checkpoints
- Step 7: Blueprint validation
- Step 10: Code review
- Step 12: Final review

## Estimated Time
- 30-60 minutes for simple websites
- 1-2 hours for complex websites
