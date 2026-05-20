import { getApiBaseUrl, parseApiResponse } from './client.js';

/**
 * GET /api/complaints — list all complaints.
 */
export async function fetchComplaints() {
  const response = await fetch(`${getApiBaseUrl()}/api/complaints`);
  const json = await parseApiResponse(response);
  return json.data ?? [];
}

/**
 * PUT /api/complaints/:id/status — update status.
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
