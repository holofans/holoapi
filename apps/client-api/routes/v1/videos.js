const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../../modules');
const { RESPONSE_FIELDS } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');

const router = new Router();

router.get('/', limitChecker, asyncMiddleware(async (req, res) => {
  const {
    limit = 25,
    offset = 0,
    sort = 'published_at',
    order = 'desc',
    title,
    published_at,
    status,
    is_uploaded,
    is_captioned,
  } = req.query;

  const where = {
    ...title && { title: { [Op.iLike]: `%${title}%` } },
    // TODO: Figure out and fix timezones
    ...published_at && { published_at: { [Op.gte]: moment(published_at).startOf('day') } },
    ...status && { status },
    // Hacky way to convert string booleans into real booleans
    ...is_uploaded && { is_uploaded: JSON.parse(is_uploaded.toLowerCase()) },
    ...is_captioned && { is_captioned: JSON.parse(is_captioned.toLowerCase()) },
  };

  const { rows, count } = await db.Video.findAndCountAll({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
      },
    ],
    where,
    order: [[sort, order]],
    limit,
    offset,
  });

  const results = {
    count: rows.length,
    total: count,
    videos: rows,
  };

  res.json(results);
}));

router.get('/:video_id', asyncMiddleware(async (req, res) => {
  const { video_id } = req.params;

  const video = await db.Video.findOne({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
      },
    ],
    where: {
      [Op.or]: {
        yt_video_key: video_id,
        bb_video_id: video_id,
      },
    },
    rejectOnEmpty: true, // Handled into 404
  });

  res.json(video);
}));

module.exports = router;
