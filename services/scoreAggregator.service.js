const Question = require('../models/Question.model');
const Report   = require('../models/Report.model');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Given a question document, computes the same weighted score used in submitAnswer.
 *
 * @param {object} scores - { technicalScore, depthScore, clarityScore, confidenceScore }
 * @returns {number} 0-100
 */
function weightedScore({ technicalScore = 0, depthScore = 0, clarityScore = 0, confidenceScore = 0 }) {
  return (
    technicalScore  * 0.4 +
    depthScore      * 0.2 +
    clarityScore    * 0.2 +
    confidenceScore * 0.2
  );
}

/**
 * Computes the average of an array of numbers.
 * Returns 0 for an empty array instead of NaN.
 *
 * @param {number[]} nums
 * @returns {number}
 */
function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

// ---------------------------------------------------------------------------
// aggregateReport
// ---------------------------------------------------------------------------

const STAGES = ['intro', 'cv_deep_dive', 'technical', 'problem_solving'];

/**
 * Aggregates all scored Question documents for a session into a Report.
 * Upserts the Report document so it is safe to call multiple times.
 *
 * @param {string} sessionId
 * @returns {Promise<import('../models/Report.model')>} The saved report document.
 */
async function aggregateReport(sessionId) {
  const questions = await Question.find({ sessionId });

  // ----- Overall score -------------------------------------------------- //
  const allWeighted = questions.map((q) => weightedScore(q.scores || {}));
  const overallScore = Math.round(average(allWeighted));

  // ----- Per-stage scores ----------------------------------------------- //
  const stageScores = {};
  for (const stage of STAGES) {
    const stageQs = questions.filter((q) => q.stage === stage);
    const stageWeighted = stageQs.map((q) => weightedScore(q.scores || {}));
    stageScores[stage] = Math.round(average(stageWeighted));
  }

  // ----- Top strengths: best summaries where technicalScore >= 70 -------- //
  const strengths = questions
    .filter((q) => (q.scores?.technicalScore ?? 0) >= 70 && q.feedback?.summary)
    .sort((a, b) => (b.scores?.technicalScore ?? 0) - (a.scores?.technicalScore ?? 0))
    .slice(0, 3)
    .map((q) => q.feedback.summary);

  // ----- Top improvements: suggestions where technicalScore < 70 --------- //
  const improvements = questions
    .filter((q) => (q.scores?.technicalScore ?? 0) < 70 && q.feedback?.suggestion)
    .sort((a, b) => (a.scores?.technicalScore ?? 0) - (b.scores?.technicalScore ?? 0)) // worst first
    .slice(0, 3)
    .map((q) => q.feedback.suggestion);

  // ----- Voice metrics placeholder (frontend fills real values) ---------- //
  const voiceMetrics = {
    avgWPM:          0,
    totalFillerWords: 0,
    longestPause:    0,
    answerCount:     questions.length,
  };

  // ----- Upsert ---------------------------------------------------------- //
  const report = await Report.findOneAndUpdate(
    { sessionId },
    {
      overallScore,
      stageScores,
      voiceMetrics,
      topStrengths:    strengths,
      topImprovements: improvements,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return report;
}

module.exports = { aggregateReport };
