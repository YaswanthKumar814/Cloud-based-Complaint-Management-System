import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * Shared S3 client — uses the same region and credential chain as DynamoDB.
 */
export const s3Client = new S3Client({
  region: env.aws.region,
});
