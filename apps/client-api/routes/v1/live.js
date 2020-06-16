const { Op } = require('sequelize');
const { Router } = require('express');
const moment = require('moment-timezone');
const consts = require('../../../../consts');
const { db, log, memcached } = require('../../../../modules');
const { asyncMiddleware } = require('../../middleware/error');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const cacheKey = 'live';
  try {
    const cache = await memcached.get(cacheKey);
    const liveCache = cache ? JSON.parse(cache) : {};
    liveCache.cached = !!Object.keys(liveCache).length;
    if (liveCache.cached) {
      return res.json(liveCache);
    }
  } catch (e) {
    log.error('Error fetching cache');
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

  try {
    // Side effect: Promise ignored
    memcached.set(cacheKey, JSON.stringify(results), consts.CACHE_TTL.LIVE);
  } catch (e) {
    log.error(`Error saving to cache: ${e.message}`);
  }

  return res.json(results);
}));

module.exports = router;
