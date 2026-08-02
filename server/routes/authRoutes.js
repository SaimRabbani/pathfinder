const express = require('express');
const { body, cookie, header, param } = require('express-validator');

const {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } = require('../utils/tokens');

const router = express.Router();

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters long.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required.'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters long.')
];

const loginValidation = [
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required.'),
  body('password').isString().notEmpty().withMessage('Password is required.')
];

const forgotPasswordValidation = [
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required.')
];

const resetPasswordValidation = [
  param('token')
    .trim()
    .isHexadecimal()
    .isLength({ min: 64, max: 64 })
    .withMessage('A valid password reset token is required.'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters long.')
];

const refreshCookieValidation = [
  cookie(REFRESH_COOKIE_NAME)
    .optional()
    .isString()
    .isJWT()
    .withMessage('Refresh token must be a valid JWT.')
];

const meValidation = [
  cookie(ACCESS_COOKIE_NAME)
    .optional()
    .isString()
    .isJWT()
    .withMessage('Access token must be a valid JWT.'),
  header('authorization')
    .optional()
    .matches(/^Bearer\s+\S+$/)
    .withMessage('Authorization header must use Bearer token format.')
];

router.post('/register', authLimiter, registerValidation, validateRequest, register);
router.post('/login', authLimiter, loginValidation, validateRequest, login);
router.post('/refresh', authLimiter, refreshCookieValidation, validateRequest, refresh);
router.post('/logout', authLimiter, refreshCookieValidation, validateRequest, logout);
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidation,
  validateRequest,
  forgotPassword
);
router.post(
  '/reset-password/:token',
  authLimiter,
  resetPasswordValidation,
  validateRequest,
  resetPassword
);
router.get('/me', meValidation, validateRequest, protect, me);

module.exports = router;
