import './config/env.js';
import { env } from './config/env.js';
import {
  loadNotificationSecrets,
  applyNotificationSecrets,
} from './config/secrets.js';
import { logInfo } from './utils/logger.js';

const secrets = await loadNotificationSecrets(env);
applyNotificationSecrets(env, secrets);

const { default: app } = await import('./app.js');

const server = app.listen(env.port, () => {
  logInfo('Notification service started', {
    port: env.port,
    secretsSource: env.secretsSource || 'env',
    structuredLogs: process.env.STRUCTURED_LOGS === 'true' || env.nodeEnv === 'production',
  });
  console.log(`Notification service running on http://localhost:${env.port}`);
});

function shutdown(signal) {
  logInfo('Shutting down', { signal });
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
