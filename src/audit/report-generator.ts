import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { FactoryScorecard, AuditReport } from './benchmark-runner.js';

export function generateReport(scorecards: FactoryScorecard[]): AuditReport {
  const totalProjects = scorecards.reduce((sum, sc) => sum + sc.totalProjects, 0);
  const overallScore = scorecards.length > 0
    ? Math.round(scorecards.reduce((sum, sc) => sum + sc.avgScore, 0) / scorecards.length * 10) / 10
    : 0;
  const overallBuildRate = totalProjects > 0
    ? Math.round(scorecards.reduce((sum, sc) => sum + sc.successfulBuilds, 0) / totalProjects * 100)
    : 0;

  const sorted = [...scorecards].sort((a, b) => a.avgScore - b.avgScore);
  const weakFactories = sorted.slice(0, 3).map(sc => sc.factory);
  const strongFactories = sorted.slice(-3).map(sc => sc.factory).reverse();

  // Generate recommendations
  const recommendations: string[] = [];

  for (const sc of scorecards) {
    if (sc.avgScore < 50) {
      recommendations.push(`🚨 ${sc.factory}: Critical quality issues (avg score ${sc.avgScore}). Needs immediate attention.`);
    }
    if (sc.successfulBuilds < sc.totalProjects * 0.5) {
      recommendations.push(`⚠️ ${sc.factory}: Low build success rate (${sc.successfulBuilds}/${sc.totalProjects}). Fix TypeScript errors.`);
    }
    if (sc.responsiveRate < 70) {
      recommendations.push(`📱 ${sc.factory}: Low responsive design rate (${sc.responsiveRate}%). Add media queries.`);
    }
    if (sc.accessibilityRate < 50) {
      recommendations.push(`♿ ${sc.factory}: Low accessibility rate (${sc.accessibilityRate}%). Add ARIA attributes.`);
    }
    if (sc.metadataRate < 60) {
      recommendations.push(`🔍 ${sc.factory}: Low metadata rate (${sc.metadataRate}%). Add SEO metadata.`);
    }
    if (sc.errorBoundaryRate < 40) {
      recommendations.push(`🛡️ ${sc.factory}: Low error boundary rate (${sc.errorBoundaryRate}%). Add error handling.`);
    }
    if (sc.avgTsErrors > 5) {
      recommendations.push(`📝 ${sc.factory}: High avg TypeScript errors (${sc.avgTsErrors}). Fix type issues.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All factories performing well. Consider adding more advanced quality checks.');
  }

  return {
    timestamp: new Date().toISOString(),
    totalProjects,
    totalFactories: scorecards.length,
    overallScore,
    overallBuildRate,
    factoryScorecards: scorecards,
    weakFactories,
    strongFactories,
    recommendations,
  };
}

export function saveReport(report: AuditReport, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });

  // Save JSON report
  writeFileSync(
    join(outputDir, 'audit-report.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );

  // Save markdown report
  const md = generateMarkdownReport(report);
  writeFileSync(join(outputDir, 'audit-report.md'), md, 'utf-8');

  // Save individual factory scorecards
  for (const sc of report.factoryScorecards) {
    const scMd = generateFactoryScorecardMarkdown(sc);
    writeFileSync(join(outputDir, `scorecard-${sc.factory}.md`), scMd, 'utf-8');
  }

  console.log(`\n📊 Reports saved to ${outputDir}`);
}

function generateMarkdownReport(report: AuditReport): string {
  let md = `# Production Readiness Audit Report

**Generated:** ${report.timestamp}
**Total Projects:** ${report.totalProjects}
**Factories Tested:** ${report.totalFactories}
**Overall Score:** ${report.overallScore}/100
**Overall Build Rate:** ${report.overallBuildRate}%

## Executive Summary

`;

  if (report.strongFactories.length > 0) {
    md += `### 🏆 Strongest Factories\n`;
    for (const f of report.strongFactories) {
      const sc = report.factoryScorecards.find(s => s.factory === f);
      if (sc) md += `- **${f}**: ${sc.avgScore}/100 (build rate: ${Math.round(sc.successfulBuilds / sc.totalProjects * 100)}%)\n`;
    }
    md += '\n';
  }

  if (report.weakFactories.length > 0) {
    md += `### ⚠️ Weakest Factories\n`;
    for (const f of report.weakFactories) {
      const sc = report.factoryScorecards.find(s => s.factory === f);
      if (sc) md += `- **${f}**: ${sc.avgScore}/100 (build rate: ${Math.round(sc.successfulBuilds / sc.totalProjects * 100)}%)\n`;
    }
    md += '\n';
  }

  md += `## Factory Scorecards\n\n`;
  md += `| Factory | Projects | Avg Score | Build Rate | TS Errors | Responsive | Accessible | Metadata |\n`;
  md += `|---------|----------|-----------|------------|-----------|------------|------------|----------|\n`;

  for (const sc of report.factoryScorecards) {
    const buildRate = Math.round(sc.successfulBuilds / sc.totalProjects * 100);
    md += `| ${sc.factory} | ${sc.totalProjects} | ${sc.avgScore} | ${buildRate}% | ${sc.avgTsErrors} | ${sc.responsiveRate}% | ${sc.accessibilityRate}% | ${sc.metadataRate}% |\n`;
  }

  md += `\n## Detailed Metrics\n\n`;

  for (const sc of report.factoryScorecards) {
    md += `### ${sc.factory.charAt(0).toUpperCase() + sc.factory.slice(1)} Factory\n`;
    md += `- **Successful Generations:** ${sc.successfulGenerations}/${sc.totalProjects}\n`;
    md += `- **Successful Builds:** ${sc.successfulBuilds}/${sc.totalProjects}\n`;
    md += `- **Avg Score:** ${sc.avgScore}/100\n`;
    md += `- **Avg Build Time:** ${sc.avgBuildTimeMs}ms\n`;
    md += `- **Avg TS Errors:** ${sc.avgTsErrors}\n`;
    md += `- **Avg File Count:** ${sc.avgFileCount}\n`;
    md += `- **Avg Lines of Code:** ${sc.avgLines}\n`;
    md += `- **Avg Components:** ${sc.avgComponentCount}\n`;
    md += `- **Avg Pages:** ${sc.avgPageCount}\n`;
    md += `- **Responsive Rate:** ${sc.responsiveRate}%\n`;
    md += `- **Accessibility Rate:** ${sc.accessibilityRate}%\n`;
    md += `- **Metadata Rate:** ${sc.metadataRate}%\n`;
    md += `- **Error Boundary Rate:** ${sc.errorBoundaryRate}%\n`;
    md += `- **Loading State Rate:** ${sc.loadingStateRate}%\n`;
    md += `- **Dark Mode Rate:** ${sc.darkModeRate}%\n`;
    md += `- **Lint Warnings:** ${sc.lintWarnings}\n`;
    md += `- **Lint Errors:** ${sc.lintErrors}\n\n`;
  }

  md += `## Recommendations\n\n`;
  for (const rec of report.recommendations) {
    md += `${rec}\n`;
  }

  return md;
}

function generateFactoryScorecardMarkdown(sc: FactoryScorecard): string {
  const buildRate = Math.round(sc.successfulBuilds / sc.totalProjects * 100);

  let md = `# ${sc.factory.charAt(0).toUpperCase() + sc.factory.slice(1)} Factory Scorecard

## Summary
- **Total Projects:** ${sc.totalProjects}
- **Successful Generations:** ${sc.successfulGenerations}
- **Successful Builds:** ${sc.successfulBuilds} (${buildRate}%)
- **Average Score:** ${sc.avgScore}/100
- **Average Build Time:** ${sc.avgBuildTimeMs}ms

## Quality Metrics

| Metric | Rate |
|--------|------|
| Responsive Design | ${sc.responsiveRate}% |
| Accessibility | ${sc.accessibilityRate}% |
| SEO Metadata | ${sc.metadataRate}% |
| Error Boundaries | ${sc.errorBoundaryRate}% |
| Loading States | ${sc.loadingStateRate}% |
| Dark Mode | ${sc.darkModeRate}% |

## Code Metrics

| Metric | Average |
|--------|---------|
| TypeScript Errors | ${sc.avgTsErrors} |
| File Count | ${sc.avgFileCount} |
| Lines of Code | ${sc.avgLines} |
| Components | ${sc.avgComponentCount} |
| Pages | ${sc.avgPageCount} |
| Lint Warnings | ${sc.lintWarnings} |
| Lint Errors | ${sc.lintErrors} |

## Weakest Prompts
${sc.weakestPrompts.map(id => `- ${id}`).join('\n')}

## Strongest Prompts
${sc.strongestPrompts.map(id => `- ${id}`).join('\n')}

## Individual Results

| Prompt ID | Score | Build | TS Errors | Files | Lines |
|-----------|-------|-------|-----------|-------|-------|
`;

  for (const r of sc.results) {
    const buildIcon = r.quality.buildSuccess ? '✅' : '❌';
    md += `| ${r.promptId} | ${r.quality.score} | ${buildIcon} | ${r.quality.tsErrors} | ${r.quality.fileCount} | ${r.quality.totalLines} |\n`;
  }

  return md;
}
