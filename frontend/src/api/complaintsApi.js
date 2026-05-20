import { getApiBaseUrl, parseApiResponse } from './client.js';

/**
 * GET /api/complaints — all complaints (admin).
 * GET /api/complaints?userEmail=... — only that user's complaints.
 */
export async function fetchComplaints({ userEmail } = {}) {
  let url = `${getApiBaseUrl()}/api/complaints`;
  if (userEmail) {
    url += `?userEmail=${encodeURIComponent(userEmail)}`;
  }
  const response = await fetch(url);
  const json = await parseApiResponse(response);
  return json.data ?? [];
}

/**
 * POST /api/complaints — create complaint (includes userEmail from Cognito).
 */
export async function createComplaint(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseApiResponse(response);
  return json.data;
}

/**
 * PUT /api/complaints/:id/status — admin status update only.
 */
export async function updateComplaintStatus(complaintId, status) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/complaints/${complaintId}/status`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
  const json = await parseApiResponse(response);
  return json.data;
}
