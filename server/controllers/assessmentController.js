const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateRecommendations } = require('../utils/recommendationService');

const likertOptions = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree'
];

const buildEmptyRiasecScores = () => ({
  realistic: 0,
  investigative: 0,
  artistic: 0,
  social: 0,
  enterprising: 0,
  conventional: 0
});

const buildEmptyAptitudeScores = () => ({
  logical: 0,
  numerical: 0,
  verbal: 0
});

const normalizeLikertResponse = (selectedOption) => {
  const index = likertOptions.findIndex((option) => option === selectedOption);

  if (index === -1) {
    return null;
  }

  return index / (likertOptions.length - 1);
};

/**
 * GET /api/questions
 * Returns the question bank (excluding correctOption for security).
 */
const getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({})
    .select('-correctOption')
    .sort({ category: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: questions.length,
    questions
  });
});

/**
 * POST /api/assessment/submit
 * Computes RIASEC and aptitude scores, saves them, runs recommendations engine, and caches results.
 */
const submitAssessment = asyncHandler(async (req, res) => {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    throw new ApiError(400, 'Answers array is required and cannot be empty.');
  }

  const riasecScores = buildEmptyRiasecScores();
  const aptitudeScores = buildEmptyAptitudeScores();
  const processedAnswers = [];
  const seenQuestionIds = new Set();
  const submittedQuestionIds = answers.map((answer) => answer.questionId);
  const questions = await Question.find({ _id: { $in: submittedQuestionIds } });
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));

  for (const ans of answers) {
    const qId = ans.questionId?.toString();

    if (!qId) {
      throw new ApiError(400, 'Each answer must include a questionId.');
    }

    if (seenQuestionIds.has(qId)) {
      throw new ApiError(400, `Duplicate answer submitted for question ${qId}.`);
    }

    seenQuestionIds.add(qId);

    const question = questionMap.get(qId.toString());

    if (!question) {
      throw new ApiError(404, `Question with ID ${qId} not found.`);
    }

    const selectedOption = (ans.selectedOption || '').trim();

    if (!question.options.includes(selectedOption)) {
      throw new ApiError(400, `Selected option is invalid for question ${qId}.`);
    }

    processedAnswers.push({
      questionId: question._id,
      selectedOption,
      response: ans.response || selectedOption
    });

    if (question.category === 'interest') {
      const multiplier = normalizeLikertResponse(selectedOption);
      const weights = question.riasecWeights || {};

      if (multiplier !== null) {
        riasecScores.realistic += (weights.realistic || 0) * multiplier;
        riasecScores.investigative += (weights.investigative || 0) * multiplier;
        riasecScores.artistic += (weights.artistic || 0) * multiplier;
        riasecScores.social += (weights.social || 0) * multiplier;
        riasecScores.enterprising += (weights.enterprising || 0) * multiplier;
        riasecScores.conventional += (weights.conventional || 0) * multiplier;
      }
    } else if (question.category === 'aptitude') {
      if (selectedOption.toLowerCase() === (question.correctOption || '').trim().toLowerCase()) {
        const type = question.aptitudeType;

        if (type && type in aptitudeScores) {
          aptitudeScores[type] += 1;
        }
      }
    }
  }

  const assessment = new Assessment({
    userId: req.user._id,
    answers: processedAnswers,
    riasecScores,
    aptitudeScores,
    aiProvider: 'fallback'
  });

  await assessment.save();

  const recoResult = await generateRecommendations(riasecScores, aptitudeScores);

  assessment.recommendations = recoResult.recommendations;
  assessment.aiProvider = recoResult.provider;
  assessment.completedAt = new Date();

  await assessment.save();

  res.status(200).json({
    success: true,
    message: 'Assessment completed and recommendations generated.',
    assessment
  });
});

/**
 * GET /api/assessment/:id/results
 * Returns the cached recommendations for a specific assessment.
 */
const getAssessmentResults = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found.');
  }

  // Check ownership
  if (assessment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not authorized to view this assessment.');
  }

  res.status(200).json({
    success: true,
    assessment
  });
});

/**
 * GET /api/assessment/history
 * Returns the list of past assessments for the logged-in student.
 */
const getAssessmentHistory = asyncHandler(async (req, res) => {
  const history = await Assessment.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('riasecScores aptitudeScores aiProvider completedAt createdAt');

  res.status(200).json({
    success: true,
    count: history.length,
    history
  });
});

module.exports = {
  getQuestions,
  submitAssessment,
  getAssessmentResults,
  getAssessmentHistory
};
