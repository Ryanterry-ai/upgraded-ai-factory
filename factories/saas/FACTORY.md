# SaaS Factory

## Overview
The SaaS Factory builds production-ready SaaS applications with authentication, multi-tenancy, subscription billing, and admin dashboards.

## Trigger
- User requests a SaaS application
- User says "build a SaaS app" or "create a multi-tenant platform"
- User needs auth, billing, and admin functionality

## Workflow
1. **Requirements Gathering** — PM Agent analyzes SaaS requirements
2. **Market Research** — Market Research Agent analyzes competitors
3. **Architecture Design** — Backend Architect designs multi-tenant architecture
4. **Design Specification** — UI/UX Pro Max Agent creates SaaS design
5. **Blueprint Generation** — Blueprint Generator Agent creates Blueprint
6. **Blueprint Review** — Coordinator Agent validates Blueprint
7. **Auth & Billing Setup** — Backend Engineer integrates auth and billing
8. **Code Generation** — UI/UX Pro Max Agent generates components
9. **Admin Dashboard** — Frontend Engineer builds admin panel
10. **Build & Test** — Frontend Architect builds, QA Engineer tests
11. **Final Review** — Coordinator Agent performs final gate
12. **Deployment Preparation** — Deployment Agent prepares deployment

## Agents Used
- **Executive**: Coordinator (gate owner)
- **Product**: PM Agent, Product Strategist
- **Research**: Market Research, UX Research
- **Design**: UI/UX Pro Max, Design System, 21st.dev Component, Framer Motion
- **Engineering**: Full engineering team
- **Quality**: Full quality team
- **Growth**: SEO Specialist, CRO, Analytics
- **Operations**: DevOps Engineer, Deployment

## Inputs
- SaaS product requirements
- Authentication provider preferences
- Billing provider preferences
- Multi-tenancy requirements
- Admin dashboard requirements
- Brand guidelines

## Outputs
- Complete SaaS application source code
- Authentication and authorization system
- Subscription billing integration
- Admin dashboard
- Blueprint YAML
- Deployment configuration
- Documentation

## Artifacts
```
factories/saas/
├── FACTORY.md (this file)
├── config.yaml (factory configuration)
├── auth/ (authentication templates)
├── billing/ (billing integration templates)
├── admin/ (admin dashboard templates)
└── templates/ (factory-specific templates)
```

## Performance Targets
- Requirements to Blueprint: 20-40 minutes
- Blueprint to Code: 45-90 minutes
- Total project time: 3-6 hours

## Quality Gates
- Step 5: Blueprint validation
- Step 8: Code review
- Step 10: Build and integration test
- Step 11: Final review

## Error Handling
- Requirements ambiguity → PM Agent clarifies
- Blueprint validation failure → rework
- Auth integration issues → Backend Engineer troubleshoots
- Billing integration issues → Backend Engineer troubleshoots
- Build failure → fix and retry
