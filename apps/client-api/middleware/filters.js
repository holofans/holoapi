const { MAX_PAGE_SIZE } = require('../../../consts');
const { GenericError } = require('../../../modules');

exports.limitChecker = (req, res, next) => {
  const { limit } = req.query;
  if (limit) {
    if (!Number.isNaN(Number(limit))) {
      const limitInt = Number(limit);
      if (limitInt > MAX_PAGE_SIZE) {
        throw new GenericError(`Max page size (LIMIT) is ${MAX_PAGE_SIZE}`, { limit });
      }
    } else {
      throw new GenericError('Query var limit is expected to be a number, but got non-numeric.', { limit });
    }
  }
  next();
};
