const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Log by date
const logDirDate = path.join(logDir, new Date().toISOString().slice(0, 10));
if (!fs.existsSync(logDirDate)) fs.mkdirSync(logDirDate);

// New logger instance
const logger = createLogger();

// Default configuration
logger.configure({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.splat(),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.printf((info) => `${info.timestamp} | [${info.level}] ${info.message} | ${JSON.stringify(info.metadata)}`),
  ),
  transports: [
    new transports.File({
      name: 'all-info',
      filename: path.join(logDirDate, 'info.log'),
      level: 'info',
    }),
    new transports.File({
      name: 'all-errors',
      filename: path.join(logDirDate, 'error.log'),
      level: 'error',
    }),
  ],
});

// Development environment, writes debug logs, and outputs to console
if (process.env.NODE_ENV === 'development') {
  logger.add(new transports.Console({
    level: 'verbose',
    colorize: true,
  }));
  logger.add(new transports.File({
    name: 'all-debug',
    filename: path.join(logDirDate, 'debug.log'),
    level: 'debug',
  }));
}

// Export logger instance
module.exports = logger;
