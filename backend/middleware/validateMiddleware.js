const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains and returns a clean 400 response
 * if any validation rule failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => err.msg);

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors,
  });
};

module.exports = validate;
