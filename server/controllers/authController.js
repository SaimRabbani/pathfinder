const crypto = require('crypto');

const { matchedData } = require('express-validator');
const jwt = require('jsonwebtoken');

const {
  accessCookieOptions,
  clearCookieOptions,
  refreshCookieOptions
} = require('../config/cookieOptions');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendPasswordResetEmail } = require('../utils/email');
const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  generateAccessToken,
  generateRefreshToken,
  hashToken
} = require('../utils/tokens');

const buildSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, clearCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);
};

const rotateSession = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Only the hash is stored so a database leak does not expose live refresh tokens.
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = matchedData(req, {
    locations: ['body'],
    includeOptionals: false
  });

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, 'An account with that email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student'
  });

  await rotateSession(res, user);

  res.status(201).json({
    message: 'Account created successfully.',
    user: buildSafeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = matchedData(req, {
    locations: ['body'],
    includeOptionals: false
  });

  const user = await User.findOne({ email }).select('+password +refreshTokenHash');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  await rotateSession(res, user);

  res.status(200).json({
    message: 'Login successful.',
    user: buildSafeUser(user)
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required.');
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token is invalid or expired.');
  }

  if (payload.type !== 'refresh') {
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token is invalid or expired.');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');

  if (!user || !user.refreshTokenHash) {
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token is invalid or expired.');
  }

  if (hashToken(refreshToken) !== user.refreshTokenHash) {
    // If an old refresh token is replayed, invalidate the stored session immediately.
    user.refreshTokenHash = undefined;
    await user.save({ validateBeforeSave: false });
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token has already been rotated.');
  }

  await rotateSession(res, user);

  res.status(200).json({
    message: 'Session refreshed successfully.',
    user: buildSafeUser(user)
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
        ignoreExpiration: true
      });

      if (payload.type !== 'refresh') {
        clearAuthCookies(res);
        return res.status(200).json({
          message: 'Logged out successfully.'
        });
      }

      const user = await User.findById(payload.sub).select('+refreshTokenHash');

      if (user && hashToken(refreshToken) === user.refreshTokenHash) {
        user.refreshTokenHash = undefined;
        await user.save({ validateBeforeSave: false });
      }
    } catch (error) {
      // Clearing cookies below is enough when the refresh token is already invalid.
    }
  }

  clearAuthCookies(res);

  res.status(200).json({
    message: 'Logged out successfully.'
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = matchedData(req, {
    locations: ['body'],
    includeOptionals: false
  });

  const genericMessage =
    'If an account with that email exists, a password reset link will be sent.';

  const user = await User.findOne({ email }).select(
    '+passwordResetToken +passwordResetExpires'
  );

  if (!user) {
    return res.status(200).json({ message: genericMessage });
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = hashToken(rawResetToken);

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${process.env.CLIENT_URL.replace(/\/$/, '')}/reset-password/${rawResetToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Password reset email failed:', error.message);
  }

  return res.status(200).json({ message: genericMessage });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = matchedData(req, {
    locations: ['params', 'body'],
    includeOptionals: false
  });

  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordResetToken +passwordResetExpires +refreshTokenHash');

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined;

  await user.save();
  clearAuthCookies(res);

  res.status(200).json({
    message: 'Password reset successful. Please log in again.'
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: buildSafeUser(req.user)
  });
});

module.exports = {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword
};
