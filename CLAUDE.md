# Upgraded AI Factory — Operating System

## Vision
To be the most capable AI-powered software factory, capable of building any digital product from idea to deployment through coordinated specialist agents.

## Mission
Deliver production-grade software through specialized AI agents working in coordinated departments, governed by quality gates and unified workflows.

## Product Capabilities
This factory can build:
- Mini Same.dev (collaborative AI workspace)
- Mini Readdy (AI website builder)
- Mini Claude Code (AI coding assistant)
- AI Website Factory (automated website generation)
- AI Ecommerce Factory (automated store creation)
- AI SaaS Factory (automated SaaS product creation)
- AI Agent Factory (automated agent creation)

## Engineering Standards

### Code Quality
- All code must pass linting, type checking, and formatting before review
- TypeScript strict mode for all new projects
- ESLint + Prettier enforced
- No `any` types in TypeScript

### Architecture Principles
- Separation of Concerns: each module has single responsibility
- Interface-First: define interfaces before implementation
- 12-Factor App methodology for services
- Clean Architecture: Router -> Service -> Repository -> Models (backend)
- Feature-Sliced Design (FSD-lite) for frontend

### Version Control
- Conventional Commits enforced (feat:, fix:, chore:, docs:, etc.)
- Branch naming: feature/, bugfix/, hotfix/, release/
- No `git add -A` without explicit permission
- Never stage or commit secrets

### Testing
- Minimum 80% code coverage for new features
- Unit tests for all business logic
- Integration tests for API contracts
- E2E tests for critical user flows
- Test files co-located with source

## Documentation Standards

### Code Documentation
- All public APIs documented with JSDoc/TSDoc
- All functions include parameter descriptions and return types
- Complex algorithms include inline comments explaining logic
- README updated for any architecture changes
- Changelog maintained for user-facing changes (Keep a Changelog format)

### Architecture Documentation
- Decision records (ADRs) for all significant technical choices
- ADR format: Title, Status, Context, Decision, Consequences
- Architecture diagrams maintained in docs/architecture/
- System context diagrams updated when services change

### API Documentation
- OpenAPI/Swagger spec for all REST APIs
- GraphQL schema documentation with descriptions
- Example requests/responses for every endpoint
- Error response documentation with codes and messages

### Agent Documentation
- Every agent has a SKILL.md following the unified format
- Agent capabilities and limitations documented
- Handoff protocols documented between agents
- Escalation paths documented and current

### User-Facing Documentation
- Getting started guide for every product
- Feature documentation with screenshots
- Troubleshooting guides for common issues
- FAQ sections maintained and updated

### Documentation Quality Rules
- All docs use clear, concise language
- No undocumented features shipped
- Documentation reviewed as part of code review
- Broken links checked monthly
- Screenshots updated with UI changes
- Version-specific documentation maintained

## UX Standards
- WCAG 2.1 AA compliance required
- Mobile-first responsive design
- Consistent 8pt grid spacing system
- Design tokens for all colors, typography, spacing
- Dark mode support required
- prefers-reduced-motion respected
- Focus management and keyboard navigation
- Screen reader compatibility

## Motion Standards
- Spring physics preferred over tweens
- Duration: 0.1-0.2s micro-interactions, 0.2-0.3s state changes, 0.3-0.5s entrances
- Always use transforms/opacity for 60fps performance
- Stagger children at 0.05-0.15s intervals
- viewport={{ once: true }} for scroll animations
- Respect prefers-reduced-motion
- Every animation must communicate meaning
- Entrance + exit animations required for unmounting components

## SEO Standards
- Core Web Vitals targets: LCP <2.5s, INP <200ms, CLS <0.1
- Semantic HTML5 elements required
- JSON-LD structured data on all applicable pages
- XML sitemap auto-generated
- robots.txt configured per environment
- Meta descriptions 150-160 chars, title tags 50-60 chars
- Single H1 per page, proper heading hierarchy
- Image optimization (WebP/AVIF, lazy loading, alt text)
- Internal linking with hub-and-spoke model
- AI SEO: extractable answer blocks, comparison tables, FAQ sections

## Agent Standards
- All agents follow the unified SKILL.md format
- Agents load context from project context files before asking questions
- Agents produce structured deliverables per their specification
- Agents escalate blockers immediately
- Agents follow the handoff protocol for inter-agent communication
- Agents respect quality gates — no skipping

## Quality Gates

### Gate 1: Design Review
- Owner: Frontend Architect or Backend Architect
- Criteria: Architecture doc approved, tech stack selected, patterns defined
- On fail: Rework design with specific feedback

### Gate 2: Code Review
- Owner: Reviewer Agent
- Criteria: All blockers resolved, follows coding standards, no security issues
- On fail: Structured feedback (blocker/major/minor/suggestion), rework required

### Gate 3: QA Gate
- Owner: QA Engineer
- Criteria: All tests pass, coverage met, no critical bugs
- On fail: Fix failures, re-run tests

### Gate 4: Security Gate
- Owner: Security Agent
- Criteria: No critical/high vulnerabilities, OWASP compliance
- On fail: Fix vulnerabilities, re-scan

### Gate 5: Performance Gate
- Owner: Performance Agent
- Criteria: Core Web Vitals targets met, bundle size within budget
- On fail: Optimize, re-benchmark

### Gate 6: SEO Gate
- Owner: SEO Specialist
- Criteria: Technical SEO audit passes, structured data validated
- On fail: Fix issues, re-audit

### Gate 7: Review Gate
- Owner: CEO Agent (final review)
- Criteria: All previous gates passed, stakeholder approval
- On fail: Route back to appropriate department

### Gate 8: Deployment Gate
- Owner: Deployment Agent
- Criteria: Deployment checklist complete, rollback plan documented
- On fail: Fix deployment issues, re-check

## Review Requirements
- All code changes require reviewer approval
- Architecture decisions require architect approval
- Design changes require designer approval
- Security changes require security engineer approval
- All reviews use structured feedback format:
  - Blockers: must fix before merge
  - Major: should fix before merge
  - Minor: fix when convenient
  - Suggestions: optional improvements

## Task Routing Rules

### By Type
| Type | Routing Path |
|------|-------------|
| Feature | CEO -> Product Manager -> Architect -> Engineer -> QA -> SEO -> Deploy |
| Bugfix | QA -> Engineer -> Reviewer -> QA -> Deploy |
| Redesign | CEO -> Product Manager -> UX Researcher -> Designer -> Motion Designer -> Engineer -> QA -> Deploy |
| Security | Security Agent -> Engineer -> Security Agent -> Deploy |
| Performance | Performance Agent -> Engineer -> Performance Agent -> Deploy |
| SEO | SEO Specialist -> Frontend Engineer -> SEO Specialist -> Deploy |
| CRO | CRO Agent -> Designer -> Frontend Engineer -> CRO Agent -> Deploy |

### By Complexity
| Complexity | Pipeline |
|-----------|----------|
| Simple | Engineer -> Reviewer -> Deploy |
| Moderate | Architect -> Engineer -> Reviewer -> QA -> Deploy |
| Complex | Full pipeline with all gates |
| Critical | Full pipeline + security + performance + CEO final review |

## Workflow States
CREATED -> ASSIGNED -> IN_PROGRESS -> REVIEW -> APPROVED -> TESTING -> PASSED -> DEPLOYING -> DEPLOYED
                    | REJECTED -> IN_PROGRESS (rework, max 3 cycles)
                    | FAILED -> IN_PROGRESS (retry with feedback)

## Handoff Protocol
Every agent-to-agent handoff includes:
1. Context: What was done and why
2. Artifacts: Deliverables produced (with file paths)
3. Requirements: What the next agent needs to do
4. Constraints: Limitations, deadlines, dependencies
5. Acceptance Criteria: How the next agent knows they're done
6. Timeline: Expected completion

## Communication Patterns
- Top-down: CEO -> Department Head -> Individual Agent
- Bottom-up: Agent -> Department Head -> CEO (escalations)
- Peer-to-peer: Within same department (collaboration)
- Cross-department: Through department heads (coordination)

## Error Recovery
- Max 3 rework cycles per gate before escalation
- Retry with backoff for transient failures
- Fallback chain: Primary Agent -> Secondary Agent -> Coordinator -> Human
- Compensation (rollback) for deployment failures
- Regression detection: track PASS->FAIL transitions

## Factory Targets
- Page load time < 3 seconds
- Lighthouse score > 90
- Core Web Vitals in "Good" range
- Test coverage > 80%
- Zero critical security vulnerabilities
- Organic traffic growth > 20% QoQ (for content projects)
- Conversion rate improvement > 15% QoQ (for CRO projects)
