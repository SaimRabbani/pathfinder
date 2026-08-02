const Question = require('../models/Question');
const Career = require('../models/Career');
const Course = require('../models/Course');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// --- ANALYTICS ---
const getAnalytics = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalAssessments = await Assessment.countDocuments({});
  const completedAssessments = await Assessment.countDocuments({ completedAt: { $ne: null } });
  
  const completionRate = totalAssessments > 0 
    ? Math.round((completedAssessments / totalAssessments) * 100) 
    : 0;

  // MongoDB aggregation to find top careers recommended
  const topCareers = await Assessment.aggregate([
    { $match: { completedAt: { $ne: null } } },
    { $unwind: '$recommendations' },
    {
      $group: {
        _id: '$recommendations.careerTitle',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $project: {
        careerTitle: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      totalStudents,
      totalAssessments,
      completionRate,
      topCareers
    }
  });
});

// --- QUESTIONS CRUD ---
const getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({}).sort({ createdAt: -1 });
  res.status(200).json({ success: true, questions });
});

const createQuestion = asyncHandler(async (req, res) => {
  const { text, category, options, riasecWeights, aptitudeType, correctOption } = req.body;

  if (!text || !category) {
    throw new ApiError(400, 'Text and category are required.');
  }

  const question = await Question.create({
    text,
    category,
    options: options || [],
    riasecWeights: riasecWeights || {},
    aptitudeType: aptitudeType || '',
    correctOption: correctOption || ''
  });

  res.status(201).json({ success: true, question });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const { text, category, options, riasecWeights, aptitudeType, correctOption } = req.body;
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  question.text = text !== undefined ? text : question.text;
  question.category = category !== undefined ? category : question.category;
  question.options = options !== undefined ? options : question.options;
  question.riasecWeights = riasecWeights !== undefined ? riasecWeights : question.riasecWeights;
  question.aptitudeType = aptitudeType !== undefined ? aptitudeType : question.aptitudeType;
  question.correctOption = correctOption !== undefined ? correctOption : question.correctOption;

  await question.save();
  res.status(200).json({ success: true, question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }
  await question.deleteOne();
  res.status(200).json({ success: true, message: 'Question deleted successfully.' });
});

// --- CAREERS CRUD ---
const getCareers = asyncHandler(async (req, res) => {
  const careers = await Career.find({}).sort({ title: 1 });
  res.status(200).json({ success: true, careers });
});

const createCareer = asyncHandler(async (req, res) => {
  const { title, description, riasecWeights, requiredAptitude, avgSalary, growthOutlook } = req.body;

  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required.');
  }

  const career = await Career.create({
    title,
    description,
    riasecWeights: riasecWeights || {},
    requiredAptitude: requiredAptitude || {},
    avgSalary: avgSalary || 0,
    growthOutlook: growthOutlook || ''
  });

  res.status(201).json({ success: true, career });
});

const updateCareer = asyncHandler(async (req, res) => {
  const { title, description, riasecWeights, requiredAptitude, avgSalary, growthOutlook } = req.body;
  const career = await Career.findById(req.params.id);

  if (!career) {
    throw new ApiError(404, 'Career not found.');
  }

  career.title = title !== undefined ? title : career.title;
  career.description = description !== undefined ? description : career.description;
  career.riasecWeights = riasecWeights !== undefined ? riasecWeights : career.riasecWeights;
  career.requiredAptitude = requiredAptitude !== undefined ? requiredAptitude : career.requiredAptitude;
  career.avgSalary = avgSalary !== undefined ? avgSalary : career.avgSalary;
  career.growthOutlook = growthOutlook !== undefined ? growthOutlook : career.growthOutlook;

  await career.save();
  res.status(200).json({ success: true, career });
});

const deleteCareer = asyncHandler(async (req, res) => {
  const career = await Career.findById(req.params.id);
  if (!career) {
    throw new ApiError(404, 'Career not found.');
  }
  await career.deleteOne();
  res.status(200).json({ success: true, message: 'Career deleted successfully.' });
});

// --- COURSES CRUD ---
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({}).populate('relatedCareers', 'title').sort({ title: 1 });
  res.status(200).json({ success: true, courses });
});

const createCourse = asyncHandler(async (req, res) => {
  const { title, provider, link, duration, level, relatedCareers } = req.body;

  if (!title || !provider || !link) {
    throw new ApiError(400, 'Title, provider, and link are required.');
  }

  const course = await Course.create({
    title,
    provider,
    link,
    duration: duration || '',
    level: level || '',
    relatedCareers: relatedCareers || []
  });

  res.status(201).json({ success: true, course });
});

const updateCourse = asyncHandler(async (req, res) => {
  const { title, provider, link, duration, level, relatedCareers } = req.body;
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  course.title = title !== undefined ? title : course.title;
  course.provider = provider !== undefined ? provider : course.provider;
  course.link = link !== undefined ? link : course.link;
  course.duration = duration !== undefined ? duration : course.duration;
  course.level = level !== undefined ? level : course.level;
  course.relatedCareers = relatedCareers !== undefined ? relatedCareers : course.relatedCareers;

  await course.save();
  res.status(200).json({ success: true, course });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }
  await course.deleteOne();
  res.status(200).json({ success: true, message: 'Course deleted successfully.' });
});

module.exports = {
  getAnalytics,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
};
