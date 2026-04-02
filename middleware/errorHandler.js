/**
 * Global Express error handler.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: `Validation failed: ${messages.join(', ')}` });
  }

  // Mongoose Cast Error (invalid ID format)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Multer Errors (already handled in routes occasionally, but good to have here)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size limit exceeded (max 5 MB).' });
  }

  // Generic Error
  const status = err.status || 500;
  const message = err.message || 'Internal server error. Please try again later.';

  return res.status(status).json({ error: message });
}

module.exports = errorHandler;
