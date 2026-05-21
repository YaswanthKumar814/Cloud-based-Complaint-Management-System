import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
  },
  ses: {
    fromEmail: process.env.SES_FROM_EMAIL || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
  },
  sns: {
    topicArn: process.env.SNS_TOPIC_ARN || '',
  },
  /** Set at runtime: 'secrets-manager' or 'env' */
  secretsSource: 'env',
};
