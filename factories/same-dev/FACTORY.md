# Same.dev Factory

## Overview
The Same.dev Factory transforms reference website URLs into production-ready Next.js applications through automated analysis, blueprint generation, and code generation.

## Trigger
- User provides a website URL and requests a clone
- User says "clone this website" or "build this site"
- User provides a reference URL in a project request

## Workflow
1. **URL Intake & Validation** — Coordinator Agent validates URL
2. **Screenshot Capture** — Screenshot Vision Agent captures visual reference
3. **Design Analysis** — Design Reverse Engineer Agent extracts design system
4. **Component Extraction** — Component Extractor Agent identifies UI components
5. **Blueprint Generation** — Blueprint Generator Agent creates canonical Blueprint
6. **Blueprint Review** — Coordinator Agent validates Blueprint
7. **Code Generation** — UI/UX Pro Max Agent generates components
8. **Component Quality Check** — Reviewer Agent validates code
9. **Build & Integration Test** — Frontend Architect builds, QA Engineer tests
10. **Final Review & Polish** — Coordinator Agent performs final gate
11. **Deployment Preparation** — Deployment Agent prepares for deployment

## Agents Used
- **Website Intelligence**: Website Analyzer, Screenshot Vision, Design Reverse Engineer, Component Extractor, Blueprint Generator
- **Executive**: Coordinator (gate owner)
- **Design**: UI/UX Pro Max, Design System, 21st.dev Component, Framer Motion
- **Engineering**: Frontend Architect, Frontend Engineer
- **Quality**: Reviewer, QA Engineer
- **Operations**: DevOps Engineer, Deployment

## Inputs
- Reference URL (must be publicly accessible)
- Optional: specific requirements, constraints, or modifications

## Outputs
- Complete Next.js application source code
- Blueprint YAML (design specification)
- Design tokens (colors, typography, spacing)
- Component registry (component inventory)
- Deployment configuration
- Documentation

## Artifacts
```
factories/same-dev/
├── FACTORY.md (this file)
├── config.yaml (factory configuration)
└── templates/ (factory-specific templates)
```

## Performance Targets
- URL to Blueprint: 5-10 minutes
- Blueprint to Code: 10-30 minutes
- Total project time: 30-60 minutes

## Quality Gates
- Step 6: Blueprint validation (schema, completeness)
- Step 8: Code review (quality, accessibility)
- Step 10: Final review (build, visual similarity)

## Error Handling
- Invalid URL → reject with validation error
- Website unreachable → retry 3x, escalate
- Blueprint validation failure → rework (Step 5)
- Code review failure → rework (Step 7)
- Build failure → fix and retry (Step 9)
