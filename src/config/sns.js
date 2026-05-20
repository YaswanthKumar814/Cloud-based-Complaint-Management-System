import { SNSClient } from '@aws-sdk/client-sns';
import { env } from './env.js';

/**
 * Amazon SNS client — optional text notifications to a topic.
 */
export const snsClient = new SNSClient({
  region: env.aws.region,
});
