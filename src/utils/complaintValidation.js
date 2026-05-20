import { HttpError } from './HttpError.js';

/** Allowed status values when updating a complaint */
export const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

export function requireString(value, fieldName, { optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return undefined;
    }
    throw new HttpError(400, `${fieldName} is required`);
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpError(400, `${fieldName} cannot be empty`);
  }
  return trimmed;
}

export function parseCreateComplaintBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(
      400,
      'Request body must be JSON. In Postman: Body → raw → JSON (not form-data or none).',
    );
  }
  if (Object.keys(body).length === 0) {
    throw new HttpError(
      400,
      'Request body is empty. Send JSON with "title" and "description" (and optional "category").',
    );
  }
  return {
    title: requireString(body.title, 'title'),
    description: requireString(body.description, 'description'),
    category: requireString(body.category, 'category', { optional: true }),
  };
}

export function parseStatusUpdateBody(body) {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Request body must be JSON');
  }
  const raw = requireString(body.status, 'status');
  const match = ALLOWED_STATUSES.find((s) => s.toLowerCase() === raw.toLowerCase());
  if (!match) {
    throw new HttpError(
      400,
      `Invalid status. Use one of: ${ALLOWED_STATUSES.join(', ')}`,
    );
  }
  return match;
}
