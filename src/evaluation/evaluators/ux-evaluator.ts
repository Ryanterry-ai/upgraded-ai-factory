import { ProjectContext } from '../types.js';

export class UxEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for responsive design
    const hasResponsive = this.fileMapHasPattern(ctx, /@media|responsive|breakpoint|sm:|md:|lg:|xl:/i);
    if (hasResponsive) {
      score += 15;
    } else {
      findings.push({ rule: 'ux:responsive', message: 'No responsive design patterns found', severity: 'critical' });
    }

    // Check for loading states
    const hasLoading = this.fileMapHasPattern(ctx, /loading|isLoading|Loading|spinner|Skeleton/i);
    if (hasLoading) {
      score += 10;
    } else {
      findings.push({ rule: 'ux:loading-states', message: 'No loading states found', severity: 'major' });
    }

    // Check for error states
    const hasError = this.fileMapHasPattern(ctx, /error|Error|catch|fallback|ErrorBoundary/i);
    if (hasError) {
      score += 10;
    } else {
      findings.push({ rule: 'ux:error-states', message: 'No error states or boundaries found', severity: 'major' });
    }

    // Check for empty states
    const hasEmpty = this.fileMapHasPattern(ctx, /empty|no-data|no-results|no-items|Nothing here/i);
    if (hasEmpty) {
      score += 5;
    } else {
      findings.push({ rule: 'ux:empty-states', message: 'No empty state handling found', severity: 'minor' });
    }

    // Check for hover effects
    const hasHover = this.fileMapHasPattern(ctx, /hover:|hover\b|onMouseEnter|onMouseLeave/i);
    if (hasHover) {
      score += 10;
    } else {
      findings.push({ rule: 'ux:hover', message: 'No hover effects found', severity: 'minor' });
    }

    // Check for transitions
    const hasTransitions = this.fileMapHasPattern(ctx, /transition|transition-all|transition-colors|transition-transform|animate-|motion-|framer-motion/i);
    if (hasTransitions) {
      score += 10;
    } else {
      findings.push({ rule: 'ux:transitions', message: 'No transitions or animations found', severity: 'minor' });
    }

    // Check for dark mode
    const hasDark = this.fileMapHasPattern(ctx, /dark:|darkMode|dark|prefers-color-scheme/i);
    if (hasDark) {
      score += 10;
    } else {
      findings.push({ rule: 'ux:dark-mode', message: 'No dark mode support found', severity: 'minor' });
    }

    // Check for navigation
    const hasNav = this.fileMapHasPattern(ctx, /<nav\b|Navbar|Sidebar|navigation/i);
    if (hasNav) {
      score += 10;
    } else {
      findings.push({ rule: 'ux:navigation', message: 'No navigation component found', severity: 'major' });
    }

    // Check for toast/notification feedback
    const hasToast = this.fileMapHasPattern(ctx, /toast|notification|snackbar|alert|Toast/i);
    if (hasToast) {
      score += 5;
    } else {
      findings.push({ rule: 'ux:feedback', message: 'No toast/notification feedback system', severity: 'minor' });
    }

    // Check for form validation feedback
    const hasValidation = this.fileMapHasPattern(ctx, /required|validate|validation|error.*message|invalid/i);
    if (hasValidation) {
      score += 5;
    } else {
      findings.push({ rule: 'ux:form-validation', message: 'No form validation feedback found', severity: 'minor' });
    }

    // Check for breadcrumb navigation
    const hasBreadcrumb = this.fileMapHasPattern(ctx, /breadcrumb|Breadcrumb/i);
    if (hasBreadcrumb) {
      score += 5;
    } else {
      findings.push({ rule: 'ux:breadcrumb', message: 'No breadcrumb navigation found', severity: 'info' });
    }

    // Check for modal/dialog patterns
    const hasModal = this.fileMapHasPattern(ctx, /modal|dialog|Modal|Dialog|popup|Popup/i);
    if (hasModal) {
      score += 5;
    } else {
      findings.push({ rule: 'ux:modal', message: 'No modal/dialog patterns found', severity: 'info' });
    }

    const summary = score >= 80 ? 'UX patterns are well-implemented' :
      score >= 60 ? 'UX has some gaps' :
      score >= 40 ? 'UX needs significant work' :
      'UX fundamentals are missing';

    return { score, maxScore, findings, summary };
  }

  private fileMapHasPattern(ctx: ProjectContext, pattern: RegExp): boolean {
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.css')) {
        if (pattern.test(content)) return true;
      }
    }
    return false;
  }
}
