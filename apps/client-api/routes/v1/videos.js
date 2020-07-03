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
    start_date,
    end_date,
    status,
    is_uploaded,
    is_captioned,
    channel_id,
  } = req.query;

  const where = {
    ...title && { title: { [Op.iLike]: `%${title}%` } },
    // TODO: Figure out and fix timezones
    ...start_date && !end_date && { published_at: { [Op.gte]: moment(start_date).startOf('day') } },
    ...end_date && !start_date && { published_at: { [Op.lte]: moment(end_date).endOf('day') } },
    ...start_date && end_date && {
      published_at: {
        [Op.between]:
          [
            moment(start_date).startOf('day'),
            moment(end_date).endOf('day'),
          ],
      },
    },
    ...status && { status },
    ...is_uploaded && { is_uploaded: is_uploaded === '1' },
    ...is_captioned && { is_captioned: is_captioned === '1' },
  };

  const { rows, count } = await db.Video.findAndCountAll({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
        ...channel_id && { where: { id: channel_id } },
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

router.get('/:id', asyncMiddleware(async (req, res) => {
  const { id } = req.params;
  const { with_comments } = req.query;

  const video = await db.Video.findOne({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
      },
      ...(with_comments === '1' ? [{
        association: 'comments',
        attributes: RESPONSE_FIELDS.VIDEO_COMMENT,
      }] : []),
    ],
    where: { id },
    rejectOnEmpty: true,
  });

  res.json(video);
}));

router.get('/youtube/:yt_video_key', asyncMiddleware(async (req, res) => {
  const { yt_video_key } = req.params;
  const { with_comments } = req.query;

  const video = await db.Video.findOne({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
      },
      ...(with_comments === '1' ? [{
        association: 'comments',
        attributes: RESPONSE_FIELDS.VIDEO_COMMENT,
      }] : []),
    ],
    where: { yt_video_key },
    rejectOnEmpty: true,
  });

  res.json(video);
}));

router.get('/bilibili/:bb_video_id', asyncMiddleware(async (req, res) => {
  const { bb_video_id } = req.params;

  const video = await db.Video.findOne({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
      },
    ],
    where: { bb_video_id },
    rejectOnEmpty: true,
  });

  res.json(video);
}));

module.exports = router;
