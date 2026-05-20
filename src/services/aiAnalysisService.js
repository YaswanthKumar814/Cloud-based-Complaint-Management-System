import {
  DetectKeyPhrasesCommand,
  DetectSentimentCommand,
} from '@aws-sdk/client-comprehend';
import { comprehendClient } from '../config/comprehend.js';
import {
  CATEGORY_RULES,
  PRIORITY_RULES,
  COMPREHEND_MAX_CHARS,
} from '../utils/aiRules.js';

/**
 * Pick category from keywords (first match wins).
 */
export function detectCategory(textLower) {
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((word) => textLower.includes(word))) {
      return rule.name;
    }
  }
  return 'Other';
}

/**
 * Pick priority from keywords (HIGH checked first, then MEDIUM, then LOW).
 */
export function detectPriority(textLower) {
  if (PRIORITY_RULES.HIGH.some((word) => textLower.includes(word))) {
    return 'HIGH';
  }
  if (PRIORITY_RULES.MEDIUM.some((word) => textLower.includes(word))) {
    return 'MEDIUM';
  }
  if (PRIORITY_RULES.LOW.some((word) => textLower.includes(word))) {
    return 'LOW';
  }
  return 'LOW';
}

/**
 * Call Amazon Comprehend for sentiment + key phrases.
 * On failure, returns safe defaults so complaint creation still works.
 */
async function runComprehend(text) {
  const trimmed = text.slice(0, COMPREHEND_MAX_CHARS);

  const [sentimentResult, phrasesResult] = await Promise.all([
    comprehendClient.send(
      new DetectSentimentCommand({
        Text: trimmed,
        LanguageCode: 'en',
      }),
    ),
    comprehendClient.send(
      new DetectKeyPhrasesCommand({
        Text: trimmed,
        LanguageCode: 'en',
      }),
    ),
  ]);

  const keyPhrases = (phrasesResult.KeyPhrases ?? [])
    .map((kp) => kp.Text)
    .filter(Boolean)
    .slice(0, 10);

  return {
    sentiment: sentimentResult.Sentiment ?? 'NEUTRAL',
    keyPhrases,
  };
}

/**
 * Full AI analysis for a complaint (Comprehend + local keyword rules).
 */
export async function analyzeComplaintText(title, description) {
  const combined = `${title}. ${description}`;
  const textLower = combined.toLowerCase();

  const aiCategory = detectCategory(textLower);
  const priority = detectPriority(textLower);

  let sentiment = 'NEUTRAL';
  let keyPhrases = [];
  let comprehendUsed = true;

  try {
    const result = await runComprehend(combined);
    sentiment = result.sentiment;
    keyPhrases = result.keyPhrases;
  } catch (error) {
    comprehendUsed = false;
    console.warn(
      '[comprehend] Skipped (using keyword rules only):',
      error.name,
      error.message,
    );
  }

  return {
    sentiment,
    aiCategory,
    priority,
    keyPhrases,
    comprehendUsed,
  };
}
