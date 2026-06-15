import { ProjectContext } from '../types.js';

export class AccessibilityEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for ARIA labels
    const ariaLabels = this.fileMapCountPattern(ctx, /aria-label\s*=/);
    if (ariaLabels >= 3) {
      score += 15;
    } else if (ariaLabels >= 1) {
      score += 8;
    } else {
      findings.push({ rule: 'a11y:aria-labels', message: 'No aria-label attributes found', severity: 'major' });
    }

    // Check for ARIA roles
    const ariaRoles = this.fileMapCountPattern(ctx, /role\s*=\s*["']/);
    if (ariaRoles >= 2) {
      score += 10;
    } else if (ariaRoles >= 1) {
      score += 5;
    } else {
      findings.push({ rule: 'a11y:aria-roles', message: 'No ARIA roles defined', severity: 'major' });
    }

    // Check for alt text on images
    const imgsWithAlt = this.fileMapCountPattern(ctx, /<img\b[^>]*\balt=["'][^"']+["']/);
    const imgsTotal = this.fileMapCountPattern(ctx, /<img\b/);
    if (imgsTotal === 0) {
      score += 10;
    } else if (imgsWithAlt >= imgsTotal) {
      score += 10;
    } else {
      const missingAlt = imgsTotal - imgsWithAlt;
      findings.push({ rule: 'a11y:alt-text', message: `${missingAlt} images missing alt text`, severity: 'critical' });
    }

    // Check for form labels
    const labels = this.fileMapCountPattern(ctx, /<label\b/);
    const inputs = this.fileMapCountPattern(ctx, /<input\b/);
    if (inputs === 0) {
      score += 10;
    } else if (labels >= inputs) {
      score += 10;
    } else {
      findings.push({ rule: 'a11y:form-labels', message: 'Some form inputs missing labels', severity: 'major' });
    }

    // Check for keyboard navigation
    const hasKeyboard = this.fileMapHasPattern(ctx, /onKeyDown|onKeyUp|onKeyPress|tabIndex|tabindex/i);
    if (hasKeyboard) {
      score += 10;
    } else {
      findings.push({ rule: 'a11y:keyboard', message: 'No keyboard navigation handlers found', severity: 'major' });
    }

    // Check for focus management
    const hasFocus = this.fileMapHasPattern(ctx, /focus|:focus|focus-visible|focus-within/i);
    if (hasFocus) {
      score += 10;
    } else {
      findings.push({ rule: 'a11y:focus', message: 'No focus styles or management found', severity: 'major' });
    }

    // Check for skip links
    const hasSkipLink = this.fileMapHasPattern(ctx, /skip\s*(to)?\s*(main|content|nav)|SkipLink/i);
    if (hasSkipLink) {
      score += 10;
    } else {
      findings.push({ rule: 'a11y:skip-link', message: 'No skip navigation link found', severity: 'minor' });
    }

    // Check for semantic HTML
    const semanticElements = this.fileMapCountPattern(ctx, /<(main|article|section|header|footer|nav|aside|figure|figcaption)\b/);
    if (semanticElements >= 5) {
      score += 10;
    } else if (semanticElements >= 2) {
      score += 5;
    } else {
      findings.push({ rule: 'a11y:semantic-html', message: 'Limited semantic HTML usage', severity: 'major' });
    }

    // Check for color contrast mentions
    const hasContrast = this.fileMapHasPattern(ctx, /contrast|wcag|a11y/i);
    if (hasContrast) {
      score += 5;
    } else {
      findings.push({ rule: 'a11y:color-contrast', message: 'No color contrast considerations found', severity: 'minor' });
    }

    // Check for reduced motion
    const hasReducedMotion = this.fileMapHasPattern(ctx, /prefers-reduced-motion|motion-reduce/i);
    if (hasReducedMotion) {
      score += 5;
    } else {
      findings.push({ rule: 'a11y:reduced-motion', message: 'No prefers-reduced-motion support', severity: 'minor' });
    }

    // Check for live regions
    const hasLiveRegion = this.fileMapHasPattern(ctx, /aria-live\s*=/);
    if (hasLiveRegion) {
      score += 5;
    } else {
      findings.push({ rule: 'a11y:live-regions', message: 'No ARIA live regions for dynamic content', severity: 'minor' });
    }

    const summary = score >= 80 ? 'Accessibility is well-implemented' :
      score >= 60 ? 'Accessibility has gaps' :
      score >= 40 ? 'Accessibility needs significant work' :
      'Accessibility is lacking';

    return { score, maxScore, findings, summary };
  }

  private fileMapHasPattern(ctx: ProjectContext, pattern: RegExp): boolean {
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx')) {
        if (pattern.test(content)) return true;
      }
    }
    return false;
  }

  private fileMapCountPattern(ctx: ProjectContext, pattern: RegExp): number {
    let count = 0;
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx')) {
        const matches = content.match(new RegExp(pattern.source, 'gi'));
        if (matches) count += matches.length;
      }
    }
    return count;
  }
}
