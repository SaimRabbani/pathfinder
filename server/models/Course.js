const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    relatedCareers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Career'
      }
    ],
    link: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      trim: true,
      default: ''
    },
    level: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Course', courseSchema);

