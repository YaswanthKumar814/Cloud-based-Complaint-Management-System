import { AppError } from './AppError.js';

export const COMPLAINT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required and must be a non-empty string`, 400);
  }
  return value.trim();
}

export function assertValidStatus(status) {
  const normalized = assertNonEmptyString(status, 'status').toLowerCase();
  if (!COMPLAINT_STATUSES.includes(normalized)) {
    throw new AppError(
      `Invalid status. Allowed values: ${COMPLAINT_STATUSES.join(', ')}`,
      400,
    );
  }
  return normalized;
}

export function parseLimit(raw, defaultLimit = 50, maxLimit = 100) {
  if (raw === undefined || raw === null || raw === '') {
    return defaultLimit;
  }
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('limit must be a positive integer', 400);
  }
  return Math.min(limit, maxLimit);
}
