class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Error yang diprediksi (bukan bug)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Turunan error khusus
class ValidationError extends AppError {
  constructor(errors) {
    super('Validation Failed', 422, { errors });
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource || 'Resource'} not found`, 404);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError: class extends AppError {
    constructor() { super('Unauthorized', 401); }
  },
  ForbiddenError: class extends AppError {
    constructor() { super('Forbidden', 403); }
  }
};