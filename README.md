# Upgraded AI Factory Studio

A multi-factory AI platform capable of generating websites, ecommerce stores, SaaS applications, admin panels, dashboards, AI agents, and internal tools from any combination of prompt, URL, screenshot, Figma, PDF, or existing codebase.

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Generate from prompt
npx tsx src/cli/index.ts "Modern SaaS landing page"

# Generate from URL
npx tsx src/cli/index.ts https://example.com

# List all factories
npx tsx src/cli/index.ts --list

# Start web interface
npm run dev:web
```

## Supported Inputs

| Input | Flag | Description |
|-------|------|-------------|
| **Prompt** | `-p <text>` | Text description of what to build |
| **URL** | `-u <url>` | Website URL to analyze/clone |
| **Screenshot** | `-s <path>` | Screenshot image path |
| **Figma** | `-f <url>` | Figma design URL |
| **PDF** | `--pdf <path>` | PDF document path |
| **Codebase** | `-c <path>` | Existing codebase path |

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

## Usage Examples

```bash
# Website from prompt
studio "Portfolio site for a photographer"

# Ecommerce from prompt
studio "Ecommerce store for handmade jewelry"

# SaaS from prompt
studio "Project management SaaS with auth and billing"

# Dashboard from prompt
studio "Analytics dashboard with charts and KPIs"

# AI Agent from prompt
studio "AI chatbot for customer support"

# Website from URL
studio -u https://stripe.com

# Website from screenshot
studio -s ./design.png -o ./my-project

# Force specific factory
studio "Build a landing page" -F saas

# Dry run (blueprint only)
studio "My app" --dry-run
```

## CLI Options

```
--url, -u <url>              Website URL to analyze/clone
--screenshot, -s <path>      Screenshot image path
--prompt, -p <text>          Text description of what to build
--figma, -f <url>            Figma design URL
--pdf <path>                 PDF document path
--codebase, -c <path>        Existing codebase path
--factory, -F <type>         Force specific factory
--output, -o <dir>           Output directory (default: ./output)
--format <fmt>               Output format: json, yaml, both
--dry-run                    Generate blueprint only, no files
--verbose, -v                Verbose output
--list                       List all available factories
--help, -h                   Show help
```

## Web Interface

```bash
npm run dev:web
# Open http://localhost:3000
```

## Architecture

```
src/
├── core/                    # Engine, registry, types
│   ├── engine.ts           # StudioEngine, FactoryRegistry, Factory base class
│   └── types.ts            # All TypeScript type definitions
├── inputs/                  # Input processors
│   ├── url-processor.ts    # URL fetching and analysis
│   ├── screenshot-processor.ts
│   ├── prompt-processor.ts
│   ├── figma-processor.ts
│   ├── pdf-processor.ts
│   └── codebase-processor.ts
├── factories/               # Factory implementations
│   ├── website/            # Website Factory
│   ├── ecommerce/          # Ecommerce Factory
│   ├── saas/               # SaaS Factory
│   ├── admin/              # Admin Panel Factory
│   ├── dashboard/          # Dashboard Factory
│   ├── agent/              # AI Agent Factory
│   └── tools/              # Internal Tools Factory
├── generators/              # Code generators
│   ├── blueprint-gen.ts    # Blueprint JSON/YAML generation
│   └── codegen.ts          # Component, page, config generation
├── cli/                     # CLI interface
│   └── index.ts
└── web/                     # Web interface
    ├── index.html           # Frontend UI
    └── server.ts            # API server
```

## Output

Each factory generates:
- **Blueprint JSON** — Complete project specification
- **Blueprint YAML** — Human-readable specification
- **Next.js source code** — Components, pages, API routes
- **Configuration** — package.json, tsconfig, tailwind, postcss

## Phase 4 Success Criteria

A user can submit a URL, screenshot, prompt, Figma link, PDF, or codebase and receive a structured website blueprint that becomes the source of truth for future code generation.
