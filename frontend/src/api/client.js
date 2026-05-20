/**
 * Backend API base URL (Express server).
 * Set VITE_API_URL in frontend/.env — default http://localhost:5000
 */
export function getApiBaseUrl() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.replace(/\/$/, '');
}

/**
 * Parse JSON API response. Throws a clear Error on failure.
 */
export async function parseApiResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}
