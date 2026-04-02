/**
 * Builds the prompt for evaluating a candidate's verbal answer to an interview question.
 *
 * @param {string} questionText     - The interview question that was asked.
 * @param {string} transcriptText   - The candidate's transcribed spoken answer.
 * @param {object} profileJSON      - Structured candidate profile (name, skills, experienceLevel, etc.).
 * @returns {string} The prompt string to send to Gemini.
 */
function buildEvaluateAnswerPrompt(questionText, transcriptText, profileJSON) {
  return `You are an expert interview evaluator. Your task is to objectively score a candidate's answer to an interview question.

CANDIDATE CONTEXT:
- Experience Level: ${profileJSON.experienceLevel || 'unknown'}
- Skills: ${(profileJSON.skills || []).join(', ') || 'Not specified'}

INTERVIEW QUESTION:
"${questionText}"

CANDIDATE'S TRANSCRIBED ANSWER:
"${transcriptText || '[No answer provided]'}"

SCORING INSTRUCTIONS:
- Evaluate the answer fairly relative to the candidate's stated experience level.
- "technicalScore" (0–100): How technically accurate, complete, and correct is the answer?
  - 0–30: Incorrect or very vague
  - 31–60: Partially correct, missing key concepts
  - 61–80: Mostly correct with minor gaps
  - 81–100: Accurate, well-structured, demonstrates strong understanding
- "summary": A single sentence (max 20 words) describing the overall quality of the answer.
- "suggestion": One specific, actionable improvement tip the candidate can apply immediately.

RULES:
- Return ONLY a single, valid JSON object. No markdown, no code fences, no explanation, no extra text before or after the JSON.

OUTPUT FORMAT (return exactly this structure, nothing else):
{
  "technicalScore": <number 0-100>,
  "summary": "<one sentence summary>",
  "suggestion": "<one specific improvement tip>"
}`;
}

module.exports = { buildEvaluateAnswerPrompt };
