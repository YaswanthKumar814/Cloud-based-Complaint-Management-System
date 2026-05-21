import * as uploadService from '../services/uploadService.js';
import { parsePresignedUrlBody } from '../utils/uploadValidation.js';

export async function postPresignedUrl(req, res) {
  const { fileName, contentType } = parsePresignedUrlBody(req.body);
  const result = await uploadService.createPresignedUploadUrl({ fileName, contentType });
  res.status(200).json({ success: true, data: result });
}

/** GET /api/uploads/download-url?fileKey=complaints/... */
export async function getPresignedDownloadUrl(req, res) {
  const fileKey = typeof req.query.fileKey === 'string' ? req.query.fileKey.trim() : '';
  const result = await uploadService.createPresignedDownloadUrl(fileKey);
  res.status(200).json({ success: true, data: result });
}
