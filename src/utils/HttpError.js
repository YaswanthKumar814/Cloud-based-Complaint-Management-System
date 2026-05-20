/**
 * Simple HTTP error for API responses.
 * The global error handler reads `statusCode` and `message`.
 */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}
