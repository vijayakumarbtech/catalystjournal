// Wraps async route handlers so thrown errors/rejected promises reach the
// error-handling middleware instead of crashing the process.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  // Postgres SQLSTATE 23505 = unique_violation. This replaces the old
  // MongoDB duplicate-key check (`err.code === 11000`) — same user-facing
  // message, translated field name now supplied by queryModel.js's
  // throwIfError() via `err.duplicateField`.
  if (err.pgCode === '23505') {
    return res.status(409).json({ success: false, message: `That ${err.duplicateField || 'field'} is already in use.` });
  }
  // Postgres SQLSTATE 23514 = check_violation, 23502 = not_null_violation.
  // These replace Mongoose's ValidationError (invalid enum value, missing
  // required field, etc.) — same 400 response shape as before.
  if (err.pgCode === '23514' || err.pgCode === '23502') {
    return res.status(400).json({ success: false, message: err.cause?.message || 'Invalid data provided.' });
  }
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Something went wrong on our end.' : err.message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
