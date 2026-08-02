const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    category: {
      type: String,
      required: true,
      enum: ['aptitude', 'interest', 'personality']
    },
    options: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 200
        }
      ],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: 'A question must have at least two options.'
      },
      default: []
    },
    riasecWeights: {
      realistic: { type: Number, default: 0 },
      investigative: { type: Number, default: 0 },
      artistic: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      enterprising: { type: Number, default: 0 },
      conventional: { type: Number, default: 0 }
    },
    aptitudeType: {
      type: String,
      trim: true,
      enum: ['', 'logical', 'numerical', 'verbal'],
      default: ''
    },
    correctOption: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

questionSchema.path('correctOption').validate(function validateCorrectOption(value) {
  if (this.category !== 'aptitude') {
    return true;
  }

  return Boolean(value) && this.options.includes(value);
}, 'Aptitude questions must define a correctOption from the options list.');

questionSchema.path('aptitudeType').validate(function validateAptitudeType(value) {
  if (this.category !== 'aptitude') {
    return true;
  }

  return ['logical', 'numerical', 'verbal'].includes(value);
}, 'Aptitude questions must define a valid aptitudeType.');

module.exports = mongoose.model('Question', questionSchema);
