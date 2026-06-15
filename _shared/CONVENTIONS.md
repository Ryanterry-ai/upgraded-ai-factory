# Shared Conventions

## Code Style
- TypeScript strict mode enabled
- ESLint with Next.js recommended config
- Prettier for code formatting
- Consistent naming: camelCase for variables, PascalCase for components

## File Organization
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
│   ├── ui/        # Atomic UI components
│   ├── layout/    # Layout components
│   └── features/  # Feature-specific components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── types/         # TypeScript types
└── config/        # Configuration files
```

## Component Conventions
- One component per file
- Named exports preferred
- Props interface defined above component
- Default export for page components only

## API Conventions
- RESTful endpoints
- Consistent error responses
- Input validation with Zod
- Rate limiting on all endpoints

## Documentation Conventions
- Markdown for all documentation
- YAML for configuration
- JSON for data files
- Comments in code for complex logic only
