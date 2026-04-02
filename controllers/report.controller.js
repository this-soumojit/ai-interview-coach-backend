const Report = require('../models/Report.model');
const { aggregateReport } = require('../services/scoreAggregator.service');

// ---------------------------------------------------------------------------
// generateReport  — POST /api/session/:id/report
// ---------------------------------------------------------------------------

/**
 * Generates (or re-generates) the report for a session.
 * Optionally accepts real voiceMetrics from the frontend in req.body.
 *
 * Body (optional):
 * {
 *   voiceMetrics: { avgWPM, totalFillerWords, longestPause, answerCount }
 * }
 */
async function generateReport(req, res) {
  try {
    const sessionId = req.params.id;

    // Aggregate scores and upsert the Report document
    let report = await aggregateReport(sessionId);

    // If the frontend supplied real voice metrics, merge them in now
    const { voiceMetrics } = req.body || {};
    if (voiceMetrics && typeof voiceMetrics === 'object') {
      report = await Report.findOneAndUpdate(
        { sessionId },
        {
          voiceMetrics: {
            avgWPM:          Number(voiceMetrics.avgWPM)          || 0,
            totalFillerWords: Number(voiceMetrics.totalFillerWords) || 0,
            longestPause:    Number(voiceMetrics.longestPause)    || 0,
            answerCount:     Number(voiceMetrics.answerCount)     || report.voiceMetrics.answerCount,
          },
        },
        { new: true }
      );
    }

    return res.status(201).json(report);
  } catch (err) {
    console.error('[generateReport]', err);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
}

// ---------------------------------------------------------------------------
// getReport  — GET /api/session/:id/report
// ---------------------------------------------------------------------------

/**
 * Returns the report for a session.
 * If no report exists yet, aggregates it on-the-fly before responding.
 */
async function getReport(req, res) {
  try {
    const sessionId = req.params.id;

    let report = await Report.findOne({ sessionId });

    if (!report) {
      // Lazily generate the report on first GET
      report = await aggregateReport(sessionId);
    }

    return res.json(report);
  } catch (err) {
    console.error('[getReport]', err);
    return res.status(500).json({ error: 'Failed to retrieve report.' });
  }
}

module.exports = { generateReport, getReport };
