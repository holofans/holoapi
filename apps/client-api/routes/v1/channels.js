const { Op } = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../../modules');
const { RESPONSE_FIELDS } = require('../../../../consts');
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
    attributes: RESPONSE_FIELDS.CHANNEL,
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

router.get('/:channel_id', asyncMiddleware(async (req, res) => {
  const { channel_id } = req.params;

  const key = parseInt(channel_id, 10) ? 'bb_space_id' : 'yt_channel_id';
  const channel = await db.Channel.findOne({
    attributes: RESPONSE_FIELDS.CHANNEL,
    where: { [key]: channel_id },
    rejectOnEmpty: true, // Handled into 404
  });

  res.json(channel);
}));

module.exports = router;
