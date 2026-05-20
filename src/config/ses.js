import { SESClient } from '@aws-sdk/client-ses';
import { env } from './env.js';

/**
 * Amazon SES client — sends email notifications.
 */
export const sesClient = new SESClient({
  region: env.aws.region,
});
