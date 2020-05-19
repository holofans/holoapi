module.exports = (NODE_ENV) => {
  const formatMessage = (message) => (
    NODE_ENV === 'production' ? message : `${new Date().toUTCString()} | ${message}`
  );

  return {
    info(message, ...args) {
      console.log(formatMessage(message), ...args);
    },
    warn(message, ...args) {
      console.warn(formatMessage(message), ...args);
    },
    error(message, ...args) {
      console.error(formatMessage(message), ...args);
    },
    debug(message, ...args) {
      console.trace(formatMessage(message), ...args);
    },
  };
}