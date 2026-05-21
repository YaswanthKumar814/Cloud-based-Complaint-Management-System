import { env } from '../config/env.js';
import { captureAsync } from '../config/xray.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';

function getBaseUrl() {
  return (env.notification.serviceUrl || '').replace(/\/$/, '');
}

async function post(path, body) {
  const base = getBaseUrl();
  if (!base) {
    logWarn('Notification call skipped — NOTIFICATION_SERVICE_URL not set');
    return;
  }

  const url = `${base}${path}`;

  await captureAsync('notification-service', async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        logError('Notification HTTP error', { status: res.status, path, detail: text.slice(0, 200) });
        return;
      }

      logInfo('Notification request sent', { path });
    } catch (error) {
      logError('Notification request failed', { path, error: error.message });
    }
  });
}

export async function notifyComplaintCreated(complaint) {
  await post('/api/notifications/complaint-created', { complaint });
}

export async function notifyStatusUpdated(complaint) {
  await post('/api/notifications/status-updated', { complaint });
}
