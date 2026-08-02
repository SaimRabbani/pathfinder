const jwt = require('jsonwebtoken');

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ACCESS_COOKIE_NAME } = require('../utils/tokens');

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies[ACCESS_COOKIE_NAME];

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    throw new ApiError(401, 'Authentication required.');
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Access token is invalid or expired.');
  }

  // Pull the latest user document so role changes take effect immediately.
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, 'The account associated with this token no longer exists.');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource.'));
  }

  return next();
};

module.exports = {
  authorize,
  protect
};
