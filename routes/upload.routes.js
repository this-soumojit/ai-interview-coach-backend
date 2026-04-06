const express    = require('express');
const upload     = require('../middleware/upload');
const { uploadCV } = require('../controllers/upload.controller');

const router = express.Router();

/**
 * POST /api/upload
 * Accepts a single CV file (PDF or DOCX, max 5 MB) under the field name "cv".
 */
router.post(
  '/',
  (req, res, next) => {
    // Run multer and convert errors into a clean JSON 400 response
    upload.single('cv')(req, res, (err) => {
      if (err) {
        console.error('[upload route] multer error:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum allowed size is 5 MB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message?.startsWith('UNSUPPORTED_FILE_TYPE')) {
          return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX.' });
        }
        return res.status(400).json({ error: err.message || 'File upload failed.' });
      }
      next();
    });
  },
  uploadCV
);

module.exports = router;
