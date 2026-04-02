const mongoose = require('mongoose');

const stageScoresSchema = new mongoose.Schema(
  {
    intro:           { type: Number, default: 0 },
    cv_deep_dive:    { type: Number, default: 0 },
    technical:       { type: Number, default: 0 },
    problem_solving: { type: Number, default: 0 },
  },
  { _id: false }
);

const voiceMetricsSchema = new mongoose.Schema(
  {
    avgWPM:         { type: Number, default: 0 },
    totalFillerWords:{ type: Number, default: 0 },
    longestPause:   { type: Number, default: 0 }, // seconds
    answerCount:    { type: Number, default: 0 },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    stageScores: {
      type: stageScoresSchema,
      default: () => ({}),
    },
    voiceMetrics: {
      type: voiceMetricsSchema,
      default: () => ({}),
    },
    topStrengths: {
      type: [String],
      default: [],
    },
    topImprovements: {
      type: [String],
      default: [],
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

module.exports = mongoose.model('Report', reportSchema);
