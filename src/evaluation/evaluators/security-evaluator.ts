import { ProjectContext } from '../types.js';

export class SecurityEvaluator {
  async evaluate(ctx: ProjectContext): Promise<{
    score: number; maxScore: number; findings: any[]; summary: string;
  }> {
    const findings: any[] = [];
    let score = 0;
    const maxScore = 100;

    // Check for environment variables
    const hasEnv = ctx.fileMap.has('.env.example') || ctx.fileMap.has('.env.local.example');
    if (hasEnv) {
      score += 10;
    } else {
      findings.push({ rule: 'sec:env-example', message: 'No .env.example file', severity: 'minor' });
    }

    // Check for hardcoded secrets
    const hasHardcoded = this.fileMapHasPattern(ctx, /(?:password|secret|api_key|apikey|token)\s*[:=]\s*["'][^"']+["']/i);
    if (!hasHardcoded) {
      score += 15;
    } else {
      findings.push({ rule: 'sec:hardcoded-secrets', message: 'Potential hardcoded secrets detected', severity: 'critical' });
    }

    // Check for .gitignore
    const hasGitignore = ctx.fileMap.has('.gitignore');
    if (hasGitignore) {
      score += 5;
      const gitignore = ctx.fileMap.get('.gitignore') || '';
      if (gitignore.includes('.env')) score += 5;
      if (gitignore.includes('node_modules')) score += 2;
    } else {
      findings.push({ rule: 'sec:gitignore', message: 'No .gitignore file', severity: 'major' });
    }

    // Check for XSS protection (no dangerouslySetInnerHTML without sanitization)
    const hasDangerous = this.fileMapHasPattern(ctx, /dangerouslySetInnerHTML/);
    const hasSanitize = this.fileMapHasPattern(ctx, /sanitize|DOMPurify|xss/i);
    if (!hasDangerous) {
      score += 10;
    } else if (hasSanitize) {
      score += 5;
    } else {
      findings.push({ rule: 'sec:xss', message: 'dangerouslySetInnerHTML used without sanitization', severity: 'critical' });
    }

    // Check for CSRF protection
    const hasCSRF = this.fileMapHasPattern(ctx, /csrf|csrfToken|CSRF/i);
    if (hasCSRF) {
      score += 5;
    } else {
      findings.push({ rule: 'sec:csrf', message: 'No CSRF protection detected', severity: 'minor' });
    }

    // Check for rate limiting
    const hasRateLimit = this.fileMapHasPattern(ctx, /rate.?limit|throttle|RateLimiter/i);
    if (hasRateLimit) {
      score += 10;
    } else {
      findings.push({ rule: 'sec:rate-limit', message: 'No rate limiting detected on API routes', severity: 'minor' });
    }

    // Check for input validation
    const hasValidation = this.fileMapHasPattern(ctx, /zod|yup|joi|validate|validation/i);
    if (hasValidation) {
      score += 10;
    } else {
      findings.push({ rule: 'sec:validation', message: 'No input validation library detected', severity: 'major' });
    }

    // Check for authentication patterns
    const hasAuth = this.fileMapHasPattern(ctx, /auth|session|jwt|cookie|token/i);
    if (hasAuth) {
      score += 5;
    }

    // Check for HTTPS enforcement
    const hasHTTPS = this.fileMapHasPattern(ctx, /https:|secure|Strict-Transport-Security/i);
    if (hasHTTPS) {
      score += 5;
    } else {
      findings.push({ rule: 'sec:https', message: 'No HTTPS enforcement detected', severity: 'minor' });
    }

    // Check for Content Security Policy
    const hasCSP = this.fileMapHasPattern(ctx, /Content-Security-Policy|CSP/i);
    if (hasCSP) {
      score += 10;
    } else {
      findings.push({ rule: 'sec:csp', message: 'No Content Security Policy detected', severity: 'minor' });
    }

    // Check for SQL injection prevention (parameterized queries)
    const hasSQLInjection = this.fileMapHasPattern(ctx, /query\s*\(\s*["`]/);
    if (!hasSQLInjection) {
      score += 5;
    } else {
      findings.push({ rule: 'sec:sql-injection', message: 'Potential SQL injection (raw query strings)', severity: 'critical' });
    }

    // Check for error handling (no sensitive data in errors)
    const hasGenericErrors = this.fileMapHasPattern(ctx, /catch\s*\(|\.catch\(/);
    if (hasGenericErrors) {
      score += 5;
    }

    // Check for security headers
    const hasHeaders = this.fileMapHasPattern(ctx, /X-Frame-Options|X-Content-Type|X-XSS-Protection|Referrer-Policy/i);
    if (hasHeaders) {
      score += 10;
    } else {
      findings.push({ rule: 'sec:headers', message: 'No security headers configured', severity: 'minor' });
    }

    // Check for dependency audit
    const hasAudit = this.fileMapHasPattern(ctx, /npm audit|yarn audit|snyk/i);
    if (hasAudit) {
      score += 5;
    }

    const summary = score >= 80 ? 'Security practices are solid' :
      score >= 60 ? 'Security has some gaps' :
      score >= 40 ? 'Security needs attention' :
      'Security is a concern';

    return { score, maxScore, findings, summary };
  }

  private fileMapHasPattern(ctx: ProjectContext, pattern: RegExp): boolean {
    for (const [path, content] of ctx.fileMap) {
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
        if (pattern.test(content)) return true;
      }
    }
    return false;
  }
}
