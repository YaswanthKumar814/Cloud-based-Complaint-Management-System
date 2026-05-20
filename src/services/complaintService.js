import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../config/dynamodb.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { mapAwsError } from '../utils/mapAwsError.js';

const TABLE = env.dynamodb.tableName;

/**
 * Create a new complaint item.
 * Expects DynamoDB partition key: complaintId (String).
 */
export async function createComplaint({ title, description, category, fileUrl, fileKey }) {
  const now = new Date().toISOString();
  const item = {
    complaintId: uuidv4(),
    title,
    description,
    category: category ?? null,
    status: 'Pending',
    createdAt: now,
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

  return item;
}

/**
 * List all complaints (Scan). Fine for learning; production apps often use Query + indexes.
 */
export async function listComplaints() {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
      }),
    );
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
    return result.Attributes;
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      throw new HttpError(404, `No complaint found with id "${complaintId}"`);
    }
    mapAwsError(error, `DynamoDB table "${TABLE}"`);
  }
}
