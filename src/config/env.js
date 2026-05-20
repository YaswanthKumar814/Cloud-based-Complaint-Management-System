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
  ses: {
    /** Verified sender email in Amazon SES */
    fromEmail: process.env.SES_FROM_EMAIL || '',
    /** Admin inbox that receives complaint alerts */
    adminEmail: process.env.ADMIN_EMAIL || '',
  },
  sns: {
    /** Optional: SNS topic ARN for simple text alerts (leave empty to skip SNS) */
    topicArn: process.env.SNS_TOPIC_ARN || '',
  },
};
