module.exports = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Include stack trace in development mode
  });
};