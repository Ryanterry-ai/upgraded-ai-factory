// Phase 8: Benchmark Scoring System
export const WEIGHTS = {
    buildSuccess: 0.20,
    typecheck: 0.10,
    lint: 0.05,
    seo: 0.10,
    accessibility: 0.10,
    performance: 0.10,
    mobileUx: 0.10,
    featureCompleteness: 0.10,
    designQuality: 0.10,
    promptAccuracy: 0.05
};
export function calculateTotalScore(scores) {
    return (scores.buildSuccess * WEIGHTS.buildSuccess +
        scores.typecheck * WEIGHTS.typecheck +
        scores.lint * WEIGHTS.lint +
        scores.seo * WEIGHTS.seo +
        scores.accessibility * WEIGHTS.accessibility +
        scores.performance * WEIGHTS.performance +
        scores.mobileUx * WEIGHTS.mobileUx +
        scores.featureCompleteness * WEIGHTS.featureCompleteness +
        scores.designQuality * WEIGHTS.designQuality +
        scores.promptAccuracy * WEIGHTS.promptAccuracy);
}
export function calculateGrade(totalScore) {
    if (totalScore >= 0.97)
        return 'A+';
    if (totalScore >= 0.93)
        return 'A';
    if (totalScore >= 0.90)
        return 'A-';
    if (totalScore >= 0.87)
        return 'B+';
    if (totalScore >= 0.83)
        return 'B';
    if (totalScore >= 0.80)
        return 'B-';
    if (totalScore >= 0.77)
        return 'C+';
    if (totalScore >= 0.73)
        return 'C';
    if (totalScore >= 0.70)
        return 'C-';
    if (totalScore >= 0.60)
        return 'D';
    return 'F';
}
export function calculatePassRate(scores) {
    const passing = [
        scores.buildSuccess >= 0.8,
        scores.typecheck >= 0.8,
        scores.lint >= 0.8,
        scores.seo >= 0.7,
        scores.accessibility >= 0.7,
        scores.performance >= 0.7,
        scores.mobileUx >= 0.7,
        scores.featureCompleteness >= 0.7,
        scores.designQuality >= 0.7,
        scores.promptAccuracy >= 0.7
    ];
    return passing.filter(Boolean).length / passing.length;
}
export function identifyStrengths(scores) {
    const strengths = [];
    if (scores.buildSuccess >= 0.9)
        strengths.push('Excellent build reliability');
    if (scores.typecheck >= 0.9)
        strengths.push('Strong type safety');
    if (scores.lint >= 0.9)
        strengths.push('Clean code quality');
    if (scores.seo >= 0.9)
        strengths.push('Great SEO optimization');
    if (scores.accessibility >= 0.9)
        strengths.push('Excellent accessibility');
    if (scores.performance >= 0.9)
        strengths.push('Strong performance');
    if (scores.mobileUx >= 0.9)
        strengths.push('Great mobile experience');
    if (scores.featureCompleteness >= 0.9)
        strengths.push('Complete feature set');
    if (scores.designQuality >= 0.9)
        strengths.push('High design quality');
    if (scores.promptAccuracy >= 0.9)
        strengths.push('Accurate prompt following');
    return strengths;
}
export function identifyIssues(scores) {
    const issues = [];
    if (scores.buildSuccess < 0.7)
        issues.push('Build failures detected');
    if (scores.typecheck < 0.7)
        issues.push('TypeScript errors present');
    if (scores.lint < 0.7)
        issues.push('Lint errors detected');
    if (scores.seo < 0.6)
        issues.push('Missing SEO essentials');
    if (scores.accessibility < 0.6)
        issues.push('Accessibility issues');
    if (scores.performance < 0.6)
        issues.push('Performance problems');
    if (scores.mobileUx < 0.6)
        issues.push('Poor mobile experience');
    if (scores.featureCompleteness < 0.6)
        issues.push('Missing key features');
    if (scores.designQuality < 0.6)
        issues.push('Design quality issues');
    if (scores.promptAccuracy < 0.6)
        issues.push('Poor prompt following');
    return issues;
}
export function createScoredOutput(promptId, platform, scores) {
    const totalScore = calculateTotalScore(scores);
    const grade = calculateGrade(totalScore);
    const passRate = calculatePassRate(scores);
    const strengths = identifyStrengths(scores);
    const issues = identifyIssues(scores);
    return {
        promptId,
        platform,
        scores,
        totalScore,
        grade,
        passRate,
        issues,
        strengths,
        timestamp: new Date().toISOString()
    };
}
export function compareOutputs(outputs) {
    if (outputs.length < 2) {
        throw new Error('Need at least 2 outputs to compare');
    }
    const sorted = [...outputs].sort((a, b) => b.totalScore - a.totalScore);
    const winner = sorted[0];
    const runnerUp = sorted[1];
    return {
        promptId: winner.promptId,
        category: '',
        platforms: outputs,
        winner: winner.platform,
        margin: winner.totalScore - runnerUp.totalScore
    };
}
export function generateReport(results) {
    const platforms = [...new Set(results.flatMap(r => r.platforms.map(p => p.platform)))];
    const overallScores = {};
    for (const platform of platforms) {
        const platformResults = results.flatMap(r => r.platforms.filter(p => p.platform === platform));
        const wins = results.filter(r => r.winner === platform).length;
        const losses = results.length - wins;
        overallScores[platform] = {
            platform,
            averageScore: platformResults.length > 0
                ? platformResults.reduce((sum, p) => sum + p.totalScore, 0) / platformResults.length
                : 0,
            passRate: platformResults.length > 0
                ? platformResults.reduce((sum, p) => sum + p.passRate, 0) / platformResults.length
                : 0,
            wins,
            losses,
            ties: results.length - wins - losses,
            strengths: [...new Set(platformResults.flatMap(p => p.strengths))].slice(0, 5),
            weaknesses: [...new Set(platformResults.flatMap(p => p.issues))].slice(0, 5)
        };
    }
    const categories = [...new Set(results.map(r => r.category))];
    const categoryScores = {};
    for (const category of categories) {
        const categoryResults = results.filter(r => r.category === category);
        categoryScores[category] = {};
        for (const platform of platforms) {
            const platformResults = categoryResults.flatMap(r => r.platforms.filter(p => p.platform === platform));
            const wins = categoryResults.filter(r => r.winner === platform).length;
            categoryScores[category][platform] = {
                platform,
                averageScore: platformResults.length > 0
                    ? platformResults.reduce((sum, p) => sum + p.totalScore, 0) / platformResults.length
                    : 0,
                passRate: platformResults.length > 0
                    ? platformResults.reduce((sum, p) => sum + p.passRate, 0) / platformResults.length
                    : 0,
                wins,
                losses: categoryResults.length - wins,
                ties: 0,
                strengths: [],
                weaknesses: []
            };
        }
    }
    const winners = {};
    for (const category of categories) {
        const categoryScoresForCategory = categoryScores[category];
        const sorted = Object.values(categoryScoresForCategory).sort((a, b) => b.averageScore - a.averageScore);
        winners[category] = sorted[0]?.platform || 'none';
    }
    const insights = generateInsights(overallScores, categoryScores);
    return {
        totalPrompts: results.length,
        platforms,
        overallScores,
        categoryScores,
        winners,
        insights,
        timestamp: new Date().toISOString()
    };
}
function generateInsights(overallScores, categoryScores) {
    const insights = [];
    const sortedPlatforms = Object.values(overallScores).sort((a, b) => b.averageScore - a.averageScore);
    if (sortedPlatforms.length > 0) {
        insights.push(`Overall leader: ${sortedPlatforms[0].platform} (${(sortedPlatforms[0].averageScore * 100).toFixed(1)}%)`);
    }
    for (const [category, scores] of Object.entries(categoryScores)) {
        const sorted = Object.values(scores).sort((a, b) => b.averageScore - a.averageScore);
        if (sorted.length > 0) {
            insights.push(`${category} leader: ${sorted[0].platform} (${(sorted[0].averageScore * 100).toFixed(1)}%)`);
        }
    }
    for (const [platform, score] of Object.entries(overallScores)) {
        if (score.strengths.length > 0) {
            insights.push(`${platform} strengths: ${score.strengths.slice(0, 3).join(', ')}`);
        }
        if (score.weaknesses.length > 0) {
            insights.push(`${platform} weaknesses: ${score.weaknesses.slice(0, 3).join(', ')}`);
        }
    }
    return insights;
}
export function formatReport(report) {
    const lines = [];
    lines.push('='.repeat(80));
    lines.push('BENCHMARK REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Total Prompts: ${report.totalPrompts}`);
    lines.push(`Platforms: ${report.platforms.join(', ')}`);
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('OVERALL SCORES');
    lines.push('-'.repeat(80));
    lines.push('');
    lines.push('Platform          | Score  | Pass Rate | Wins | Losses | Grade');
    lines.push('-'.repeat(70));
    for (const [platform, score] of Object.entries(report.overallScores)) {
        const name = platform.padEnd(17);
        const scoreStr = (score.averageScore * 100).toFixed(1).padStart(5);
        const passStr = (score.passRate * 100).toFixed(1).padStart(9);
        const wins = score.wins.toString().padStart(4);
        const losses = score.losses.toString().padStart(7);
        const grade = calculateGrade(score.averageScore).padStart(5);
        lines.push(`${name} | ${scoreStr} | ${passStr} | ${wins} | ${losses} | ${grade}`);
    }
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('CATEGORY LEADERS');
    lines.push('-'.repeat(80));
    lines.push('');
    for (const [category, winner] of Object.entries(report.winners)) {
        lines.push(`${category}: ${winner}`);
    }
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('INSIGHTS');
    lines.push('-'.repeat(80));
    lines.push('');
    for (const insight of report.insights) {
        lines.push(`• ${insight}`);
    }
    lines.push('');
    lines.push('='.repeat(80));
    return lines.join('\n');
}
//# sourceMappingURL=scoring.js.map