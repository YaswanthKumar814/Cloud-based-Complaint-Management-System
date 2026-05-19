import dotenv from 'dotenv';

dotenv.config();

const required = ['DYNAMODB_TABLE_NAME'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT,
  },
  dynamodb: {
    tableName: process.env.DYNAMODB_TABLE_NAME,
  },
};

export const isProduction = env.nodeEnv === 'production';
