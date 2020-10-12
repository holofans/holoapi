const { Op } = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../../modules');
const { RESPONSE_FIELDS, ORGANIZATIONS } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');

const router = new Router();

router.get('/', limitChecker, asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, sort = 'id', order = 'asc', name } = req.query;

  const { rows, count } = await db.Channel.findAndCountAll({
    attributes: RESPONSE_FIELDS.CHANNEL,
    where: {
      organization: ORGANIZATIONS.HOLOLIVE,
      ...name && { name: { [Op.iLike]: `%${name}%` } },
    },
    order: [[sort, order]],
    limit,
    offset,
  });
  const results = {
    count: rows.length,
    total: count,
    channels: rows,
  };

  // Get videos per channel
  const { rows: videoRows } = await db.Video.findAndCountAll({
    attributes: ['channel_id', [db.client.fn('COUNT', 'channel_id'), 'video_count']],
    group: ['channel_id'],
    where: { status: 'past' },
  });

  // Distribute to respective channel objects
  videoRows.forEach((videoRow) => {
    results.channels.forEach((channel, index) => {
      if (Number(videoRow.channel_id) === Number(channel.id)) {
        results.channels[index].dataValues.video_original = Number(videoRow.dataValues.video_count);
      }
    });
  });

  res.json(results);
}));

router.get('/:id', asyncMiddleware(async (req, res) => {
  const { id } = req.params;

  const channel = await db.Channel.findOne({
    attributes: RESPONSE_FIELDS.CHANNEL,
    where: { id },
    rejectOnEmpty: true,
  });

  res.json(channel);
}));

router.get('/youtube/:yt_channel_id', asyncMiddleware(async (req, res) => {
  const { yt_channel_id } = req.params;

  const channel = await db.Channel.findOne({
    attributes: RESPONSE_FIELDS.CHANNEL,
    where: { yt_channel_id },
    rejectOnEmpty: true,
  });

  res.json(channel);
}));

router.get('/bilibili/:bb_space_id', asyncMiddleware(async (req, res) => {
  const { bb_space_id } = req.params;

  const channel = await db.Channel.findOne({
    attributes: RESPONSE_FIELDS.CHANNEL,
    where: { bb_space_id },
    rejectOnEmpty: true,
  });

  res.json(channel);
}));

module.exports = router;
