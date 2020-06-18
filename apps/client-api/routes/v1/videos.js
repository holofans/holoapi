const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../../modules');
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

  const where = {};

  if (title) {
    where.title = { [Op.iLike]: `%${title}%` };
  }
  if (published_at) {
    where.published_at = { [Op.gte]: moment(published_at).startOf('day') };
  }
  if (status) {
    where.status = status;
  }
  if (is_uploaded) {
    where.is_uploaded = !!is_uploaded;
  }
  if (is_captioned) {
    where.is_captioned = !!is_captioned;
  }

  const { rows, count } = await db.Video.findAndCountAll({
    attributes: [
      'yt_video_key',
      'bb_video_id',
      'title',
      'thumbnail',
      'published_at',
      'status',
      'live_schedule',
      'live_start',
      'live_end',
      'is_uploaded',
      'duration_secs',
      'is_captioned',
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

module.exports = router;
