const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const appLogDir = path.join(logDir, 'crawler-youtube');
if (!fs.existsSync(appLogDir)) fs.mkdirSync(appLogDir);

// Log by date
const logDirDate = path.join(appLogDir, new Date().toISOString().slice(0, 10));
if (!fs.existsSync(logDirDate)) fs.mkdirSync(logDirDate);

// New logger instance
const logger = winston.createLogger();

// Default configuration
logger.configure({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    winston.format.printf((info) => `${info.timestamp} | [${info.level}] ${info.message} | ${JSON.stringify(info.metadata)}`),
  ),
  transports: [
    new (winston.transports.File)({
      name: 'all-info',
      filename: path.join(logDirDate, 'info.log'),
      level: 'info',
    }),
    new (winston.transports.File)({
      name: 'all-errors',
      filename: path.join(logDirDate, 'error.log'),
      level: 'error',
    }),
  ],
});

// Development environment, writes debug logs, and outputs to console
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({ level: ['debug'], colorize: true }));
  logger.add(new winston.transports.File({
    name: 'all-debug',
    filename: path.join(logDirDate, 'debug.log'),
    level: 'debug',
  }));
}

// Export logger instance
module.exports = logger;
