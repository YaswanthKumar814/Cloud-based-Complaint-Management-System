import { Router } from 'express';
import * as complaintController from '../controllers/complaintController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/complaint', asyncHandler(complaintController.createComplaint));
router.get('/complaints', asyncHandler(complaintController.getComplaints));
router.put('/status', asyncHandler(complaintController.updateStatus));

export default router;
