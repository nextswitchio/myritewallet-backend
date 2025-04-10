const winston = require('winston');

// Define log levels and their corresponding colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

// Apply colors to log levels
winston.addColors(logLevels.colors);

// Create a logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `${timestamp} [${level}]: ${message}\n${stack}` // Log stack trace for errors
        : `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug' // Default log level
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

module.exports = {
  /**
   * Log an informational message.
   * @param {string} message - The message to log.
   */
  info: (message) => logger.info(message),

  /**
   * Log a warning message.
   * @param {string} message - The message to log.
   */
  warn: (message) => logger.warn(message),

  /**
   * Log an error message.
   * @param {string|Error} error - The error message or Error object to log.
   */
  error: (error) => {
    if (error instanceof Error) {
      logger.error(error.message, { stack: error.stack });
    } else {
      logger.error(error);
    }
  },

  /**
   * Log a debug message.
   * @param {string} message - The message to log.
   */
  debug: (message) => logger.debug(message),

  /**
   * Log an HTTP request.
   * @param {string} message - The HTTP request details to log.
   */
  http: (message) => logger.http(message)
};