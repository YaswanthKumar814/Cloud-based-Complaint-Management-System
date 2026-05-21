import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();

router.post('/uploads/presigned-url', asyncHandler(uploadController.postPresignedUrl));
router.get('/uploads/download-url', asyncHandler(uploadController.getPresignedDownloadUrl));

export default router;
