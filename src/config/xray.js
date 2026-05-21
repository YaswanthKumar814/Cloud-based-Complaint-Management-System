import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SEGMENT_NAME = process.env.AWS_XRAY_TRACING_NAME || 'complaint-service';

let AWSXRay = null;
let enabled = false;

export function isXRayEnabled() {
  return process.env.ENABLE_XRAY === 'true';
}

/**
 * Load AWS X-Ray SDK (optional). Safe to skip locally if ENABLE_XRAY is not set.
 */
export async function initXRay() {
  if (!isXRayEnabled()) {
    console.log('[xray] Disabled — set ENABLE_XRAY=true to trace requests');
    return;
  }

  try {
    AWSXRay = require('aws-xray-sdk');
    enabled = true;
    console.log(`[xray] Enabled — segment name: ${SEGMENT_NAME}`);
  } catch (error) {
    console.warn('[xray] SDK not loaded:', error.message);
  }
}

export function openSegmentMiddleware() {
  if (!enabled || !AWSXRay) {
    return (_req, _res, next) => next();
  }
  return AWSXRay.express.openSegment(SEGMENT_NAME);
}

export function closeSegmentMiddleware() {
  if (!enabled || !AWSXRay) {
    return (_req, _res, next) => next();
  }
  return AWSXRay.express.closeSegment();
}

/**
 * Wrap async work in an X-Ray subsegment (e.g. call to notification-service).
 */
export async function captureAsync(subsegmentName, fn) {
  if (!enabled || !AWSXRay) {
    return fn();
  }

  const segment = AWSXRay.getSegment();
  if (!segment) {
    return fn();
  }

  const sub = segment.addNewSubsegment(subsegmentName);
  sub.addAnnotation('service', 'notification-service');

  try {
    return await fn();
  } catch (error) {
    sub.addError(error);
    throw error;
  } finally {
    sub.close();
  }
}
