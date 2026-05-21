/**
 * Phase 17 — complaint statistics (read-only DynamoDB Scan).
 * Invoked by complaint-service via AWS Lambda SDK (no API Gateway).
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.DYNAMODB_TABLE || 'Complaints';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function scanAllStatuses() {
  const byStatus = {};
  let total = 0;
  let ExclusiveStartKey;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        ProjectionExpression: '#st',
        ExpressionAttributeNames: { '#st': 'status' },
        ExclusiveStartKey,
      }),
    );

    for (const item of result.Items ?? []) {
      total += 1;
      const status = item.status || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return { total, byStatus };
}

export const handler = async () => {
  const { total, byStatus } = await scanAllStatuses();

  return {
    total,
    byStatus,
    tableName: TABLE,
    generatedAt: new Date().toISOString(),
    source: 'complaint-stats-lambda',
  };
};
