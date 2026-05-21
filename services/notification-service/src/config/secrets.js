import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { logInfo, logWarn } from '../utils/logger.js';

const DEFAULT_SECRET_ID = 'complaint-management/notification';

/**
 * Load SES/admin emails from AWS Secrets Manager, with .env fallback.
 * Secret JSON format:
 * { "SES_FROM_EMAIL": "...", "ADMIN_EMAIL": "...", "SNS_TOPIC_ARN": "..." }
 */
export async function loadNotificationSecrets(env) {
  const fromEnv = {
    sesFromEmail: env.ses.fromEmail,
    adminEmail: env.ses.adminEmail,
    snsTopicArn: env.sns.topicArn,
    source: 'env',
  };

  if (process.env.USE_SECRETS_MANAGER === 'false') {
    logInfo('Secrets Manager skipped (USE_SECRETS_MANAGER=false)', { source: 'env' });
    return fromEnv;
  }

  const secretId = process.env.NOTIFICATION_SECRET_NAME || DEFAULT_SECRET_ID;
  const region = env.aws.region;

  try {
    const client = new SecretsManagerClient({ region });
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretId }),
    );

    const parsed = JSON.parse(response.SecretString || '{}');

    const loaded = {
      sesFromEmail: parsed.SES_FROM_EMAIL || fromEnv.sesFromEmail,
      adminEmail: parsed.ADMIN_EMAIL || fromEnv.adminEmail,
      snsTopicArn: parsed.SNS_TOPIC_ARN || fromEnv.snsTopicArn,
      source: 'secrets-manager',
      secretId,
    };

    logInfo('Loaded configuration from Secrets Manager', {
      secretId,
      source: loaded.source,
    });

    return loaded;
  } catch (error) {
    logWarn('Secrets Manager unavailable — using .env fallback', {
      secretId,
      error: error.name,
      message: error.message,
    });
    return fromEnv;
  }
}

/**
 * Apply loaded secrets onto the shared env object (mutates env.ses / env.sns).
 */
export function applyNotificationSecrets(env, secrets) {
  if (secrets.sesFromEmail) {
    env.ses.fromEmail = secrets.sesFromEmail;
  }
  if (secrets.adminEmail) {
    env.ses.adminEmail = secrets.adminEmail;
  }
  if (secrets.snsTopicArn) {
    env.sns.topicArn = secrets.snsTopicArn;
  }
  env.secretsSource = secrets.source;
}
