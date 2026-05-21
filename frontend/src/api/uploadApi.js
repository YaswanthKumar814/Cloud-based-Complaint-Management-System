import { getApiBaseUrl, parseApiResponse } from './client.js';

/**
 * Step 1: get pre-signed PUT URL from your Express backend.
 */
export async function getPresignedUploadUrl(fileName, contentType) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/uploads/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contentType }),
    });
    const json = await parseApiResponse(response);
    return json.data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error(
        'Cannot reach backend for upload URL. Is the API running on port 5000? (npm run dev in project root)',
      );
    }
    throw err;
  }
}

/**
 * Step 2: PUT file directly to S3 using the pre-signed URL.
 * Requires S3 bucket CORS to allow http://localhost:5173 (browser only).
 */
export async function uploadFileToS3(uploadUrl, file, contentType) {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    });

    if (!response.ok) {
      const hint =
        response.status === 403
          ? ' (signature or Content-Type mismatch — retry with a fresh upload)'
          : '';
      throw new Error(`S3 upload failed (HTTP ${response.status})${hint}`);
    }
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        'Browser blocked S3 upload. Add CORS on your S3 bucket for http://localhost:5173. ' +
          'See docs/S3_UPLOAD.md section "Fix browser Failed to fetch".',
      );
    }
    throw err;
  }
}

/**
 * Get a temporary link to VIEW a private file in S3 (fixes Access Denied on direct fileUrl).
 */
export async function getPresignedDownloadUrl(fileKey) {
  const params = new URLSearchParams({ fileKey });
  const response = await fetch(
    `${getApiBaseUrl()}/api/uploads/download-url?${params.toString()}`,
  );
  const json = await parseApiResponse(response);
  return json.data.downloadUrl;
}
