import { SESClient } from '@aws-sdk/client-ses';
import { env } from './env.js';

export const sesClient = new SESClient({
  region: env.aws.region,
});
