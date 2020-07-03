const { Op } = require('sequelize');
const { Router } = require('express');
const moment = require('moment-timezone');
const { STATUSES, VIDEOS_PAST_HOURS, CACHE_TTL } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { db } = require('../../../../modules');
const cacheService = require('../../services/CacheService');
const { RESPONSE_FIELDS } = require('../../../../consts');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const { channel_id } = req.query;
  const cacheKey = channel_id ? `live-${channel_id}` : 'live';
  const cache = await cacheService.getFromCache(cacheKey);
  if (cache.cached) {
    return res.json(cache);
  }

  const results = {
    live: [],
    upcoming: [],
    ended: [],
    cached: false,
  };

  const videos = await db.Video.findAll({
    attributes: RESPONSE_FIELDS.LIVE_VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
        ...channel_id && { where: { id: channel_id } },
      },
    ],
    where: {
      status: [STATUSES.LIVE, STATUSES.UPCOMING],
    },
  });

  const nowMoment = moment();

  videos.forEach((video) => {
    if (video.status === STATUSES.UPCOMING) {
      results.upcoming.push(video);
      return;
    }
    if (video.status === STATUSES.LIVE || nowMoment.isSameOrAfter(moment(video.live_schedule))) {
      results.live.push(video);
    }
  });

  const pastVideos = await db.Video.findAll({
    attributes: RESPONSE_FIELDS.LIVE_VIDEO,
    include: [
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
        ...channel_id && { where: { id: channel_id } },
      },
    ],
    where: {
      live_end: { [Op.gte]: nowMoment.clone().subtract(VIDEOS_PAST_HOURS, 'hour').toISOString() },
    },
  });
  results.ended = pastVideos;

  cacheService.saveToCache(cacheKey, results, CACHE_TTL.LIVE);

  return res.json(results);
}));

module.exports = router;
