# Upgraded AI Factory

A unified AI Software Factory operating system with specialized agents, product factories, and intelligent workflows for automated software development.

## Architecture

### Phase 0: AI Operating System
- **CLAUDE.md**: Master operating system (Vision, Mission, Standards, Quality Gates)
- **AGENTS.md**: Organizational hierarchy (9 departments, 32 agents)

### Phase 1: Agent Organization
- 32 specialized agents across 9 departments
- Unified SKILL.md format for all agents
- Clear responsibilities, inputs, outputs, and collaboration rules

### Phase 2: Product Factory Layer
- 6 product factories (Same.dev, Readdy, Claude Code, Ecommerce, SaaS, Agent)
- 6 playbooks (Clone Website, Build SaaS, Build Ecommerce, Build Agent, Build Admin Panel, Build Dashboard)
- Website Intelligence Department (5 agents for website analysis)

### Phase 3: Execution Architecture
- Runtime Architecture (API Gateway, Factory Router, Workflow Engine, Agent Runtime, Memory Layer, Artifact Layer, State Store)
- Workflow Engine (sequential, parallel, conditional routing, approval gates, retry logic)
- State Management (7 state types with lifecycles)
- Memory Architecture (4 layers: Working, Project, Knowledge, Agent)
- Storage Architecture (PostgreSQL, Redis, pgvector)
- Vector Memory Architecture (RAG with OpenAI embeddings)
- Orchestration Architecture (Custom Workflow Engine + n8n integrations)

## Directory Structure

```
upgraded-ai-factory/
├── CLAUDE.md                    # Master operating system
├── AGENTS.md                    # Organizational hierarchy
├── .agents/
│   └── agents/
│       ├── executive/           # CEO, Coordinator
│       ├── product/             # PM, Strategist, Competitive Research
│       ├── research/            # UX Research, Market Research
│       ├── design/              # UI/UX Pro Max, Design System, 21st.dev, Framer Motion
│       ├── engineering/         # Frontend/Backend Architect/Engineer, Database, API
│       ├── quality/             # QA, Reviewer, Security, Performance
│       ├── growth/              # SEO, CRO, Content, Analytics
│       ├── operations/          # DevOps, Deployment
│       └── website-intelligence/ # Website Analyzer, Screenshot Vision, etc.
├── factories/
│   ├── same-dev/                # Website clone factory
│   ├── readdy/                  # Readdy-powered factory
│   ├── claude-code/             # Claude Code factory
│   ├── ecommerce/               # Ecommerce factory
│   ├── saas/                    # SaaS factory
│   └── agent/                   # AI agent factory
├── playbooks/
│   ├── clone-website/           # Clone website playbook
│   ├── build-saas/              # Build SaaS playbook
│   ├── build-ecommerce/         # Build ecommerce playbook
│   ├── build-agent/             # Build AI agent playbook
│   ├── build-admin-panel/       # Build admin panel playbook
│   └── build-dashboard/         # Build dashboard playbook
├── docs/
│   └── architecture/            # Architecture documentation
│       ├── 08-samedev-runtime.md
│       ├── 09-artifact-architecture.md
│       └── 10-future-compatibility.md
├── _shared/                     # Shared conventions
├── rules/                       # Review rules
├── hooks/                       # Git hooks
├── config/                      # Factory configuration
├── templates/                   # Blueprint, component, deployment templates
└── workflows/                   # Workflow definitions
```

## Getting Started

1. Review `CLAUDE.md` for operating system overview
2. Review `AGENTS.md` for agent organization
3. Choose a factory based on your project type
4. Follow the corresponding playbook

## Factories

| Factory | Use Case | Time Estimate |
|---------|----------|---------------|
| **Same.dev** | Clone existing website | 30-60 minutes |
| **Readdy** | Build from text description | 30-60 minutes |
| **Claude Code** | Complex code generation | 45-90 minutes |
| **Ecommerce** | Online store | 2-4 hours |
| **SaaS** | Multi-tenant application | 3-6 hours |
| **Agent** | Custom AI agent | 2-4 hours |

## Playbooks

| Playbook | Description |
|----------|-------------|
| **Clone Website** | Step-by-step website cloning |
| **Build SaaS** | SaaS application development |
| **Build Ecommerce** | Ecommerce store creation |
| **Build Agent** | AI agent development |
| **Build Admin Panel** | Admin dashboard creation |
| **Build Dashboard** | Analytics dashboard creation |

## Contributing

This is a specification-only repository. Implementation code is not included. All architecture and design decisions are documented for future implementation.
