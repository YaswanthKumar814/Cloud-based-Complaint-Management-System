import * as uploadService from '../services/uploadService.js';
import { parsePresignedUrlBody } from '../utils/uploadValidation.js';

export async function postPresignedUrl(req, res) {
  const { fileName, contentType } = parsePresignedUrlBody(req.body);
  const result = await uploadService.createPresignedUploadUrl({ fileName, contentType });
  res.status(200).json({ success: true, data: result });
}
