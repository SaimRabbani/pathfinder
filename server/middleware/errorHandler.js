const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error.';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token is invalid or expired.';
  }

  if (message === 'Origin is not allowed by CORS.') {
    statusCode = 403;
  }

  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error.';
  }

  const response = { message };

  if (Array.isArray(err.details) && err.details.length > 0) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
