export function sanitizeProjectName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40) || 'my-project';
}

export function generateComponent(name: string, props: Record<string, string>): string {
  const propInterface = Object.entries(props)
    .map(([key, type]) => `  ${key}: ${type};`)
    .join('\n');

  return `interface ${name}Props {
${propInterface}
}

export function ${name}({ ${Object.keys(props).join(', ')} }: ${name}Props) {
  return (
    <div className="">
      {/* ${name} component */}
    </div>
  );
}

export default ${name};
`;
}

export function generatePage(name: string, components: string[]): string {
  const imports = components
    .map(c => `import { ${c} } from '@/components/${c}';`)
    .join('\n');

  const componentUsage = components.map(c => `      <${c} />`).join('\n');

  return `${imports}

export default function ${name}Page() {
  return (
    <main className="min-h-screen">
${componentUsage}
    </main>
  );
}
`;
}

export function generateLayout(name: string, children: string): string {
  return `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${name}',
  description: '${name} application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
`;
}

export function generateStyles(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #111827;
  --primary: #2563eb;
  --primary-light: #dbeafe;
  --primary-dark: #1d4ed8;
  --secondary: #4f46e5;
  --accent: #f59e0b;
  --muted: #f3f4f6;
  --border: #e5e7eb;
  --ring: #2563eb;
  --radius: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #030712;
    --foreground: #f9fafb;
    --primary: #3b82f6;
    --primary-light: #1e3a5f;
    --primary-dark: #60a5fa;
    --secondary: #6366f1;
    --accent: #fbbf24;
    --muted: #1f2937;
    --border: #374151;
    --ring: #3b82f6;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: 'Inter', system-ui, sans-serif;
}
`;
}

export function generateConfig(name: string): { filename: string; content: string } {
  return {
    filename: 'next.config.mjs',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
`,
  };
}

export function generatePackageJson(name: string): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'my-project';

  return JSON.stringify({
    name: safeName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^14.2.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      '@types/node': '^20.14.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      tailwindcss: '^3.4.0',
      typescript: '^5.5.0',
    },
  }, null, 2);
}

export function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2);
}

export function generateTailwindConfig(): { filename: string; content: string } {
  return {
    filename: 'tailwind.config.mjs',
    content: `/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: 'var(--primary-light)',
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
`,
  };
}

export function generatePostcssConfig(): { filename: string; content: string } {
  return {
    filename: 'postcss.config.mjs',
    content: `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`,
  };
}
