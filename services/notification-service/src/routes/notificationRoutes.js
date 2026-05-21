import { Router } from 'express';
import {
  postComplaintCreated,
  postStatusUpdated,
} from '../controllers/notificationController.js';

const router = Router();

router.post('/notifications/complaint-created', postComplaintCreated);
router.post('/notifications/status-updated', postStatusUpdated);

export default router;
