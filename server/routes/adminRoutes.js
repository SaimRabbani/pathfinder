const express = require('express');
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(authorize('admin'));

// Analytics
router.get('/analytics', getAnalytics);

// Questions CRUD
router.route('/questions')
  .get(getQuestions)
  .post(createQuestion);
router.route('/questions/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

// Careers CRUD
router.route('/careers')
  .get(getCareers)
  .post(createCareer);
router.route('/careers/:id')
  .put(updateCareer)
  .delete(deleteCareer);

// Courses CRUD
router.route('/courses')
  .get(getCourses)
  .post(createCourse);
router.route('/courses/:id')
  .put(updateCourse)
  .delete(deleteCourse);

module.exports = router;
