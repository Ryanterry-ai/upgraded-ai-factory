// Phase 8: Intelligence CLI Command

import {
  createPatternLearningEngine,
  createTemplateRankingSystem,
  createFactoryAnalytics,
  createFeedbackCollector,
  createBlueprintOptimizer,
  createComponentRankingSystem,
  createQualityPredictor,
  createPatternPromoter
} from '../intelligence/index.js';

interface IntelligenceOptions {
  command: string;
  factory?: string;
  verbose?: boolean;
}

export async function intelligenceCommand(options: IntelligenceOptions): Promise<void> {
  console.log('Phase 8: Self-Improving Factory Intelligence');
  console.log('='.repeat(50));

  const { command, factory, verbose } = options;

  switch (command) {
    case 'stats':
      await showStats(factory);
      break;

    case 'leaderboard':
      await showLeaderboard(factory);
      break;

    case 'patterns':
      await showPatterns(factory);
      break;

    case 'templates':
      await showTemplates(factory);
      break;

    case 'insights':
      await showInsights(factory);
      break;

    case 'predict':
      await showPrediction(factory);
      break;

    case 'promote':
      await promotePatterns();
      break;

    case 'demo':
      await runDemo(factory);
      break;

    default:
      printUsage();
  }
}

async function showStats(factory?: string): Promise<void> {
  console.log('Intelligence Statistics');
  console.log('-'.repeat(30));

  const patternEngine = createPatternLearningEngine();
  const templateRanking = createTemplateRankingSystem();
  const analytics = createFactoryAnalytics();
  const feedback = createFeedbackCollector();
  const componentRanking = createComponentRankingSystem();
  const predictor = createQualityPredictor();
  const promoter = createPatternPromoter();

  const patternStats = patternEngine.getStats();
  const templateStats = templateRanking.getStats();
  const analyticsStats = analytics.getStats();
  const feedbackStats = feedback.getFeedbackStats();
  const componentStats = componentRanking.getStats();
  const predictorStats = predictor.getStats();
  const promoterStats = promoter.getStats();

  console.log('');
  console.log('Pattern Learning:');
  console.log(`  Total Patterns: ${patternStats.totalPatterns}`);
  console.log(`  Average Score: ${(patternStats.averageScore * 100).toFixed(1)}%`);
  console.log(`  Average Success Rate: ${(patternStats.averageSuccessRate * 100).toFixed(1)}%`);

  console.log('');
  console.log('Template Ranking:');
  console.log(`  Total Templates: ${templateStats.totalTemplates}`);
  console.log(`  Average Score: ${(templateStats.averageScore * 100).toFixed(1)}%`);
  console.log(`  Average Quality: ${(templateStats.averageQuality * 100).toFixed(1)}%`);

  console.log('');
  console.log('Factory Analytics:');
  console.log(`  Total Factories: ${analyticsStats.totalFactories}`);
  console.log(`  Total Generations: ${analyticsStats.totalGenerations}`);
  console.log(`  Overall Success Rate: ${(analyticsStats.overallSuccessRate * 100).toFixed(1)}%`);
  console.log(`  Overall Quality: ${(analyticsStats.overallQuality * 100).toFixed(1)}%`);
  console.log(`  Top Factory: ${analyticsStats.topFactory}`);
  console.log(`  Bottom Factory: ${analyticsStats.bottomFactory}`);

  console.log('');
  console.log('Feedback:');
  console.log(`  Total Feedback: ${feedbackStats.totalFeedback}`);
  console.log(`  Average Rating: ${feedbackStats.averageRating.toFixed(1)}/5`);
  console.log(`  Approval Rate: ${(feedbackStats.approvalRate * 100).toFixed(1)}%`);

  console.log('');
  console.log('Component Ranking:');
  console.log(`  Total Components: ${componentStats.totalComponents}`);
  console.log(`  Average Score: ${(componentStats.averageScore * 100).toFixed(1)}%`);
  console.log(`  Average Quality: ${(componentStats.averageQuality * 100).toFixed(1)}%`);

  console.log('');
  console.log('Quality Prediction:');
  console.log(`  Total Models: ${predictorStats.totalModels}`);
  console.log(`  Average Accuracy: ${(predictorStats.averageAccuracy * 100).toFixed(1)}%`);
  console.log(`  Historical Generations: ${predictorStats.totalHistoricalGenerations}`);

  console.log('');
  console.log('Pattern Promotion:');
  console.log(`  Total Promotions: ${promoterStats.totalPromotions}`);
  console.log(`  Total Demotions: ${promoterStats.totalDemotions}`);
}

async function showLeaderboard(factory?: string): Promise<void> {
  console.log('Factory Leaderboard');
  console.log('-'.repeat(30));

  const analytics = createFactoryAnalytics();
  const leaderboard = analytics.getLeaderboard();

  console.log('');
  console.log('Rank | Factory          | Score | Tier    | Success Rate | Quality');
  console.log('-'.repeat(70));

  for (const entry of leaderboard) {
    const rank = entry.rank.toString().padStart(4);
    const name = entry.name.padEnd(16);
    const score = (entry.score * 100).toFixed(1).padStart(5);
    const tier = entry.tier.padEnd(7);
    const successRate = (entry.metrics.successRate * 100).toFixed(1).padStart(12);
    const quality = (entry.metrics.qualityScore * 100).toFixed(1);

    console.log(`${rank} | ${name} | ${score} | ${tier} | ${successRate} | ${quality}`);
  }
}

async function showPatterns(factory?: string): Promise<void> {
  console.log('Pattern Leaderboard');
  console.log('-'.repeat(30));

  const patternEngine = createPatternLearningEngine();
  const topPatterns = patternEngine.getTopPatterns(10);

  if (topPatterns.length === 0) {
    console.log('No patterns found. Run some generations first.');
    return;
  }

  console.log('');
  console.log('Rank | Pattern                    | Type          | Score | Tier    | Success Rate');
  console.log('-'.repeat(80));

  topPatterns.forEach((pattern, index) => {
    const rank = (index + 1).toString().padStart(4);
    const name = pattern.name.substring(0, 24).padEnd(26);
    const type = pattern.type.padEnd(13);
    const score = (pattern.ranking.score * 100).toFixed(1).padStart(5);
    const tier = pattern.ranking.tier.padEnd(7);
    const successRate = (pattern.ranking.successRate * 100).toFixed(1);

    console.log(`${rank} | ${name} | ${type} | ${score} | ${tier} | ${successRate}`);
  });
}

async function showTemplates(factory?: string): Promise<void> {
  console.log('Template Leaderboard');
  console.log('-'.repeat(30));

  const templateRanking = createTemplateRankingSystem();
  const leaderboard = templateRanking.getLeaderboard(10);

  if (leaderboard.length === 0) {
    console.log('No templates found. Run some generations first.');
    return;
  }

  console.log('');
  console.log('Rank | Template                   | Factory       | Score | Tier    | Usage');
  console.log('-'.repeat(80));

  leaderboard.forEach((entry) => {
    const rank = entry.rank.toString().padStart(4);
    const name = entry.template.name.substring(0, 24).padEnd(26);
    const factoryName = entry.template.factory.padEnd(13);
    const score = (entry.score.score * 100).toFixed(1).padStart(5);
    const tier = entry.template.ranking.tier.padEnd(7);
    const usage = entry.template.ranking.usageFrequency.toString();

    console.log(`${rank} | ${name} | ${factoryName} | ${score} | ${tier} | ${usage}`);
  });
}

async function showInsights(factory?: string): Promise<void> {
  console.log('Factory Insights');
  console.log('-'.repeat(30));

  const analytics = createFactoryAnalytics();
  const factories = factory ? [factory] : ['website', 'ecommerce', 'saas', 'admin', 'dashboard', 'agent', 'tools'];

  for (const factoryType of factories) {
    const insights = await analytics.generateInsights(factoryType);

    if (insights.length > 0) {
      console.log('');
      console.log(`${factoryType.charAt(0).toUpperCase() + factoryType.slice(1)}:`);

      for (const insight of insights) {
        const icon = insight.impact === 'positive' ? '+' : insight.impact === 'negative' ? '-' : '~';
        console.log(`  [${icon}] ${insight.insight}`);
        console.log(`      Recommendation: ${insight.recommendation}`);
      }
    }
  }
}

async function showPrediction(factory?: string): Promise<void> {
  console.log('Quality Prediction');
  console.log('-'.repeat(30));

  const predictor = createQualityPredictor();
  const stats = predictor.getStats();

  console.log('');
  console.log('Prediction Models:');
  console.log(`  Total Models: ${stats.totalModels}`);
  console.log(`  Average Accuracy: ${(stats.averageAccuracy * 100).toFixed(1)}%`);
  console.log(`  Historical Generations: ${stats.totalHistoricalGenerations}`);

  const factoryTypes = ['website', 'ecommerce', 'saas'];
  console.log('');
  console.log('Factory Predictions:');

  for (const factoryType of factoryTypes) {
    const model = predictor.getModel(factoryType);
    if (model) {
      console.log(`  ${factoryType}:`);
      console.log(`    Accuracy: ${(model.accuracy * 100).toFixed(1)}%`);
      console.log(`    Bias: ${model.bias.toFixed(3)}`);
    }
  }
}

async function promotePatterns(): Promise<void> {
  console.log('Pattern Promotion');
  console.log('-'.repeat(30));

  const promoter = createPatternPromoter();
  const stats = promoter.getStats();

  console.log('');
  console.log('Promotion Statistics:');
  console.log(`  Total Promotions: ${stats.totalPromotions}`);
  console.log(`  Total Demotions: ${stats.totalDemotions}`);

  if (Object.keys(stats.promotionsByTier).length > 0) {
    console.log('');
    console.log('Promotions by Tier:');
    for (const [tier, count] of Object.entries(stats.promotionsByTier)) {
      console.log(`  ${tier}: ${count}`);
    }
  }

  if (Object.keys(stats.demotionsByTier).length > 0) {
    console.log('');
    console.log('Demotions by Tier:');
    for (const [tier, count] of Object.entries(stats.demotionsByTier)) {
      console.log(`  ${tier}: ${count}`);
    }
  }
}

async function runDemo(factory?: string): Promise<void> {
  console.log('Running Intelligence Demo');
  console.log('-'.repeat(30));

  const factoryType = factory || 'website';

  console.log('');
  console.log(`Factory: ${factoryType}`);
  console.log('');

  console.log('1. Creating pattern learning engine...');
  const patternEngine = createPatternLearningEngine();
  console.log('   Done');

  console.log('2. Creating template ranking system...');
  const templateRanking = createTemplateRankingSystem();
  console.log('   Done');

  console.log('3. Creating factory analytics...');
  const analytics = createFactoryAnalytics();
  console.log('   Done');

  console.log('4. Creating feedback collector...');
  const feedback = createFeedbackCollector();
  console.log('   Done');

  console.log('5. Creating blueprint optimizer...');
  const optimizer = createBlueprintOptimizer();
  console.log('   Done');

  console.log('6. Creating component ranking system...');
  const componentRanking = createComponentRankingSystem();
  console.log('   Done');

  console.log('7. Creating quality predictor...');
  const predictor = createQualityPredictor();
  console.log('   Done');

  console.log('8. Creating pattern promoter...');
  const promoter = createPatternPromoter();
  console.log('   Done');

  console.log('');
  console.log('Demo complete! All intelligence systems initialized.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run generations to collect data');
  console.log('  2. Submit feedback to improve patterns');
  console.log('  3. Check leaderboard for top performers');
  console.log('  4. Review insights for improvement recommendations');
}

function printUsage(): void {
  console.log('Usage: intelligence <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  stats           Show intelligence statistics');
  console.log('  leaderboard     Show factory leaderboard');
  console.log('  patterns        Show pattern leaderboard');
  console.log('  templates       Show template leaderboard');
  console.log('  insights        Show factory insights');
  console.log('  predict         Show quality predictions');
  console.log('  promote         Promote/demote patterns');
  console.log('  demo            Run intelligence demo');
  console.log('');
  console.log('Options:');
  console.log('  --factory <type>    Filter by factory type');
  console.log('  --verbose           Enable verbose output');
  console.log('');
  console.log('Examples:');
  console.log('  intelligence stats');
  console.log('  intelligence leaderboard --factory website');
  console.log('  intelligence patterns');
  console.log('  intelligence demo --factory ecommerce');
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

const args = process.argv.slice(2);
const options: IntelligenceOptions = {
  command: 'stats',
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--factory':
      options.factory = args[++i];
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    default:
      if (!args[i].startsWith('--')) {
        options.command = args[i];
      }
      break;
  }
}

intelligenceCommand(options).catch(console.error);
