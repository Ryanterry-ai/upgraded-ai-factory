# Build Admin Panel Playbook

## Overview
Step-by-step playbook for building a production-ready admin dashboard with user management, data tables, and CRUD operations.

## When to Use
- User needs an admin dashboard
- User requires user management
- User needs data tables and CRUD operations

## Prerequisites
- Admin functionality requirements
- Data models and schemas
- Authentication requirements
- Brand guidelines

## Steps

### Step 1: Requirements Gathering
**Agent**: PM Agent
**Action**: Analyze admin panel requirements
**Output**: Requirements document

### Step 2: Data Model Design
**Agent**: Database Architect Agent
**Action**: Design admin data models
**Output**: Prisma schema for admin

### Step 3: Design Specification
**Agent**: UI/UX Pro Max Agent
**Action**: Create admin UI design specification
**Output**: Design tokens and component specs

### Step 4: Blueprint Generation
**Agent**: Blueprint Generator Agent
**Action**: Generate admin Blueprint
**Output**: `blueprint.yaml`

### Step 5: Blueprint Review
**Agent**: Coordinator Agent (Gate)
**Action**: Validate Blueprint completeness
**Output**: Approval or rework request

### Step 6: Auth & Permissions
**Agent**: Backend Engineer Agent
**Action**: Implement admin authentication and roles
**Output**: Auth system with admin roles

### Step 7: Data Tables
**Agent**: Frontend Engineer Agent
**Action**: Build reusable data table components
**Output**: Data table components

### Step 8: CRUD Operations
**Agent**: Frontend Engineer Agent
**Action**: Build CRUD forms and modals
**Output**: CRUD components

### Step 9: Dashboard Layout
**Agent**: UI/UX Pro Max Agent
**Action**: Generate admin dashboard layout
**Output**: Dashboard components

### Step 10: Build & Test
**Agent**: Frontend Architect + QA Engineer
**Action**: Build and test admin panel
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
- 2-4 hours for standard admin
- 4-8 hours for complex admin
