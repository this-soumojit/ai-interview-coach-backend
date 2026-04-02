const express = require('express');
const { generateReport, getReport } = require('../controllers/report.controller');

const router = express.Router();

// GET  /api/session/:id/report — fetch (or lazily create) the session report
router.get('/:id/report', getReport);

// POST /api/session/:id/report — explicitly generate / re-generate the report
//                                 (call this when the session completes with real voiceMetrics)
router.post('/:id/report', generateReport);

module.exports = router;
