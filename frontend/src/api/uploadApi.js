import { getApiBaseUrl, parseApiResponse } from './client.js';

/**
 * Step 1 of S3 upload: get pre-signed PUT URL from backend.
 */
export async function getPresignedUploadUrl(fileName, contentType) {
  const response = await fetch(`${getApiBaseUrl()}/api/uploads/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, contentType }),
  });
  const json = await parseApiResponse(response);
  return json.data;
}

/**
 * Step 2: upload file directly to S3 using the pre-signed URL.
 */
export async function uploadFileToS3(uploadUrl, file, contentType) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`S3 upload failed (${response.status})`);
  }
}
