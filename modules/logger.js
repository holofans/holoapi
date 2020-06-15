const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.splat(),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.printf((info) => (Object.keys(info.metadata).length
      ? `${info.timestamp} | [${info.level}] ${info.message} | ${JSON.stringify(info.metadata)}`
      : `${info.timestamp} | [${info.level}] ${info.message}`)),
  ),
  transports: [
    new transports.Console({
      level: 'verbose',
    }),
  ],
});

module.exports = logger;
