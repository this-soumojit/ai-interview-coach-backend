/**
 * Stage descriptions used to guide Gemini's question style.
 */
const STAGE_GUIDANCE = {
  intro: `This is the INTRODUCTION stage. Ask a warm, open-ended question to help the candidate relax and introduce themselves. 
Focus on their background, motivation, or career goals. Keep it conversational.`,

  cv_deep_dive: `This is the CV DEEP DIVE stage. Ask a probing question directly about a specific skill, project, or experience 
listed in the candidate's profile. Challenge them to demonstrate depth of knowledge about something they have claimed.`,

  technical: `This is the TECHNICAL stage. Ask a concrete technical question relevant to the candidate's skills and experience level.
For a fresher/junior, ask conceptual or fundamental questions. For mid/senior, ask about system design, trade-offs, or advanced concepts.
Do NOT ask a question that has already been covered in the conversation history.`,

  problem_solving: `This is the PROBLEM SOLVING stage. Present a short, well-defined coding or analytical problem appropriate 
for the candidate's experience level. Ask them to walk you through their approach. Keep the problem achievable in a verbal interview setting.`,
};

/**
 * Formats the conversation history into a readable transcript block.
 *
 * @param {Array<{ role: 'interviewer'|'candidate', text: string }>} history
 * @returns {string}
 */
function formatHistory(history) {
  if (!history || history.length === 0) {
    return 'No previous conversation.';
  }
  return history
    .map((turn) => {
      const label = turn.role === 'interviewer' ? 'Interviewer' : 'Candidate';
      return `${label}: ${turn.text}`;
    })
    .join('\n');
}

/**
 * Builds the prompt for generating the next interview question.
 *
 * @param {object} profileJSON - Structured candidate profile (name, skills, projects, experienceLevel, education).
 * @param {'intro'|'cv_deep_dive'|'technical'|'problem_solving'} stage - Current interview stage.
 * @param {Array<{ role: 'interviewer'|'candidate', text: string }>} conversationHistory - Prior turns in this session.
 * @returns {string} The prompt string to send to Gemini.
 */
function buildGenerateQuestionPrompt(profileJSON, stage, conversationHistory) {
  const stageGuidance = STAGE_GUIDANCE[stage] || STAGE_GUIDANCE.intro;

  return `You are a professional technical interviewer conducting a structured mock interview.

CANDIDATE PROFILE:
- Name: ${profileJSON.name || 'Unknown'}
- Experience Level: ${profileJSON.experienceLevel || 'unknown'}
- Skills: ${(profileJSON.skills || []).join(', ') || 'Not specified'}
- Projects: ${(profileJSON.projects || []).join(', ') || 'Not specified'}
- Education: ${profileJSON.education || 'Not specified'}

CURRENT STAGE INSTRUCTIONS:
${stageGuidance}

CONVERSATION HISTORY SO FAR:
${formatHistory(conversationHistory)}

RULES:
- Ask exactly ONE question.
- KEEP IT BRIEF: Maximum 2 sentences. Under 40 words total. No compound or multi-part questions.
- Do NOT repeat or rephrase any topic already covered in the conversation history.
- Tailor the question to the candidate's actual profile — reference their real skills or projects where relevant.
- Return ONLY the question text. No preamble like "Sure!", no "Great answer!", no explanation.
- The question must end with a question mark.

YOUR QUESTION:`;
}

module.exports = { buildGenerateQuestionPrompt };
