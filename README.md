# Upgraded AI Factory Studio v0.2.0

A multi-factory AI platform with **Requirement Understanding Engine** that normalizes any input (any language, natural language, business goals, feature lists, URLs, screenshots, PDFs, codebases, or combinations) into a canonical requirements schema before routing to the best factory.

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Smart routing (auto-detects best factory)
studio route "Ecommerce store for handmade candles with cart"

# Generate from any input
studio generate "Modern SaaS landing page"
studio generate "https://example.com"
studio generate "Dashboard analitik dengan grafik penjualan"

# List all factories
studio list

# Run audit
studio audit website --count 10
studio audit:all
```

## Architecture

```
User Input (any language, URL, screenshot, PDF, codebase)
    ↓
Requirement Understanding Engine
    ↓
Canonical Requirements Schema
    ↓
Factory Router
    ↓
Selected Factory (website | ecommerce | saas | admin | dashboard | agent | tools)
    ↓
Blueprint Generation
    ↓
Next.js Source Code
```

## Requirement Understanding Engine

The engine normalizes **all input types** into a canonical requirements schema:

| Input Type | Examples |
|------------|----------|
| **Natural Language** | "Build a todo app with auth and dark mode" |
| **Any Language** | "Ecommerce store para velas artesanales" (Spanish) |
| **Business Goals** | "Increase conversion rate by 20% with better UX" |
| **Feature Lists** | "User registration, search, notifications, dashboard" |
| **URLs** | "https://stripe.com" |
| **Screenshots** | ./design.png |
| **PDFs** | ./requirements.pdf |
| **Codebases** | ./existing-project/ |
| **Combinations** | URL + "Add dark mode and analytics" |

### Canonical Schema

```typescript
interface CanonicalRequirements {
  inputType: 'prompt' | 'url' | 'screenshot' | 'pdf' | 'codebase' | 'figma';
  inputLanguage: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | ...;
  projectName: string;
  projectType: 'website' | 'ecommerce' | 'saas' | 'admin' | 'dashboard' | 'agent' | 'tools';
  features: ExtractedFeature[];
  entities: ExtractedEntity[];
  complexity: 'simple' | 'moderate' | 'complex';
  industry: string;
  targetAudience: string;
  uiRequirements: UIRequirement;
  dataRequirements: DataRequirement;
  techStack: string[];
  confidence: number;
  ambiguities: string[];
  suggestions: string[];
}
```

## Supported Inputs

| Input | Description |
|-------|-------------|
| **Prompt** | Text description in any language |
| **URL** | Website URL to analyze/clone |
| **Screenshot** | Screenshot image path |
| **Figma** | Figma design URL |
| **PDF** | PDF document path |
| **Codebase** | Existing codebase path |

## Supported Factories

| Factory | Type | Description |
|---------|------|-------------|
| **Website** | `website` | Marketing sites, landing pages, blogs, portfolios |
| **Ecommerce** | `ecommerce` | Online stores with products, cart, checkout |
| **SaaS** | `saas` | SaaS apps with auth, billing, multi-tenancy |
| **Admin Panel** | `admin` | Admin dashboards with CRUD and data tables |
| **Dashboard** | `dashboard` | Analytics dashboards with charts and metrics |
| **AI Agent** | `agent` | AI chatbots with chat UI and knowledge base |
| **Internal Tools** | `tools` | Internal tools, form builders, data viewers |

## CLI Commands

```bash
# Route input to best factory (shows routing decision)
studio route <text>

# Generate project
studio generate <prompt|url|path>

# Audit a factory
studio audit <factory> --count <n>

# Audit all factories
studio audit:all

# List factories
studio list

# Show help
studio help
```

## CLI Options

```
--factory, -F <type>         Force specific factory type
--output, -o <dir>           Output directory (default: ./output)
--dry-run                    Generate blueprint only, no files
--count <n>                  Number of benchmarks (default: 20)
--verbose                    Show detailed output
```

## Output

Each factory generates:
- **Blueprint JSON** — Complete project specification
- **Blueprint YAML** — Human-readable specification
- **Next.js source code** — Components, pages, API routes
- **Configuration** — package.json, tsconfig, tailwind, postcss

## Source Structure

```
src/
├── core/
│   ├── engine.ts              # StudioEngine, FactoryRegistry, Factory base
│   ├── types.ts               # All TypeScript type definitions
│   ├── canonical-schema.ts    # Canonical requirements schema
│   ├── requirement-engine.ts  # Requirement Understanding Engine
│   ├── factory-router.ts      # Smart factory routing
│   └── factory-setup.ts       # Engine factory registration
├── inputs/                    # Input processors
├── factories/                 # Factory implementations
│   ├── website/
│   ├── ecommerce/
│   ├── saas/
│   ├── admin/
│   ├── dashboard/
│   ├── agent/
│   └── tools/
├── generators/                # Code generators
├── audit/                     # Production readiness audit
│   ├── prompts/               # Benchmark prompts (20 per factory)
│   ├── analyzers/             # Quality analyzers
│   ├── benchmark-runner.ts    # Benchmark orchestration
│   └── report-generator.ts    # Scorecard & report generation
├── cli/
│   └── studio.ts              # Main CLI entry point
└── web/
    ├── index.html             # Web UI
    └── server.ts              # API server
```

## Benchmark & Audit

Run quality benchmarks across all factories:

```bash
# Audit a single factory
studio audit website --count 10

# Audit all factories
studio audit:all

# Reports saved to ./audit-reports/
```

Quality metrics measured:
- Build success rate
- TypeScript errors
- Responsive design
- Accessibility (ARIA)
- SEO metadata
- Error boundaries
- Loading states
- Dark mode support

## Version History

- **v0.2.0** — Requirement Understanding Engine, canonical schema, smart routing
- **v0.1.0** — 7 factories, 6 input types, CLI + Web UI
- **v0.0.1** — Initial architecture specs
