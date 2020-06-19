const { MAX_PAGE_SIZE } = require('../../../consts');
const { GenericError } = require('../../../modules');

exports.limitChecker = (req, res, next) => {
  const { limit } = req.query;
  if (limit && !Number.isNaN(limit)) {
    const limitInt = Number(limit);
    if (limitInt > MAX_PAGE_SIZE) {
      throw new GenericError(`Max page size (LIMIT) is ${MAX_PAGE_SIZE}`, { limit });
    }
  }
  next();
};
