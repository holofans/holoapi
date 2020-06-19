const { EmptyResultError } = require('sequelize');
const { GenericError, log } = require('../../../modules');

const sendNotFound = (res, message = 'Not found.') => {
  res.status(404).json({ message });
};

module.exports = {
  notFoundHandler(req, res) {
    sendNotFound(res);
  },

  // eslint-disable-next-line no-unused-vars
  errorHandler(err, req, res, next) {
    if (err instanceof EmptyResultError) {
      return sendNotFound(res);
    }

    const statusCode = err instanceof GenericError ? 400 : 500;
    log.error(`Request body: ${JSON.stringify(req.body)}`);
    log.error(`Stack trace: ${err.stack}`);
    const errorObject = { message: err.message || 'Unhandled error!' };

    return res.status(statusCode).json(errorObject);
  },

  asyncMiddleware: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },
};
