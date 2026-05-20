import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

/**
 * Low-level AWS client (binary DynamoDB wire format).
 */
const client = new DynamoDBClient({
  region: env.aws.region,
});

/**
 * Document client: reads/writes plain JavaScript objects (strings, numbers, etc.)
 * instead of DynamoDB AttributeValue maps. Easier for beginners.
 */
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
