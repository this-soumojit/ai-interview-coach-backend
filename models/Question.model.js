const mongoose = require('mongoose');

const scoresSchema = new mongoose.Schema(
  {
    technicalScore: { type: Number, default: 0 },
    depthScore:     { type: Number, default: 0 },
    clarityScore:   { type: Number, default: 0 },
    confidenceScore:{ type: Number, default: 0 },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    summary:    { type: String, default: '' },
    suggestion: { type: String, default: '' },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: ['intro', 'cv_deep_dive', 'technical', 'problem_solving'],
    },
    questionText: {
      type: String,
      required: true,
    },
    transcribedAnswer: {
      type: String,
      default: '',
    },
    scores: {
      type: scoresSchema,
      default: () => ({}),
    },
    feedback: {
      type: feedbackSchema,
      default: () => ({}),
    },
    questionIndex: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('Question', questionSchema);
