import { HttpError } from './HttpError.js';
import { requireString } from './stringValidation.js';

/** Allowed MIME types for complaint attachments */
export const ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
];

const EXTENSION_BY_TYPE = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

export function parsePresignedUrlBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be JSON with fileName and contentType.');
  }

  const fileName = requireString(body.fileName, 'fileName');
  const contentType = requireString(body.contentType, 'contentType').toLowerCase();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new HttpError(
      400,
      `Unsupported contentType. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
    );
  }

  const lowerName = fileName.toLowerCase();
  const allowedExts = EXTENSION_BY_TYPE[contentType];
  const hasValidExt = allowedExts.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    throw new HttpError(
      400,
      `fileName extension must match contentType (e.g. ${allowedExts.join(' or ')} for ${contentType})`,
    );
  }

  // Safe filename: letters, numbers, dots, dashes, underscores only
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeName || safeName === '.' || safeName === '..') {
    throw new HttpError(400, 'fileName is not valid after sanitization');
  }

  return { fileName: safeName, contentType };
}

export function parseOptionalFileFields(body) {
  const fileUrl = body.fileUrl != null && body.fileUrl !== ''
    ? requireString(body.fileUrl, 'fileUrl')
    : undefined;
  const fileKey = body.fileKey != null && body.fileKey !== ''
    ? requireString(body.fileKey, 'fileKey')
    : undefined;

  if ((fileUrl && !fileKey) || (!fileUrl && fileKey)) {
    throw new HttpError(400, 'fileUrl and fileKey must both be provided together, or omitted.');
  }

  if (fileKey && !fileKey.startsWith('complaints/')) {
    throw new HttpError(400, 'fileKey must start with "complaints/" (from presigned-url API).');
  }

  return { fileUrl, fileKey };
}
