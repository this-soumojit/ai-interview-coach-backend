const express    = require('express');
const { getSession, completeSession, getHistory } = require('../controllers/interview.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// GET  /api/session/history      — fetch user history
router.get('/history', protect, getHistory);

// GET  /api/session/:id          — fetch session details
router.get('/:id', protect, getSession);

// POST /api/session/:id/complete — mark session as completed
router.post('/:id/complete', completeSession);

module.exports = router;
