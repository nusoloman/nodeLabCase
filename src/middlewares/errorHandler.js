const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(
    `${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`,
    { stack: err.stack }
  );
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
