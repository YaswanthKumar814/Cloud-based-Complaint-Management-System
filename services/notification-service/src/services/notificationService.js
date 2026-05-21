import { SendEmailCommand } from '@aws-sdk/client-ses';
import { PublishCommand } from '@aws-sdk/client-sns';
import { sesClient } from '../config/ses.js';
import { snsClient } from '../config/sns.js';
import { env } from '../config/env.js';
import { logInfo, logWarn } from '../utils/logger.js';

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

async function sendEmail(subject, bodyText) {
  if (!isEmailConfigured()) {
    logWarn('Email skipped — configure SES_FROM_EMAIL and ADMIN_EMAIL');
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
    logInfo('Email sent via SES', { subject });
    return true;
  } catch (error) {
    logWarn('SES email failed', { error: error.name, message: error.message });
    return false;
  }
}

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
    logInfo('SNS message published');
    return true;
  } catch (error) {
    logWarn('SNS publish failed', { error: error.name, message: error.message });
    return false;
  }
}

export async function notifyComplaintCreated(complaint) {
  const subject = `[New Complaint] ${complaint.title}`;
  const body = `A new complaint was submitted.\n\n${formatComplaintDetails(complaint)}`;

  const emailSent = await sendEmail(subject, body);
  const snsPublished = await publishSns(
    `New complaint: ${complaint.complaintId} — ${complaint.title} (${complaint.priority})`,
  );

  return { emailSent, snsPublished };
}

export async function notifyStatusUpdated(complaint) {
  const isResolved = complaint.status === 'Resolved';
  const subject = isResolved
    ? `[Resolved] ${complaint.title}`
    : `[Status Update] ${complaint.title} → ${complaint.status}`;

  const intro = isResolved
    ? 'A complaint has been marked as RESOLVED.'
    : `Complaint status changed to: ${complaint.status}`;

  const body = `${intro}\n\n${formatComplaintDetails(complaint)}`;

  const emailSent = await sendEmail(subject, body);
  const snsPublished = await publishSns(
    `Complaint ${complaint.complaintId} status: ${complaint.status} (priority: ${complaint.priority})`,
  );

  return { emailSent, snsPublished };
}
