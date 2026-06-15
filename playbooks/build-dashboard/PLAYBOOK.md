# Build Dashboard Playbook

## Overview
Step-by-step playbook for building a production-ready analytics dashboard with charts, metrics, and data visualization.

## When to Use
- User needs an analytics dashboard
- User requires charts and data visualization
- User needs real-time metrics display

## Prerequisites
- Data sources and APIs
- Metrics requirements
- Chart types and visualizations
- Brand guidelines

## Steps

### Step 1: Requirements Gathering
**Agent**: PM Agent
**Action**: Analyze dashboard requirements
**Output**: Requirements document

### Step 2: Data Source Analysis
**Agent**: Analytics Agent
**Action**: Analyze data sources and metrics
**Output**: Data source documentation

### Step 3: Design Specification
**Agent**: UI/UX Pro Max Agent
**Action**: Create dashboard UI design specification
**Output**: Design tokens and component specs

### Step 4: Blueprint Generation
**Agent**: Blueprint Generator Agent
**Action**: Generate dashboard Blueprint
**Output**: `blueprint.yaml`

### Step 5: Blueprint Review
**Agent**: Coordinator Agent (Gate)
**Action**: Validate Blueprint completeness
**Output**: Approval or rework request

### Step 6: Chart Components
**Agent**: Frontend Engineer Agent
**Action**: Build chart and visualization components
**Output**: Chart components (using Recharts, Chart.js, etc.)

### Step 7: Metric Cards
**Agent**: Frontend Engineer Agent
**Action**: Build metric display components
**Output**: Metric card components

### Step 8: Dashboard Layout
**Agent**: UI/UX Pro Max Agent
**Action**: Generate dashboard layout
**Output**: Dashboard grid and layout

### Step 9: Data Integration
**Agent**: Backend Engineer Agent
**Action**: Implement data fetching and updates
**Output**: API integration and real-time updates

### Step 10: Build & Test
**Agent**: Frontend Architect + QA Engineer
**Action**: Build and test dashboard
**Output**: Build success, test results

### Step 11: Final Review
**Agent**: Coordinator Agent (Gate)
**Action**: Final quality gate
**Output**: Approval for deployment

### Step 12: Deployment
**Agent**: Deployment Agent
**Action**: Prepare deployment
**Output**: Deployment configuration

## Quality Checkpoints
- Step 5: Blueprint validation
- Step 10: Build and test
- Step 11: Final review

## Estimated Time
- 2-4 hours for standard dashboard
- 4-8 hours for complex dashboard
