const SERVICE = process.env.SERVICE_NAME || 'complaint-service';

function useStructured() {
  return (
    process.env.STRUCTURED_LOGS === 'true' || process.env.NODE_ENV === 'production'
  );
}

/**
 * Structured JSON logs (stdout) — EKS/Docker forward these to CloudWatch when logging is enabled.
 */
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

export function logError(message, meta = {}) {
  if (useStructured()) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: SERVICE,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  } else {
    console.error(`[${SERVICE}] ${message}`, Object.keys(meta).length ? meta : '');
  }
}
