/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };

  let statusCode = 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    error.error = 'Validation Error';
    error.message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    error.error = 'Invalid ID';
    error.message = 'Invalid ID format provided';
  } else if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 409;
    error.error = 'Duplicate Entry';
    error.message = 'A record with this information already exists';
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    error.error = 'Not Found';
    error.message = err.message;
  } else if (err.message.includes('validation') || err.message.includes('required')) {
    statusCode = 400;
    error.error = 'Validation Error';
    error.message = err.message;
  } else if (err.message.includes('already exists')) {
    statusCode = 409;
    error.error = 'Conflict';
    error.message = err.message;
  }

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = {
      name: err.name,
      code: err.code,
      originalMessage: err.message
    };
  }

  // Add request context
  error.path = req.path;
  error.method = req.method;

  res.status(statusCode).json(error);
}

module.exports = errorHandler;