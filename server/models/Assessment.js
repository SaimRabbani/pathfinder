const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: String,
      trim: true,
      default: ''
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    _id: false
  }
);

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    riasecScores: {
      realistic: { type: Number, default: 0 },
      investigative: { type: Number, default: 0 },
      artistic: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      enterprising: { type: Number, default: 0 },
      conventional: { type: Number, default: 0 }
    },
    aptitudeScores: {
      logical: { type: Number, default: 0 },
      numerical: { type: Number, default: 0 },
      verbal: { type: Number, default: 0 }
    },
    aiProvider: {
      type: String,
      trim: true,
      default: 'fallback'
    },
    recommendations: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
