const Session  = require('../models/Session.model');
const Question = require('../models/Question.model');
const {
  generateQuestion: geminiGenerateQuestion,
  evaluateAnswer:   geminiEvaluateAnswer,
} = require('../services/gemini.service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes a confidence score (0–100) from WPM and pause count.
 * Ideal WPM is 120–160. Each WPM outside that range costs 1 point (max 50).
 * Each pause costs 10 points (max 50).
 *
 * @param {number} wpm
 * @param {number} pauseCount
 * @returns {number}
 */
function computeConfidenceScore(wpm, pauseCount) {
  const wpmNum   = Number(wpm)   || 0;
  const pauses   = Number(pauseCount) || 0;

  const deviation =
    wpmNum < 120 ? 120 - wpmNum :
    wpmNum > 160 ? wpmNum - 160 : 0;

  const wpmPenalty   = Math.min(50, deviation);
  const pausePenalty = Math.min(50, pauses * 10);

  return Math.max(0, 100 - wpmPenalty - pausePenalty);
}

// ---------------------------------------------------------------------------
// getSession  — GET /api/session/:id
// ---------------------------------------------------------------------------

/**
 * Returns the full Session document for a given sessionId.
 */
async function getSession(req, res) {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ error: `Session "${req.params.id}" not found.` });
    }
    return res.json(session);
  } catch (err) {
    console.error('[getSession]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ---------------------------------------------------------------------------
// getNextQuestion  — POST /api/session/:id/question
// ---------------------------------------------------------------------------

/**
 * Generates the next interview question for the session and persists it.
 *
 * Body: { stage, conversationHistory }
 */
async function getNextQuestion(req, res) {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ error: `Session "${req.params.id}" not found.` });
    }

    const { stage, conversationHistory = [] } = req.body;

    if (!stage) {
      return res.status(400).json({ error: 'Missing required field: stage.' });
    }

    // Generate question via Gemini
    let questionText;
    try {
      questionText = await geminiGenerateQuestion(
        session.profileJSON,
        stage,
        conversationHistory
      );
    } catch (aiErr) {
      return res.status(502).json({ error: `AI question generation failed: ${aiErr.message}` });
    }

    // Determine the index for ordering (count existing questions in this session)
    const questionIndex = await Question.countDocuments({ sessionId: req.params.id });

    // Persist the question
    const question = await Question.create({
      sessionId:     req.params.id,
      stage,
      questionText,
      questionIndex,
    });

    // Mark session as in_progress (idempotent)
    if (session.status !== 'in_progress') {
      session.status = 'in_progress';
      await session.save();
    }

    return res.status(201).json({
      questionId:   question._id,
      questionText: question.questionText,
    });
  } catch (err) {
    console.error('[getNextQuestion]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ---------------------------------------------------------------------------
// submitAnswer  — POST /api/session/:id/answer
// ---------------------------------------------------------------------------

/**
 * Accepts a transcribed answer, evaluates it with Gemini, computes local
 * heuristic scores, and persists the results on the Question document.
 *
 * Body: {
 *   questionId,
 *   transcriptText,
 *   voiceMetrics: { wpm, fillerCount, pauseCount, answerDuration }
 * }
 */
async function submitAnswer(req, res) {
  try {
    const { questionId, transcriptText = '', voiceMetrics = {} } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'Missing required field: questionId.' });
    }

    // Load the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: `Question "${questionId}" not found.` });
    }

    // Load the session (needed for profileJSON)
    const session = await Session.findOne({ sessionId: question.sessionId });
    if (!session) {
      return res.status(404).json({ error: `Session for question "${questionId}" not found.` });
    }

    // --- AI evaluation ---
    let aiResult;
    try {
      aiResult = await geminiEvaluateAnswer(
        question.questionText,
        transcriptText,
        session.profileJSON
      );
    } catch (aiErr) {
      return res.status(502).json({ error: `AI evaluation failed: ${aiErr.message}` });
    }

    const { technicalScore = 0, summary = '', suggestion = '' } = aiResult;

    // --- Local heuristic scores ---
    const wordCount = transcriptText.trim()
      ? transcriptText.trim().split(/\s+/).length
      : 0;

    // Depth: how much the candidate said (target ~150 words for a full answer)
    const depthScore     = Math.min(100, Math.round((wordCount / 150) * 100));

    // Clarity: penalise filler words (each costs 10 points)
    const clarityScore   = Math.max(0, 100 - ((voiceMetrics.fillerCount || 0) * 10));

    // Confidence: WPM deviation from 120–160 ideal + pauses
    const confidenceScore = computeConfidenceScore(
      voiceMetrics.wpm,
      voiceMetrics.pauseCount
    );

    // --- Weighted composite ---
    const weightedScore = Math.round(
      technicalScore  * 0.4 +
      depthScore      * 0.2 +
      clarityScore    * 0.2 +
      confidenceScore * 0.2
    );

    // --- Persist on the Question document ---
    question.transcribedAnswer = transcriptText;
    question.scores = { technicalScore, depthScore, clarityScore, confidenceScore };
    question.feedback = { summary, suggestion };
    await question.save();

    return res.json({
      scores: question.scores,
      feedback: question.feedback,
      weightedScore,
    });
  } catch (err) {
    console.error('[submitAnswer]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ---------------------------------------------------------------------------
// completeSession  — POST /api/session/:id/complete
// ---------------------------------------------------------------------------

/**
 * Marks the session as completed.
 */
async function completeSession(req, res) {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ error: `Session "${req.params.id}" not found.` });
    }

    session.status = 'completed';
    await session.save();

    return res.json({ message: 'Session completed.' });
  } catch (err) {
    console.error('[completeSession]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Returns all Questions for a given sessionId, sorted by questionIndex.
 */
async function getQuestions(req, res) {
  try {
    const questions = await Question.find({ sessionId: req.params.id }).sort({ questionIndex: 1 });
    return res.json(questions);
  } catch (err) {
    console.error('[getQuestions]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Returns session history for the logged in user
 */
async function getHistory(req, res) {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ uploadedAt: -1 });
    return res.json(sessions);
  } catch (err) {
    console.error('[getHistory]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getSession, getNextQuestion, submitAnswer, completeSession, getQuestions, getHistory };
