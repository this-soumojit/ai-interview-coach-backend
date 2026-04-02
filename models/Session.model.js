const mongoose = require('mongoose');

const profileJSONSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    skills: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    experienceLevel: { type: String, default: '' },
    education: { type: String, default: '' },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    candidateName: {
      type: String,
      default: '',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'in_progress', 'completed'],
      default: 'processing',
    },
    profileJSON: {
      type: profileJSONSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: false, // uploadedAt is managed manually
    versionKey: false,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
