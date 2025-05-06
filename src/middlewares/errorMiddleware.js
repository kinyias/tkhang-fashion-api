const ApiError = require('../lib/ApiError');

// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }
    // Custom error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
  
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token hết hạn' });
    }
  
    // Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Resource already exists' });
    }
  
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Resource not found' });
    }
  
    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
  
    return res.status(statusCode).json({
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  module.exports = {
    errorHandler
  };