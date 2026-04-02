/**
 * Builds the prompt for extracting structured candidate profile data from raw CV text.
 *
 * @param {string} rawCVText - The raw plain-text content of the uploaded CV/resume.
 * @returns {string} The prompt string to send to Gemini.
 */
function buildExtractProfilePrompt(rawCVText) {
  return `You are an expert CV parser. Your task is to read the raw CV text provided below and extract key information from it.

RULES:
- Return ONLY a single, valid JSON object. No markdown, no code fences, no explanation, no extra text.
- Every field is required. If a value cannot be found, use an empty string or empty array as appropriate.
- For "experienceLevel", infer from years of experience and job titles. Use ONLY one of: "fresher", "junior", "mid", "senior".
  - fresher: student / no professional experience
  - junior: 0–2 years
  - mid: 3–5 years
  - senior: 6+ years
- For "skills", include both technical skills (languages, frameworks, tools) and relevant soft skills.
- For "projects", include the project name only (not descriptions).
- For "education", produce a single human-readable string, e.g. "B.Tech Computer Science — IIT Delhi (2022)".

OUTPUT FORMAT (return exactly this structure, nothing else):
{
  "name": "<full name of the candidate>",
  "skills": ["<skill 1>", "<skill 2>"],
  "projects": ["<project name 1>", "<project name 2>"],
  "experienceLevel": "<fresher|junior|mid|senior>",
  "education": "<degree + institution + year>"
}

RAW CV TEXT:
---
${rawCVText}
---`;
}

module.exports = { buildExtractProfilePrompt };
