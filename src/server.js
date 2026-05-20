import './config/env.js';
import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`Complaint service running on http://localhost:${env.port}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
