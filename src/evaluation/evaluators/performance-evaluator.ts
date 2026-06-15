import { ProjectContext } from '../types.js';

export class PerformanceEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for image optimization
    const hasImageOpt = this.fileMapHasPattern(ctx, /next\/image|Image\s+from\s+['"]next\/image/);
    if (hasImageOpt) {
      score += 15;
    } else {
      const hasImgTag = this.fileMapHasPattern(ctx, /<img\b/);
      if (hasImgTag) {
        findings.push({ rule: 'perf:image-optimization', message: 'Using <img> instead of next/image', severity: 'major' });
      } else {
        score += 5;
      }
    }

    // Check for code splitting (dynamic imports)
    const hasDynamic = this.fileMapHasPattern(ctx, /dynamic\s*\(|lazy\s*\(|React\.lazy/);
    if (hasDynamic) {
      score += 10;
    } else {
      findings.push({ rule: 'perf:code-splitting', message: 'No dynamic imports or lazy loading found', severity: 'minor' });
    }

    // Check for lazy loading
    const hasLazy = this.fileMapHasPattern(ctx, /loading\s*=\s*["']lazy["']|lazy/i);
    if (hasLazy) {
      score += 5;
    } else {
      findings.push({ rule: 'perf:lazy-loading', message: 'No lazy loading detected', severity: 'minor' });
    }

    // Check for font optimization
    const hasFontOpt = this.fileMapHasPattern(ctx, /next\/font|font-display\s*:\s*swap/i);
    if (hasFontOpt) {
      score += 10;
    } else {
      findings.push({ rule: 'perf:font-optimization', message: 'No font optimization (next/font or font-display swap)', severity: 'minor' });
    }

    // Check for metadata viewport
    const hasViewport = this.fileMapHasPattern(ctx, /viewport\s*[:=]/);
    if (hasViewport) {
      score += 5;
    } else {
      findings.push({ rule: 'perf:viewport', message: 'No viewport metadata defined', severity: 'minor' });
    }

    // Check for meta tags for mobile
    const hasMobileMeta = this.fileMapHasPattern(ctx, /width\s*=\s*device-width/i);
    if (hasMobileMeta) {
      score += 5;
    }

    // Check for CSS-in-JS avoidance (Tailwind preferred)
    const hasTailwind = ctx.fileMap.has('tailwind.config.js') || ctx.fileMap.has('tailwind.config.ts') || ctx.fileMap.has('tailwind.config.mjs');
    if (hasTailwind) {
      score += 10;
    } else {
      const hasStyled = this.fileMapHasPattern(ctx, /styled-components|@emotion|css-in-js/i);
      if (hasStyled) {
        findings.push({ rule: 'perf:css-framework', message: 'Using CSS-in-JS instead of utility CSS', severity: 'minor' });
      }
    }

    // Check for bundle size awareness
    const hasBundleAnalysis = ctx.fileMap.has('next.config.js') && (ctx.fileMap.get('next.config.js')?.includes('bundle-analyzer') || false);
    if (hasBundleAnalysis) {
      score += 5;
    }

    // Check for compression headers
    const hasHeaders = this.fileMapHasPattern(ctx, /headers\s*\(|compress/i);
    if (hasHeaders) {
      score += 5;
    } else {
      findings.push({ rule: 'perf:compression', message: 'No compression configuration found', severity: 'minor' });
    }

    // Check for caching strategies
    const hasCache = this.fileMapHasPattern(ctx, /cache-control|revalidate|stale-while-revalidate/i);
    if (hasCache) {
      score += 10;
    } else {
      findings.push({ rule: 'perf:caching', message: 'No caching strategy detected', severity: 'minor' });
    }

    // Check for preconnect/preload
    const hasPreconnect = this.fileMapHasPattern(ctx, /preconnect|preload|prefetch/i);
    if (hasPreconnect) {
      score += 5;
    } else {
      findings.push({ rule: 'perf:preconnect', message: 'No preconnect/preload hints found', severity: 'info' });
    }

    // Check for third-party script optimization
    const hasThirdParty = this.fileMapHasPattern(ctx, /thirdparty|third-party|afterInteractive|lazyOnload/i);
    if (hasThirdParty) {
      score += 5;
    }

    // Check for ISR/SSG usage
    const hasISR = this.fileMapHasPattern(ctx, /revalidate|getStaticProps|generateStaticParams/i);
    if (hasISR) {
      score += 10;
    } else {
      findings.push({ rule: 'perf:isr-ssg', message: 'No ISR/SSG usage detected', severity: 'info' });
    }

    const summary = score >= 80 ? 'Performance optimizations are in place' :
      score >= 60 ? 'Performance has room for improvement' :
      score >= 40 ? 'Performance needs attention' :
      'Performance optimizations are missing';

    return { score, maxScore, findings, summary };
  }

  private fileMapHasPattern(ctx: ProjectContext, pattern: RegExp): boolean {
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js') || path.endsWith('.css')) {
        if (pattern.test(content)) return true;
      }
    }
    return false;
  }
}
