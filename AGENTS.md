# Upgraded AI Factory — Agent Organization

## Executive Department
| Agent | Role |
|-------|------|
| CEO Agent | Strategic oversight, task routing, final approvals |
| Coordinator Agent | Workflow orchestration, parallel execution, progress tracking |

## Product Department
| Agent | Role |
|-------|------|
| Product Manager Agent | Requirements, prioritization, roadmap, PRDs |
| Product Strategist Agent | Vision, market positioning, go-to-market, monetization |
| Competitive Research Agent | Competitor analysis, market intelligence, battlecards |

## Research Department
| Agent | Role |
|-------|------|
| UX Research Agent | User interviews, usability testing, personas, journey maps |
| Market Research Agent | Market sizing, trend analysis, customer segmentation |

## Design Department
| Agent | Role |
|-------|------|
| UI/UX Pro Max Agent | Wireframes, prototypes, user flows, visual design, UX optimization |
| Design System Agent | Tokens, components, patterns, accessibility standards |
| 21st.dev Component Agent | Component discovery, shadcn patterns, section composition |
| Framer Motion Agent | Animations, micro-interactions, scroll effects, transitions |

## Engineering Department
| Agent | Role |
|-------|------|
| Frontend Architect Agent | Frontend architecture, tech selection, patterns |
| Frontend Engineer Agent | Component implementation, UI logic, styling |
| Backend Architect Agent | Backend architecture, system design, API contracts |
| Backend Engineer Agent | Service implementation, business logic, data access |
| Database Architect Agent | Schema design, migrations, indexing, optimization |
| API Architect Agent | API design, versioning, documentation, standards |

## Quality Department
| Agent | Role |
|-------|------|
| QA Engineer Agent | Test strategy, test creation, quality assurance |
| Reviewer Agent | Code review, architecture review, standards enforcement |
| Security Agent | Security audits, vulnerability assessment, OWASP compliance |
| Performance Agent | Profiling, optimization, benchmarking, Core Web Vitals |

## Growth Department
| Agent | Role |
|-------|------|
| SEO Specialist Agent | Technical SEO, keyword strategy, structured data, AI SEO |
| CRO Agent | Conversion optimization, A/B testing, funnel analysis |
| Content Strategist Agent | Content planning, editorial calendar, brand voice |
| Analytics Agent | Tracking implementation, dashboards, data analysis |

## Operations Department
| Agent | Role |
|-------|------|
| DevOps Engineer Agent | CI/CD, infrastructure, monitoring, reliability |
| Deployment Agent | Release management, rollback, environment config |

## Website Intelligence Department
| Agent | Role |
|-------|------|
| Website Analyzer Agent | Crawl site structure, extract content inventory |
| Screenshot Vision Agent | Extract visual design from screenshots |
| Design Reverse Engineer Agent | Synthesize design system from visual analysis |
| Component Extractor Agent | Decompose pages into component hierarchy |
| Blueprint Generator Agent | Assemble canonical blueprint from all intelligence |

## Routing Matrix
| Task Type -> Agent | Simple | Moderate | Complex | Critical |
|-------------------|--------|----------|---------|----------|
| Feature | Engineer -> Reviewer | Architect -> Engineer -> Reviewer -> QA | Full pipeline | Full pipeline + security + perf |
| Bugfix | Engineer -> Reviewer | Engineer -> Reviewer -> QA | Architect -> Engineer -> Reviewer -> QA | Full pipeline |
| Redesign | Designer -> Engineer | Research -> Designer -> Motion -> Engineer -> QA | Full design + eng pipeline | Full pipeline + security + SEO |
| Security | Security -> Engineer | Security -> Engineer -> Security | Full security pipeline | Full pipeline + CEO review |
| Performance | Perf Agent -> Engineer | Perf -> Engineer -> Perf -> QA | Full perf pipeline | Full pipeline + CEO review |
| SEO | SEO -> Engineer | SEO -> Frontend -> SEO -> QA | Full SEO pipeline | Full pipeline + content |
| CRO | CRO -> Designer | CRO -> Designer -> Engineer -> CRO | Full CRO pipeline | Full pipeline + analytics |
