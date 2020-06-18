const { Op } = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../../modules');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');

const router = new Router();

router.get('/', limitChecker, asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, sort = 'id', order = 'asc', name } = req.query;

  const where = {};

  if (name) {
    where.name = { [Op.iLike]: `%${name}%` };
  }

  const { rows, count } = await db.Channel.findAndCountAll({
    attributes: ['yt_channel_id', 'bb_space_id', 'name', 'description', 'photo', 'published_at', 'twitter_link'],
    where,
    order: [[sort, order]],
    limit,
    offset,
  });
  const results = {
    count: rows.length,
    total: count,
    channels: rows,
  };

  res.json(results);
}));

module.exports = router;
