import { ComprehendClient } from '@aws-sdk/client-comprehend';
import { env } from './env.js';

/**
 * Shared Amazon Comprehend client (same region + credentials as DynamoDB/S3).
 */
export const comprehendClient = new ComprehendClient({
  region: env.aws.region,
});
