import './config/env.js';
import { initXRay } from './config/xray.js';
import { logInfo } from './utils/logger.js';

await initXRay();

const { default: app } = await import('./app.js');
const { env } = await import('./config/env.js');

const server = app.listen(env.port, () => {
  logInfo('Complaint service started', {
    port: env.port,
    xray: process.env.ENABLE_XRAY === 'true',
    structuredLogs: process.env.STRUCTURED_LOGS === 'true' || env.nodeEnv === 'production',
  });
  console.log(`Complaint service running on http://localhost:${env.port}`);
});

function shutdown(signal) {
  logInfo('Shutting down', { signal });
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
