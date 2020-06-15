const { Op } = require('sequelize');
const { Router } = require('express');
const moment = require('moment-timezone');
const consts = require('../../../../consts');
const { db, memcached } = require('../../../../modules');
const { asyncMiddleware } = require('../../middleware/error');

const router = new Router();

// extended: If true, returns more fields
// include: Comma-separated list of included entities (only 'channel' atm)
module.exports = router.get('/', asyncMiddleware(async (req, res) => {
  const { extended, include } = req.query;
  const cacheKey = extended === 'true' ? `extendedLive+${include}` : `live+${include}`;
  const cache = await memcached.get(cacheKey);
  const liveCache = cache ? JSON.parse(cache) : {};
  liveCache.cached = !!Object.keys(liveCache).length;
  if (liveCache.cached) {
    return res.json(liveCache);
  }

  const results = {
    live: [],
    upcoming: [],
    ended: [],
    cached: false,
  };

  const attributes = [
    'yt_video_key',
    'bb_video_id',
    'title',
    'thumbnail',
    'status',
    'live_schedule',
    'live_start',
    'live_end',
    'live_viewers',
    'is_uploaded',
  ];
  const includeModels = [];

  if (extended === 'true') {
    attributes.push(
      'description',
      'published_at',
      'late_secs',
      'duration_secs',
      'is_captioned',
      'is_licensed',
      'is_embeddable',
    );
  }

  if (include) {
    const includeMap = {
      channel: {
        association: 'channel',
      },
    };

    include.split(',').forEach((model) => {
      includeModels.push(includeMap[model]);
    });
  }

  const videos = await db.Video.findAll({
    attributes,
    include: includeModels,
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
    attributes,
    where: {
      live_end: { [Op.gte]: nowMoment.clone().subtract(consts.VIDEOS_PAST_HOURS, 'hour').toISOString() },
    },
  });
  results.ended = pastVideos;

  memcached.set(cacheKey, JSON.stringify(results), consts.CACHE_TTL.LIVE);

  return res.json(results);
}));
