const crypto  = require('crypto');
const Session = require('../models/Session.model');
const { parseCVFile }          = require('../services/cvParser.service');
const { extractProfileFromCV } = require('../services/gemini.service');

/**
 * POST /api/upload
 * Accepts a CV file, parses it, extracts a structured profile via Gemini,
 * and persists a new Session document.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function uploadCV(req, res) {
  try {
    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please attach a PDF or DOCX.' });
    }

    const { buffer, mimetype, originalname } = req.file;

    // 2. Extract plain text from the uploaded file
    let rawText;
    try {
      rawText = await parseCVFile(buffer, mimetype);
    } catch (parseErr) {
      return res.status(400).json({
        error: `Failed to read file "${originalname}": ${parseErr.message}`,
      });
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        error: 'The uploaded file appears to be empty or contains no extractable text.',
      });
    }

    // 3. Extract structured profile via Gemini
    let profile;
    try {
      profile = await extractProfileFromCV(rawText);
    } catch (aiErr) {
      return res.status(502).json({
        error: `AI profile extraction failed: ${aiErr.message}`,
      });
    }

    // 4. Persist session
    const sessionId = crypto.randomUUID();

    const session = await Session.create({
      sessionId,
      userId: req.user?._id,
      candidateName: profile.name || '',
      status:        'ready',
      profileJSON:   profile,
    });

    // 5. Respond
    return res.status(201).json({
      sessionId:     session.sessionId,
      candidateName: session.candidateName,
      profile,
    });
  } catch (err) {
    console.error('[uploadCV] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}

module.exports = { uploadCV };
