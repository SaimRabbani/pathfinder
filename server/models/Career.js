const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    riasecWeights: {
      realistic: { type: Number, default: 0 },
      investigative: { type: Number, default: 0 },
      artistic: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      enterprising: { type: Number, default: 0 },
      conventional: { type: Number, default: 0 }
    },
    requiredAptitude: {
      logical: { type: Number, default: 0 },
      numerical: { type: Number, default: 0 },
      verbal: { type: Number, default: 0 }
    },
    avgSalary: {
      type: Number,
      min: 0,
      default: 0
    },
    growthOutlook: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Career', careerSchema);
