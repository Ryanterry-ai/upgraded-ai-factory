import { ProjectContext } from '../types.js';

export class SeoEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for metadata exports
    const hasMetadata = this.fileMapHasPattern(ctx, /export\s+(const|let)\s+metadata\b/);
    if (hasMetadata) {
      score += 15;
    } else {
      findings.push({ rule: 'seo:metadata-export', message: 'No metadata export found in layout/page', severity: 'critical' });
    }

    // Check for title
    const hasTitle = this.fileMapHasPattern(ctx, /title\s*[:=]/);
    if (hasTitle) {
      score += 10;
    } else {
      findings.push({ rule: 'seo:title', message: 'No title defined in metadata', severity: 'critical' });
    }

    // Check for description
    const hasDescription = this.fileMapHasPattern(ctx, /description\s*[:=]/);
    if (hasDescription) {
      score += 10;
    } else {
      findings.push({ rule: 'seo:description', message: 'No meta description defined', severity: 'critical' });
    }

    // Check for Open Graph
    const hasOG = this.fileMapHasPattern(ctx, /openGraph|opengraph|og:/i);
    if (hasOG) {
      score += 10;
    } else {
      findings.push({ rule: 'seo:open-graph', message: 'No Open Graph metadata found', severity: 'major' });
    }

    // Check for canonical URL
    const hasCanonical = this.fileMapHasPattern(ctx, /canonical/i);
    if (hasCanonical) {
      score += 5;
    } else {
      findings.push({ rule: 'seo:canonical', message: 'No canonical URL defined', severity: 'minor' });
    }

    // Check for robots
    const hasRobots = this.fileMapHasPattern(ctx, /robots\s*[:=]/);
    if (hasRobots) {
      score += 5;
    } else {
      findings.push({ rule: 'seo:robots', message: 'No robots directive found', severity: 'minor' });
    }

    // Check for sitemap
    const hasSitemap = this.hasAnyFile(ctx, ['app/sitemap.ts', 'app/sitemap.js', 'src/app/sitemap.ts', 'pages/sitemap.ts']);
    if (hasSitemap) {
      score += 10;
    } else {
      findings.push({ rule: 'seo:sitemap', message: 'No sitemap generation found', severity: 'major' });
    }

    // Check for structured data
    const hasSchema = this.fileMapHasPattern(ctx, /application\/ld\+json|schema\.org|jsonLd/i);
    if (hasSchema) {
      score += 10;
    } else {
      findings.push({ rule: 'seo:structured-data', message: 'No structured data (JSON-LD) found', severity: 'major' });
    }

    // Check for semantic HTML
    const hasSemantic = this.fileMapHasPattern(ctx, /<(main|article|section|header|footer|nav|aside)\b/);
    if (hasSemantic) {
      score += 10;
    } else {
      findings.push({ rule: 'seo:semantic-html', message: 'No semantic HTML elements found', severity: 'major' });
    }

    // Check for heading hierarchy
    const hasH1 = this.fileMapHasPattern(ctx, /<h1\b/);
    const hasH2 = this.fileMapHasPattern(ctx, /<h2\b/);
    if (hasH1) score += 5;
    if (hasH2) score += 5;

    // Check for alt text on images
    const imagesWithoutAlt = this.fileMapCountPattern(ctx, /<img\b(?![^>]*\balt=)/);
    if (imagesWithoutAlt === 0) {
      score += 5;
    } else {
      findings.push({ rule: 'seo:alt-text', message: `${imagesWithoutAlt} images missing alt text`, severity: 'major' });
    }

    // Check for lang attribute
    const hasLang = this.fileMapHasPattern(ctx, /lang\s*=\s*["']/);
    if (hasLang) {
      score += 5;
    } else {
      findings.push({ rule: 'seo:lang', message: 'No lang attribute on html element', severity: 'minor' });
    }

    const summary = score >= 80 ? 'SEO fundamentals are strong' :
      score >= 60 ? 'SEO has minor gaps' :
      score >= 40 ? 'SEO needs significant improvement' :
      'SEO fundamentals are missing';

    return { score, maxScore, findings, summary };
  }

  private hasAnyFile(ctx: ProjectContext, paths: string[]): boolean {
    return paths.some(p => ctx.fileMap.has(p));
  }

  private fileMapHasPattern(ctx: ProjectContext, pattern: RegExp): boolean {
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
        if (pattern.test(content)) return true;
      }
    }
    return false;
  }

  private fileMapCountPattern(ctx: ProjectContext, pattern: RegExp): number {
    let count = 0;
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx')) {
        const matches = content.match(new RegExp(pattern.source, 'g'));
        if (matches) count += matches.length;
      }
    }
    return count;
  }
}
