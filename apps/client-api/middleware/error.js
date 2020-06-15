const { logger } = require('../../../modules');

module.exports = {
  notFoundHandler(req, res) {
    res.status(404).json({ error: 404 });
  },

  // eslint-disable-next-line no-unused-vars
  errorHandler(err, req, res, next) {
    // const customError = err instanceof CustomAppError;
    // const statusCode = customError ? 400 : 500;
    const statusCode = 500;
    logger.error(`Request body: ${JSON.stringify(req.body)}`);
    logger.error(`Original error: ${err}`);
    logger.error(`Stack trace: ${err.stack}`);


    const errorObj = {
      message: err.message || 'Unhandled error!',
    };

    res.status(statusCode).json(errorObj);
  },
};
