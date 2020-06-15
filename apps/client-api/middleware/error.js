const { GenericError, log } = require('../../../modules');

module.exports = {
  notFoundHandler(req, res) {
    res.status(404).json({ message: 'Not found.' });
  },

  // eslint-disable-next-line no-unused-vars
  errorHandler(err, req, res, next) {
    const customError = err instanceof GenericError;
    const statusCode = customError ? 400 : 500;
    log.error(`Request body: ${JSON.stringify(req.body)}`);
    log.error(`Stack trace: ${err.stack}`);

    const errorObject = {
      message: err.message || 'Unhandled error!',
    };

    res.status(statusCode).json(errorObject);
  },

  asyncMiddleware: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },
};
