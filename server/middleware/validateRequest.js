const { validationResult } = require('express-validator');

const ApiError = require('../utils/ApiError');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new ApiError(
      400,
      'Invalid request data.',
      errors.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    )
  );
};

module.exports = validateRequest;

