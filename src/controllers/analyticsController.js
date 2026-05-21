import * as lambdaAnalyticsService from '../services/lambdaAnalyticsService.js';

/**
 * GET /api/analytics/summary — invokes complaint-stats Lambda (Phase 17).
 * Does not change existing complaint CRUD routes.
 */
export async function getAnalyticsSummary(req, res) {
  const stats = await lambdaAnalyticsService.getComplaintStatsFromLambda();
  res.status(200).json({
    success: true,
    source: 'aws-lambda',
    functionName: process.env.LAMBDA_STATS_FUNCTION || 'complaint-stats-lambda',
    data: stats,
  });
}
