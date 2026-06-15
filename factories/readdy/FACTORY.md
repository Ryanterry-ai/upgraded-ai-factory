# Readdy Factory

## Overview
The Readdy Factory builds production-ready Next.js applications from text descriptions using Readdy's AI-powered code generation capabilities.

## Trigger
- User provides a text description of a website or app
- User says "build this app" or "create this website"
- User describes features and requirements in natural language

## Workflow
1. **Description Analysis** — PM Agent analyzes requirements
2. **Research & Planning** — Research agents gather context
3. **Design Specification** — UI/UX Pro Max Agent creates design spec
4. **Blueprint Generation** — Blueprint Generator Agent creates Blueprint
5. **Blueprint Review** — Coordinator Agent validates Blueprint
6. **Readdy Code Generation** — Frontend Architect uses Readdy CLI
7. **Code Review** — Reviewer Agent validates generated code
8. **Customization** — Frontend Engineer Agent customizes output
9. **Build & Test** — Frontend Architect builds, QA Engineer tests
10. **Final Review** — Coordinator Agent performs final gate
11. **Deployment Preparation** — Deployment Agent prepares deployment

## Agents Used
- **Executive**: Coordinator (gate owner)
- **Product**: PM Agent, Product Strategist
- **Research**: UX Research, Market Research
- **Design**: UI/UX Pro Max, Design System
- **Engineering**: Frontend Architect, Frontend Engineer
- **Quality**: Reviewer, QA Engineer
- **Operations**: Deployment

## Inputs
- Text description of desired application
- Optional: design references, competitor examples
- Optional: specific requirements, constraints

## Outputs
- Complete Next.js application source code
- Blueprint YAML
- Design specifications
- Deployment configuration
- Documentation

## Artifacts
```
factories/readdy/
├── FACTORY.md (this file)
├── config.yaml (factory configuration)
└── templates/ (factory-specific templates)
```

## Performance Targets
- Description to Blueprint: 5-15 minutes
- Blueprint to Code: 10-20 minutes
- Total project time: 30-60 minutes

## Quality Gates
- Step 5: Blueprint validation
- Step 7: Code review
- Step 10: Final review

## Error Handling
- Ambiguous description → PM Agent clarifies with user
- Blueprint validation failure → rework
- Code generation failure → retry with different approach
- Build failure → fix and retry
