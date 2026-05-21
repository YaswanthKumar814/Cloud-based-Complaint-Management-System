import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { logInfo, logError } from '../utils/logger.js';

const lambdaClient = new LambdaClient({ region: env.aws.region });

/**
 * Invoke complaint-stats Lambda (read-only analytics).
 * Requires LAMBDA_STATS_FUNCTION env and IAM lambda:InvokeFunction.
 */
export async function getComplaintStatsFromLambda() {
  const functionName = env.lambda.statsFunctionName;
  if (!functionName) {
    throw new HttpError(
      503,
      'Lambda analytics not configured. Set LAMBDA_STATS_FUNCTION (e.g. complaint-stats-lambda).',
    );
  }

  try {
    const result = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from('{}'),
      }),
    );

    if (result.FunctionError) {
      const errPayload = result.Payload
        ? Buffer.from(result.Payload).toString('utf8')
        : result.FunctionError;
      logError('Lambda function error', { functionName, errPayload });
      throw new HttpError(502, 'Lambda returned an error. Check CloudWatch Logs for the function.');
    }

    if (!result.Payload || result.Payload.length === 0) {
      throw new HttpError(502, 'Lambda returned an empty response.');
    }

    const raw = Buffer.from(result.Payload).toString('utf8');
    const data = JSON.parse(raw);

    logInfo('Lambda stats invoked', {
      functionName,
      total: data.total,
    });

    return data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    logError('Lambda invoke failed', {
      functionName,
      error: error.message,
      code: error.name,
    });
    throw new HttpError(
      502,
      `Could not invoke Lambda "${functionName}". Check IAM (lambda:InvokeFunction) and that the function exists in ${env.aws.region}.`,
    );
  }
}
