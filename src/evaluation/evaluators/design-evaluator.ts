import { ProjectContext } from '../types.js';

export class DesignEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for design tokens / CSS variables
    const hasCSSVars = this.fileMapHasPattern(ctx, /--[\w-]+\s*:/);
    if (hasCSSVars) {
      score += 15;
    } else {
      findings.push({ rule: 'design:css-variables', message: 'No CSS custom properties (design tokens) found', severity: 'major' });
    }

    // Check for color system
    const hasColorSystem = this.fileMapHasPattern(ctx, /primary|secondary|accent|neutral|background|foreground/i);
    if (hasColorSystem) {
      score += 10;
    } else {
      findings.push({ rule: 'design:color-system', message: 'No color system detected', severity: 'major' });
    }

    // Check for typography system
    const hasTypography = this.fileMapHasPattern(ctx, /font-size|fontSize|text-sm|text-base|text-lg|text-xl|text-2xl|font-heading/i);
    if (hasTypography) {
      score += 10;
    } else {
      findings.push({ rule: 'design:typography', message: 'No typography system detected', severity: 'major' });
    }

    // Check for spacing system
    const hasSpacing = this.fileMapHasPattern(ctx, /spacing|gap-|p-|m-|py-|px-|pt-|pb-|pl-|pr-/);
    if (hasSpacing) {
      score += 10;
    } else {
      findings.push({ rule: 'design:spacing', message: 'No spacing system detected', severity: 'major' });
    }

    // Check for component library
    const hasShadcn = ctx.fileMap.has('components/ui') || ctx.fileMap.has('src/components/ui');
    if (hasShadcn) {
      score += 10;
    } else {
      findings.push({ rule: 'design:component-library', message: 'No component library (shadcn/ui) detected', severity: 'minor' });
    }

    // Check for layout patterns
    const hasLayout = this.fileMapHasPattern(ctx, /flex|grid|container|layout|Stack|Grid|Flex/i);
    if (hasLayout) {
      score += 10;
    } else {
      findings.push({ rule: 'design:layout', message: 'No layout patterns found', severity: 'major' });
    }

    // Check for consistent border radius
    const hasRadius = this.fileMapHasPattern(ctx, /rounded|border-radius|borderRadius/i);
    if (hasRadius) {
      score += 5;
    } else {
      findings.push({ rule: 'design:radius', message: 'No consistent border radius system', severity: 'minor' });
    }

    // Check for shadow system
    const hasShadows = this.fileMapHasPattern(ctx, /shadow|box-shadow|boxShadow/i);
    if (hasShadows) {
      score += 5;
    } else {
      findings.push({ rule: 'design:shadows', message: 'No shadow system detected', severity: 'minor' });
    }

    // Check for responsive images
    const hasResponsiveImages = this.fileMapHasPattern(ctx, /next\/image|object-fit|aspect-ratio/i);
    if (hasResponsiveImages) {
      score += 10;
    } else {
      findings.push({ rule: 'design:responsive-images', message: 'No responsive image handling', severity: 'minor' });
    }

    // Check for icon system
    const hasIcons = this.fileMapHasPattern(ctx, /lucide|heroicons|react-icons|Icon\b/i);
    if (hasIcons) {
      score += 5;
    } else {
      findings.push({ rule: 'design:icons', message: 'No icon system detected', severity: 'info' });
    }

    // Check for animation library
    const hasAnimation = this.fileMapHasPattern(ctx, /framer-motion|motion|animate|transition/i);
    if (hasAnimation) {
      score += 5;
    } else {
      findings.push({ rule: 'design:animation', message: 'No animation library detected', severity: 'info' });
    }

    // Check for theme configuration
    const hasTheme = this.fileMapHasPattern(ctx, /theme\s*[=:]|ThemeProvider|ThemeProvider|createTheme/i);
    if (hasTheme) {
      score += 5;
    } else {
      findings.push({ rule: 'design:theme', message: 'No theme configuration found', severity: 'info' });
    }

    const summary = score >= 80 ? 'Design system is well-structured' :
      score >= 60 ? 'Design system has gaps' :
      score >= 40 ? 'Design system needs work' :
      'Design system is minimal';

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
