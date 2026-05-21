import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = Router();

router.get('/analytics/summary', asyncHandler(analyticsController.getAnalyticsSummary));

export default router;
