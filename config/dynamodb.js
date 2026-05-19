import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const clientConfig = {
  region: env.aws.region,
};

if (env.aws.accessKeyId && env.aws.secretAccessKey) {
  clientConfig.credentials = {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  };
}

if (env.aws.dynamodbEndpoint) {
  clientConfig.endpoint = env.aws.dynamodbEndpoint;
}

const baseClient = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});
