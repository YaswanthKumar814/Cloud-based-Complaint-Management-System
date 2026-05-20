import { HttpError } from './HttpError.js';

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
