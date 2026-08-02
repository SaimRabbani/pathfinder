const mongoSanitize = require('mongo-sanitize');

const sanitizeRequest = (req, res, next) => {
  // Remove MongoDB operators from user-controlled input before it reaches queries.
  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = mongoSanitize(req.params);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = mongoSanitize(req.query);
  }

  next();
};

module.exports = sanitizeRequest;
