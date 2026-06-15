# Claude Code Factory

## Overview
The Claude Code Factory uses Claude Code (Anthropic's coding agent) to generate high-quality code from Blueprints with deep understanding of context and requirements.

## Trigger
- User requests code generation using Claude Code
- User says "use Claude Code to build this"
- Complex projects requiring deep code understanding

## Workflow
1. **Blueprint Preparation** — Blueprint Generator Agent finalizes Blueprint
2. **Blueprint Review** — Coordinator Agent validates Blueprint
3. **Claude Code Setup** — Frontend Architect configures Claude Code
4. **Code Generation** — Claude Code generates components
5. **Code Review** — Reviewer Agent validates generated code
6. **Refinement** — Frontend Engineer Agent refines output
7. **Build & Test** — Frontend Architect builds, QA Engineer tests
8. **Final Review** — Coordinator Agent performs final gate
9. **Deployment Preparation** — Deployment Agent prepares deployment

## Agents Used
- **Executive**: Coordinator (gate owner)
- **Design**: UI/UX Pro Max, Design System
- **Engineering**: Frontend Architect, Frontend Engineer
- **Quality**: Reviewer, QA Engineer
- **Operations**: Deployment

## Inputs
- Blueprint YAML (17-section specification)
- Design tokens
- Component registry
- Project requirements
- Code conventions

## Outputs
- Complete Next.js application source code
- Blueprint YAML
- Design specifications
- Deployment configuration
- Documentation

## Artifacts
```
factories/claude-code/
├── FACTORY.md (this file)
├── config.yaml (factory configuration)
├── prompts/ (Claude Code prompt templates)
└── templates/ (factory-specific templates)
```

## Performance Targets
- Blueprint to Code: 15-45 minutes
- Total project time: 45-90 minutes

## Quality Gates
- Step 2: Blueprint validation
- Step 5: Code review
- Step 8: Final review

## Error Handling
- Blueprint validation failure → rework
- Claude Code errors → retry with different prompts
- Code quality issues → review and refine
- Build failure → fix and retry
