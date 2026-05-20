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
};
