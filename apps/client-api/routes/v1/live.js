const { Op } = require('sequelize');
const { Router } = require('express');
const moment = require('moment-timezone');
const consts = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { db, log, memcached } = require('../../../../modules');
const cacheService = require('../../services/CacheService');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const cacheKey = 'live';
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

  const videoFields = [
    'yt_video_key',
    'bb_video_id',
    'title',
    'thumbnail',
    'status',
    'live_schedule',
    'live_start',
    'live_end',
    'live_viewers',
  ];
  const channelFields = [
    'yt_channel_id',
    'bb_space_id',
    'name',
    'photo',
    'twitter_link',
  ];

  const videos = await db.Video.findAll({
    attributes: videoFields,
    include: [
      {
        association: 'channel',
        attributes: channelFields,
      },
    ],
    where: {
      status: [consts.STATUSES.LIVE, consts.STATUSES.UPCOMING],
    },
  });

  const nowMoment = moment();

  videos.forEach((video) => {
    if (video.status === consts.STATUSES.UPCOMING) {
      results.upcoming.push(video);
      return;
    }
    if (video.status === consts.STATUSES.LIVE || nowMoment.isSameOrAfter(moment(video.live_schedule))) {
      results.live.push(video);
    }
  });

  const pastVideos = await db.Video.findAll({
    attributes: videoFields,
    include: [
      {
        association: 'channel',
        attributes: channelFields,
      },
    ],
    where: {
      live_end: { [Op.gte]: nowMoment.clone().subtract(consts.VIDEOS_PAST_HOURS, 'hour').toISOString() },
    },
  });
  results.ended = pastVideos;

  cacheService.saveToCache(cacheKey, JSON.stringify(results), consts.CACHE_TTL.LIVE);

  return res.json(results);
}));

module.exports = router;
