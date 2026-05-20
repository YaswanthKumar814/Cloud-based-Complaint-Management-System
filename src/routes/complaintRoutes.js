import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as complaintController from '../controllers/complaintController.js';

const router = Router();

router.post('/complaints', asyncHandler(complaintController.postComplaint));
router.get('/complaints', asyncHandler(complaintController.getComplaints));
router.get('/complaints/:id', asyncHandler(complaintController.getComplaintById));
router.put('/complaints/:id/status', asyncHandler(complaintController.putComplaintStatus));

export default router;
