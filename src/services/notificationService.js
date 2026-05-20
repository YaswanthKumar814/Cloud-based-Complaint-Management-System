import { SendEmailCommand } from '@aws-sdk/client-ses';
import { PublishCommand } from '@aws-sdk/client-sns';
import { sesClient } from '../config/ses.js';
import { snsClient } from '../config/sns.js';
import { env } from '../config/env.js';

function isEmailConfigured() {
  return Boolean(env.ses.fromEmail && env.ses.adminEmail);
}

function formatComplaintDetails(complaint) {
  const phrases = Array.isArray(complaint.keyPhrases)
    ? complaint.keyPhrases.join(', ')
    : '—';

  return `
Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
Status: ${complaint.status}
AI Category: ${complaint.aiCategory ?? '—'}
Priority: ${complaint.priority ?? '—'}
User Category: ${complaint.category ?? '—'}
Sentiment: ${complaint.sentiment ?? '—'}
Key Phrases: ${phrases}
Description: ${complaint.description}
`.trim();
}

/**
 * Send email via SES. Never throws — logs errors only.
 */
async function sendEmail(subject, bodyText) {
  if (!isEmailConfigured()) {
    console.warn(
      '[notification] Email skipped — set SES_FROM_EMAIL and ADMIN_EMAIL in .env',
    );
    return false;
  }

  try {
    await sesClient.send(
      new SendEmailCommand({
        Source: env.ses.fromEmail,
        Destination: {
          ToAddresses: [env.ses.adminEmail],
        },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: bodyText, Charset: 'UTF-8' },
          },
        },
      }),
    );
    console.log('[notification] Email sent:', subject);
    return true;
  } catch (error) {
    console.error('[notification] SES email failed:', error.name, error.message);
    return false;
  }
}

/**
 * Optional SNS text message. Never throws.
 */
async function publishSns(message) {
  if (!env.sns.topicArn) {
    return false;
  }

  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: env.sns.topicArn,
        Message: message,
        Subject: 'Complaint Alert',
      }),
    );
    console.log('[notification] SNS message published');
    return true;
  } catch (error) {
    console.error('[notification] SNS publish failed:', error.name, error.message);
    return false;
  }
}

/**
 * Called after POST /api/complaints succeeds.
 */
export async function notifyComplaintCreated(complaint) {
  const subject = `[New Complaint] ${complaint.title}`;
  const body = `A new complaint was submitted.\n\n${formatComplaintDetails(complaint)}`;

  await sendEmail(subject, body);
  await publishSns(`New complaint: ${complaint.complaintId} — ${complaint.title} (${complaint.priority})`);
}

/**
 * Called after PUT /api/complaints/:id/status succeeds.
 */
export async function notifyStatusUpdated(complaint) {
  const isResolved = complaint.status === 'Resolved';
  const subject = isResolved
    ? `[Resolved] ${complaint.title}`
    : `[Status Update] ${complaint.title} → ${complaint.status}`;

  const intro = isResolved
    ? 'A complaint has been marked as RESOLVED.'
    : `Complaint status changed to: ${complaint.status}`;

  const body = `${intro}\n\n${formatComplaintDetails(complaint)}`;

  await sendEmail(subject, body);
  await publishSns(
    `Complaint ${complaint.complaintId} status: ${complaint.status} (priority: ${complaint.priority})`,
  );
}
