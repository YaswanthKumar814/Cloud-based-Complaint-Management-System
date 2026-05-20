import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { mapAwsError } from '../utils/mapAwsError.js';

const PRESIGN_EXPIRY_SECONDS = 300; // 5 minutes

function getBucketName() {
  const bucket = env.s3.bucketName?.trim();
  if (!bucket) {
    throw new HttpError(
      503,
      'S3_BUCKET_NAME is not set. Add it to your .env file.',
    );
  }
  return bucket;
}

/**
 * Public-style object URL (works if bucket/objects are public; private buckets need presigned GET later).
 */
export function buildFileUrl(bucket, fileKey) {
  const region = env.aws.region;
  return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
}

/**
 * Create a unique S3 key and a pre-signed PUT URL for direct browser/Postman upload.
 */
export async function createPresignedUploadUrl({ fileName, contentType }) {
  const bucket = getBucketName();
  const fileKey = `complaints/${randomUUID()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      fileKey,
      fileUrl: buildFileUrl(bucket, fileKey),
      expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
      contentType,
    };
  } catch (error) {
    mapAwsError(error, 'S3');
  }
}
