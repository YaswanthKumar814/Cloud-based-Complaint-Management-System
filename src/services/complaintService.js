import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../config/dynamodb.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { mapAwsError } from '../utils/mapAwsError.js';
import { analyzeComplaintText } from './aiAnalysisService.js';
import {
  notifyComplaintCreated,
  notifyStatusUpdated,
} from './notificationClient.js';
import { logInfo, logError } from '../utils/logger.js';

const TABLE = env.dynamodb.tableName;

/**
 * Create a new complaint item.
 * Expects DynamoDB partition key: complaintId (String).
 */
export async function createComplaint({
  title,
  description,
  category,
  userEmail,
  fileUrl,
  fileKey,
}) {
  const now = new Date().toISOString();

  // Amazon Comprehend + simple keyword rules (low-cost, no custom ML)
  const ai = await analyzeComplaintText(title, description);

  const item = {
    complaintId: uuidv4(),
    title,
    description,
    category: category ?? null,
    userEmail,
    status: 'Pending',
    createdAt: now,
    sentiment: ai.sentiment,
    aiCategory: ai.aiCategory,
    priority: ai.priority,
    keyPhrases: ai.keyPhrases,
  };

  if (fileUrl && fileKey) {
    item.fileUrl = fileUrl;
    item.fileKey = fileKey;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: 'attribute_not_exists(complaintId)',
      }),
    );
  } catch (error) {
    mapAwsError(error, `DynamoDB table "${TABLE}"`);
  }

  logInfo('Complaint created', {
    complaintId: item.complaintId,
    aiCategory: item.aiCategory,
    priority: item.priority,
    sentiment: item.sentiment,
  });

  notifyComplaintCreated(item).catch((err) => {
    logError('Notification error on create', { error: err.message });
  });

  return item;
}

/**
 * List all complaints (Scan). Fine for learning; production apps often use Query + indexes.
 */
export async function listComplaints({ userEmail } = {}) {
  try {
    const params = { TableName: TABLE };

    if (userEmail) {
      params.FilterExpression = 'userEmail = :userEmail';
      params.ExpressionAttributeValues = { ':userEmail': userEmail };
    }

    const result = await docClient.send(new ScanCommand(params));
    const items = result.Items ?? [];
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return items;
  } catch (error) {
    mapAwsError(error, `DynamoDB table "${TABLE}"`);
  }
}

export async function getComplaintById(complaintId) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE,
        Key: { complaintId },
      }),
    );
    if (!result.Item) {
      throw new HttpError(404, `No complaint found with id "${complaintId}"`);
    }
    return result.Item;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    mapAwsError(error, `DynamoDB table "${TABLE}"`);
  }
}

export async function updateComplaintStatus(complaintId, status) {
  const now = new Date().toISOString();
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { complaintId },
        UpdateExpression: 'SET #st = :status, #ua = :updatedAt',
        ExpressionAttributeNames: {
          '#st': 'status',
          '#ua': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': now,
        },
        ConditionExpression: 'attribute_exists(complaintId)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    const updated = result.Attributes;

    logInfo('Complaint status updated', { complaintId, status });

    notifyStatusUpdated(updated).catch((err) => {
      logError('Notification error on status update', { error: err.message });
    });

    return updated;
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      throw new HttpError(404, `No complaint found with id "${complaintId}"`);
    }
    mapAwsError(error, `DynamoDB table "${TABLE}"`);
  }
}
