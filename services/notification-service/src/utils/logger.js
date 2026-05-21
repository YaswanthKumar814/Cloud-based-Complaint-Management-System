const SERVICE = process.env.SERVICE_NAME || 'notification-service';

function useStructured() {
  return (
    process.env.STRUCTURED_LOGS === 'true' || process.env.NODE_ENV === 'production'
  );
}

export function logInfo(message, meta = {}) {
  if (useStructured()) {
    console.log(
      JSON.stringify({
        level: 'info',
        service: SERVICE,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  } else {
    console.log(`[${SERVICE}] ${message}`, Object.keys(meta).length ? meta : '');
  }
}

export function logWarn(message, meta = {}) {
  if (useStructured()) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        service: SERVICE,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  } else {
    console.warn(`[${SERVICE}] ${message}`, Object.keys(meta).length ? meta : '');
  }
}
