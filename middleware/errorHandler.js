/**
 * Centralised error handler — must be registered LAST in Express.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  // Multer / file errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10} MB`,
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} →`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
