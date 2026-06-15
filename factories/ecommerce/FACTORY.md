# Ecommerce Factory

## Overview
The Ecommerce Factory builds production-ready ecommerce applications with product catalogs, shopping carts, checkout flows, and payment integration.

## Trigger
- User requests an ecommerce website
- User says "build an online store" or "create an ecommerce site"
- User needs product catalog, cart, and checkout functionality

## Workflow
1. **Requirements Gathering** — PM Agent analyzes ecommerce requirements
2. **Market Research** — Market Research Agent analyzes competitors
3. **Design Specification** — UI/UX Pro Max Agent creates ecommerce design
4. **Blueprint Generation** — Blueprint Generator Agent creates Blueprint
5. **Blueprint Review** — Coordinator Agent validates Blueprint
6. **Product Schema Design** — Database Architect designs product schema
7. **Code Generation** — UI/UX Pro Max Agent generates components
8. **Payment Integration** — Backend Engineer integrates payment providers
9. **Build & Test** — Frontend Architect builds, QA Engineer tests
10. **Final Review** — Coordinator Agent performs final gate
11. **Deployment Preparation** — Deployment Agent prepares deployment

## Agents Used
- **Executive**: Coordinator (gate owner)
- **Product**: PM Agent, Product Strategist
- **Research**: Market Research, UX Research
- **Design**: UI/UX Pro Max, Design System, 21st.dev Component
- **Engineering**: Frontend Architect, Frontend Engineer, Backend Architect, Backend Engineer, Database Architect, API Architect
- **Quality**: Reviewer, QA Engineer, Security
- **Growth**: SEO Specialist, CRO
- **Operations**: DevOps Engineer, Deployment

## Inputs
- Product catalog requirements
- Payment provider preferences
- Shipping requirements
- Brand guidelines
- Design references

## Outputs
- Complete ecommerce application source code
- Product schema and database design
- Payment integration code
- Blueprint YAML
- Deployment configuration
- Documentation

## Artifacts
```
factories/ecommerce/
├── FACTORY.md (this file)
├── config.yaml (factory configuration)
├── schemas/ (product, order, cart schemas)
├── integrations/ (payment provider configs)
└── templates/ (factory-specific templates)
```

## Performance Targets
- Requirements to Blueprint: 15-30 minutes
- Blueprint to Code: 30-60 minutes
- Total project time: 2-4 hours

## Quality Gates
- Step 4: Blueprint validation
- Step 7: Code review
- Step 9: Build and integration test
- Step 10: Final review

## Error Handling
- Requirements ambiguity → PM Agent clarifies
- Blueprint validation failure → rework
- Payment integration issues → Backend Engineer troubleshoots
- Build failure → fix and retry
