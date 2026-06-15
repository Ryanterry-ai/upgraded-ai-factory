# Agent Factory

## Overview
The Agent Factory builds custom AI agents with specific capabilities, knowledge bases, and integration patterns.

## Trigger
- User requests a custom AI agent
- User says "build an AI agent" or "create a chatbot"
- User needs an agent with specific capabilities

## Workflow
1. **Requirements Gathering** — PM Agent analyzes agent requirements
2. **Capability Design** — Product Strategist designs agent capabilities
3. **Knowledge Base Design** — Research agents design knowledge base
4. **Architecture Design** — Backend Architect designs agent architecture
5. **Blueprint Generation** — Blueprint Generator Agent creates Blueprint
6. **Blueprint Review** — Coordinator Agent validates Blueprint
7. **Agent Core Implementation** — Backend Engineer implements agent core
8. **Knowledge Base Implementation** — Backend Engineer implements knowledge base
9. **Integration Implementation** — Backend Engineer implements integrations
10. **Build & Test** — Backend Architect builds, QA Engineer tests
11. **Final Review** — Coordinator Agent performs final gate
12. **Deployment Preparation** — Deployment Agent prepares deployment

## Agents Used
- **Executive**: Coordinator (gate owner)
- **Product**: PM Agent, Product Strategist
- **Research**: UX Research, Market Research
- **Design**: UI/UX Pro Max (for agent UI if needed)
- **Engineering**: Backend Architect, Backend Engineer, API Architect
- **Quality**: Reviewer, QA Engineer
- **Operations**: DevOps Engineer, Deployment

## Inputs
- Agent purpose and capabilities
- Knowledge base requirements
- Integration requirements (APIs, services)
- UI requirements (if applicable)
- Deployment requirements

## Outputs
- Complete AI agent application source code
- Knowledge base implementation
- Integration code
- Blueprint YAML
- Deployment configuration
- Documentation

## Artifacts
```
factories/agent/
├── FACTORY.md (this file)
├── config.yaml (factory configuration)
├── knowledge-base/ (knowledge base templates)
├── integrations/ (integration templates)
├── prompts/ (agent prompt templates)
└── templates/ (factory-specific templates)
```

## Performance Targets
- Requirements to Blueprint: 15-30 minutes
- Blueprint to Code: 30-60 minutes
- Total project time: 2-4 hours

## Quality Gates
- Step 5: Blueprint validation
- Step 8: Code review
- Step 10: Build and integration test
- Step 11: Final review

## Error Handling
- Requirements ambiguity → PM Agent clarifies
- Blueprint validation failure → rework
- Knowledge base issues → Backend Engineer troubleshoots
- Integration issues → Backend Engineer troubleshoots
- Build failure → fix and retry
