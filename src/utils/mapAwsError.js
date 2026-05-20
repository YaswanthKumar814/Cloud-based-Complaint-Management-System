import { HttpError } from './HttpError.js';

/**
 * Turns common AWS SDK errors into clear HTTP errors for API clients.
 */
export function mapAwsError(error, context = 'AWS') {
  const msg = error?.message ?? '';

  if (
    error?.name === 'CredentialsProviderError' ||
    msg.includes('Could not load credentials')
  ) {
    throw new HttpError(
      401,
      'AWS credentials are missing. For Docker: pass keys or mount ~/.aws. For local dev: use npm run dev with credentials configured.',
    );
  }
  if (error?.name === 'NoSuchBucket') {
    throw new HttpError(503, `S3 bucket not found. Check S3_BUCKET_NAME and AWS_REGION.`);
  }
  if (error?.name === 'ResourceNotFoundException') {
    throw new HttpError(503, `${context} resource was not found. Check table/bucket name and region.`);
  }
  if (
    error?.name === 'UnrecognizedClientException' ||
    error?.name === 'InvalidSignatureException'
  ) {
    throw new HttpError(401, 'AWS credentials are invalid or missing.');
  }
  if (error?.name === 'AccessDeniedException') {
    throw new HttpError(403, `Access denied for ${context}. Check IAM permissions.`);
  }
  throw error;
}
