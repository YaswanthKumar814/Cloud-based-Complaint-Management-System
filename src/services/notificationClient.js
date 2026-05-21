import { env } from '../config/env.js';

/**
 * HTTP client — calls the Notification Service microservice.
 * Best-effort: never throws; logs errors only.
 */
function getBaseUrl() {
  return (env.notification.serviceUrl || '').replace(/\/$/, '');
}

async function post(path, body) {
  const base = getBaseUrl();
  if (!base) {
    console.warn(
      '[notification] Skipped — set NOTIFICATION_SERVICE_URL (e.g. http://localhost:5001)',
    );
    return;
  }

  const url = `${base}${path}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[notification] HTTP', res.status, text.slice(0, 200));
      return;
    }

    console.log('[notification] Sent via notification-service:', path);
  } catch (error) {
    console.error('[notification] Request failed:', error.message);
  }
}

export async function notifyComplaintCreated(complaint) {
  await post('/api/notifications/complaint-created', { complaint });
}

export async function notifyStatusUpdated(complaint) {
  await post('/api/notifications/status-updated', { complaint });
}
