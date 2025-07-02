const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError
} = require('../utils/errors');
const logger = require('../utils/logger'); // Contoh: winston/morgan

const errorHandler = (err, req, res, next) => {
  // 1. Determine status code and message
  const statusCode = getStatusCode(err);
  const message = getErrorMessage(err);
  const errorType = err.constructor.name;

  // 2. Enhanced logging
  logError(err, req, statusCode);

  // 3. Construct response
  const response = {
    success: false,
    error: errorType,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  };

  // 4. Add validation errors if exists
  if (err instanceof ValidationError && err.errors) {
    response.errors = formatValidationErrors(err.errors);
  }

  // 5. Send response
  res.status(statusCode).json(response);
};

// ===================== HELPER FUNCTIONS ===================== //
const getStatusCode = (err) => {
  if (err.statusCode) return err.statusCode;
  
  const errorMap = {
    ValidationError: 422,
    NotFoundError: 404,
    UnauthorizedError: 401,
    ForbiddenError: 403,
    RateLimitError: 429,
    CastError: 400,
    JsonWebTokenError: 401,
    TokenExpiredError: 401,
    default: 500
  };

  return errorMap[err.name] || errorMap.default;
};

const getErrorMessage = (err) => {
  const defaultMessages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Validation Failed',
    429: 'Too Many Requests',
    500: 'Internal Server Error'
  };

  return err.message || defaultMessages[getStatusCode(err)] || 'Something went wrong';
};

const formatValidationErrors = (errors) => {
  return Object.values(errors).map(e => ({
    field: e.path || e.field,
    message: e.message,
    ...(e.value && { rejectedValue: e.value })
  }));
};

const logError = (err, req, statusCode) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ...(err instanceof ValidationError && { validationErrors: err.errors })
  };

  // Log berbeda berdasarkan level error
  if (statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', logData);
  }
};

module.exports = errorHandler;