const { Op } = require('sequelize');
const { Router } = require('express');
const moment = require('moment-timezone');
const { STATUSES, VIDEOS_PAST_HOURS, CACHE_TTL } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { db, GenericError } = require('../../../../modules');
const cacheService = require('../../services/CacheService');
const { RESPONSE_FIELDS } = require('../../../../consts');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const { channel_id, max_upcoming_hours, lookback_hours, hide_channel_desc, channel_simple } = req.query;
  if (+channel_simple && +hide_channel_desc) {
    throw new GenericError('Cannot have both "channel_simple" and "hide_channel_desc". Choose one or the other.', req.query);
  }
  
  const cacheKey = (channel_id || max_upcoming_hours || lookback_hours || hide_channel_desc || channel_simple)
    ? `live-${channel_id}-${max_upcoming_hours}-${lookback_hours}-${hide_channel_desc}-${channel_simple}` : 'live';

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

  const nowMoment = moment();

  const videos = await db.Video.findAll({
    attributes: RESPONSE_FIELDS.LIVE_VIDEO,
    include: [
      {
        association: 'channel',
        attributes: +hide_channel_desc ? RESPONSE_FIELDS.CHANNEL_SIMPLE : RESPONSE_FIELDS.CHANNEL,
        ...channel_id && { where: { id: channel_id } },
      },
    ],
    where: {
      status: [STATUSES.LIVE, STATUSES.UPCOMING],
      ...(+max_upcoming_hours) && {
        live_schedule: { [Op.lt]: nowMoment.clone().add(max_upcoming_hours, 'hour').toISOString() },
      },
    },
  });

  videos.forEach((video) => {
    if (channel_simple === '1') {
      video.channel = video.channel.yt_channel_id || video.channel.bb_space_id;
    }
    if (video.status === STATUSES.UPCOMING) {
      results.upcoming.push(video);
      return;
    }
    if (video.status === STATUSES.LIVE || nowMoment.isSameOrAfter(moment(video.live_schedule))) {
      results.live.push(video);
    }
  });

  const lookback = +lookback_hours;
  if (lookback === 0) {
    results.ended = [];
  } else if (lookback >= 12) {
    throw new GenericError('Cannot ask for more than 12 hours of lookback, try video endpoint instead', req.query);
  } else {
    const pastVideos = await db.Video.findAll({
      attributes: RESPONSE_FIELDS.LIVE_VIDEO,
      include: [
        {
          association: 'channel',
          attributes: +hide_channel_desc ? RESPONSE_FIELDS.CHANNEL_SIMPLE : RESPONSE_FIELDS.CHANNEL,
          ...channel_id && { where: { id: channel_id } },
        },
      ],
      where: {
        live_end: { [Op.gte]: nowMoment.clone().subtract(lookback || VIDEOS_PAST_HOURS, 'hour').toISOString() },
      },
    });
    results.ended = pastVideos;
  }

  cacheService.saveToCache(cacheKey, results, CACHE_TTL.LIVE);

  return res.json(results);
}));

module.exports = router;
