import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    /** Region for DynamoDB (e.g. ap-south-1). Uses default credential chain if keys are omitted. */
    region: process.env.AWS_REGION || 'ap-south-1',
  },
  dynamodb: {
    /** Table name must match your AWS table (partition key: complaintId). */
    tableName: process.env.DYNAMODB_TABLE || 'Complaints',
  },
  s3: {
    /** S3 bucket for complaint attachments (pre-signed uploads). */
    bucketName: process.env.S3_BUCKET_NAME || '',
  },
  notification: {
    /** Base URL of Notification Service (local: http://localhost:5001, K8s: http://notification-service:5001) */
    serviceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5001',
  },
  lambda: {
    /** Phase 17 — complaint-stats Lambda function name (empty = analytics endpoint returns 503) */
    statsFunctionName: process.env.LAMBDA_STATS_FUNCTION?.trim() || '',
  },
};
