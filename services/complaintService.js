import { randomUUID } from 'node:crypto';
import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/dynamodb.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { COMPLAINT_STATUSES } from '../utils/validation.js';

const TABLE = env.dynamodb.tableName;

function mapAwsError(error) {
  if (error?.name === 'ResourceNotFoundException') {
    return new AppError(
      `DynamoDB table "${TABLE}" was not found. Create the table or check DYNAMODB_TABLE_NAME.`,
      503,
    );
  }
  if (error?.name === 'ConditionalCheckFailedException') {
    return new AppError('Complaint not found or update conflict', 404);
  }
  return error;
}

export async function createComplaint({ title, description, category, reporterEmail }) {
  const now = new Date().toISOString();
  const complaint = {
    complaintId: randomUUID(),
    title,
    description,
    category: category ?? null,
    reporterEmail: reporterEmail ?? null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: complaint,
        ConditionExpression: 'attribute_not_exists(complaintId)',
      }),
    );
  } catch (error) {
    throw mapAwsError(error);
  }

  return complaint;
}

export async function listComplaints({ status, limit }) {
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  let filterExpression;

  if (status) {
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = status;
    filterExpression = '#status = :status';
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        Limit: limit,
        ...(filterExpression && {
          FilterExpression: filterExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        }),
      }),
    );

    const items = (result.Items ?? []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return {
      items,
      count: items.length,
      scannedCount: result.ScannedCount ?? 0,
    };
  } catch (error) {
    throw mapAwsError(error);
  }
}

export async function updateComplaintStatus(complaintId, status) {
  const now = new Date().toISOString();

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { complaintId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ConditionExpression: 'attribute_exists(complaintId)',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': now,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    return result.Attributes;
  } catch (error) {
    throw mapAwsError(error);
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
      throw new AppError('Complaint not found', 404);
    }

    return result.Item;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw mapAwsError(error);
  }
}

export { COMPLAINT_STATUSES };
