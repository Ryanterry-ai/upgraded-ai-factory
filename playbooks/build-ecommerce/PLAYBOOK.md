# Build Ecommerce Playbook

## Overview
Step-by-step playbook for building a production-ready ecommerce application with product catalog, cart, checkout, and payment integration.

## When to Use
- User needs an online store
- User requires product catalog and shopping cart
- User needs payment processing

## Prerequisites
- Product catalog structure
- Payment provider choice (Stripe, PayPal, etc.)
- Shipping requirements
- Brand guidelines or design references

## Steps

### Step 1: Requirements Gathering
**Agent**: PM Agent
**Action**: Analyze ecommerce requirements
**Output**: Product requirements document

### Step 2: Market Research
**Agent**: Market Research Agent
**Action**: Analyze competitor ecommerce sites
**Output**: Competitive analysis report

### Step 3: Product Schema Design
**Agent**: Database Architect Agent
**Action**: Design product, category, order schemas
**Output**: Prisma schema for ecommerce

### Step 4: Design Specification
**Agent**: UI/UX Pro Max Agent
**Action**: Create ecommerce UI design specification
**Output**: Design tokens and component specs

### Step 5: Blueprint Generation
**Agent**: Blueprint Generator Agent
**Action**: Generate comprehensive Blueprint
**Output**: `blueprint.yaml` with all 17 sections

### Step 6: Blueprint Review
**Agent**: Coordinator Agent (Gate)
**Action**: Validate Blueprint completeness
**Output**: Approval or rework request

### Step 7: Product Catalog UI
**Agent**: UI/UX Pro Max Agent
**Action**: Generate product listing and detail pages
**Output**: Product catalog components

### Step 8: Shopping Cart
**Agent**: Frontend Engineer Agent
**Action**: Implement shopping cart functionality
**Output**: Cart components and logic

### Step 9: Checkout Flow
**Agent**: Frontend Engineer Agent
**Action**: Implement checkout process
**Output**: Checkout components

### Step 10: Payment Integration
**Agent**: Backend Engineer Agent
**Action**: Integrate payment provider
**Output**: Payment processing code

### Step 11: Order Management
**Agent**: Backend Engineer Agent
**Action**: Implement order processing
**Output**: Order management system

### Step 12: Build & Test
**Agent**: Frontend Architect + QA Engineer
**Action**: Build and test complete application
**Output**: Build success, test results

### Step 13: Security Review
**Agent**: Security Agent (Gate)
**Action**: Review payment and data security
**Output**: Security assessment

### Step 14: Final Review
**Agent**: Coordinator Agent (Gate)
**Action**: Final quality gate
**Output**: Approval for deployment

### Step 15: Deployment
**Agent**: Deployment Agent
**Action**: Prepare deployment with environment config
**Output**: Deployment configuration

## Quality Checkpoints
- Step 6: Blueprint validation
- Step 12: Build and test
- Step 13: Security review
- Step 14: Final review

## Estimated Time
- 2-4 hours for simple store
- 4-8 hours for complex store
