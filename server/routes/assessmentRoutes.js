const express = require('express');
const { body, param } = require('express-validator');

const {
  getQuestions,
  submitAssessment,
  getAssessmentResults,
  getAssessmentHistory
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Validation rules
const submitValidation = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array.'),
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('Each answer must contain a valid question Mongo ID.'),
  body('answers.*.selectedOption')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('selectedOption must be a non-empty string.')
];

const getResultsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Assessment ID must be a valid Mongo ID.')
];

// All assessment routes are protected
router.use(protect);

router.get('/questions', getQuestions);
router.post('/assessment/submit', submitValidation, validateRequest, submitAssessment);
router.get('/assessment/history', getAssessmentHistory);
router.get('/assessment/:id/results', getResultsValidation, validateRequest, getAssessmentResults);

module.exports = router;
