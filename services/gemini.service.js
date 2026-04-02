const groq = require('../config/groq');
const { buildExtractProfilePrompt }   = require('../prompts/extractProfile.prompt');
const { buildGenerateQuestionPrompt } = require('../prompts/generateQuestion.prompt');
const { buildEvaluateAnswerPrompt }   = require('../prompts/evaluateAnswer.prompt');

// Free, fast Groq model — swap to 'llama3-8b-8192' for even faster responses
const MODEL_NAME = 'llama-3.3-70b-versatile';

/**
 * Retries an async function with exponential backoff on failure.
 */
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    const status = error?.status ?? error?.statusCode;
    const isRetryable = status === 429 || (status >= 500 && status < 600) || !status;

    if (!isRetryable) throw error;

    console.warn(`[Groq Retry] ${retries} attempts left. Retrying in ${delay / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Strips markdown code fences that the model sometimes wraps around JSON.
 */
function stripFences(raw) {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
}

/**
 * Sends a prompt to Groq and returns the text response.
 */
async function callGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content ?? '';
}

async function extractProfileFromCV(rawText) {
  const prompt = buildExtractProfilePrompt(rawText);
  const raw = await retryWithBackoff(() => callGroq(prompt));

  try {
    return JSON.parse(stripFences(raw));
  } catch (err) {
    throw new Error(`Invalid JSON from Groq: ${err.message}\nRaw: ${raw.slice(0, 200)}`);
  }
}

async function generateQuestion(profileJSON, stage, conversationHistory) {
  const prompt = buildGenerateQuestionPrompt(profileJSON, stage, conversationHistory);
  const result = await retryWithBackoff(() => callGroq(prompt));
  return result.trim();
}

async function evaluateAnswer(questionText, transcriptText, profileJSON) {
  const prompt = buildEvaluateAnswerPrompt(questionText, transcriptText, profileJSON);
  const raw = await retryWithBackoff(() => callGroq(prompt));

  try {
    return JSON.parse(stripFences(raw));
  } catch (err) {
    throw new Error(`Invalid JSON from Groq: ${err.message}\nRaw: ${raw.slice(0, 200)}`);
  }
}

module.exports = { extractProfileFromCV, generateQuestion, evaluateAnswer };

