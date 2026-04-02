const express = require('express');
const { getNextQuestion, submitAnswer, getQuestions } = require('../controllers/interview.controller');

const router = express.Router({ mergeParams: true });

// GET  /api/session/:id/questions — get all questions for a session
router.get('/:id/questions', getQuestions);

// POST /api/session/:id/question — generate and return next question
router.post('/:id/question', getNextQuestion);

// POST /api/session/:id/answer  — submit transcribed answer + voice metrics
router.post('/:id/answer', submitAnswer);

module.exports = router;
