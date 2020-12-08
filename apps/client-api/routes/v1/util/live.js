const { Op } = require('sequelize');
const moment = require('moment-timezone');
const { STATUSES, VIDEOS_PAST_HOURS, CACHE_TTL, ORGANIZATIONS } = require('../../../../../consts');
const { db, GenericError } = require('../../../../../modules');
const cacheService = require('../../../services/CacheService');
const { RESPONSE_FIELDS } = require('../../../../../consts/v1_consts');

module.exports = async (
  cacheKey, channel_id, max_upcoming_hours, lookback_hours, hide_channel_desc, channel_simple,
) => {
  const results = {
    live: [],
    upcoming: [],
    ended: [],
    cached: true,
  };

  const nowMoment = moment();

  const videos = await db.Video.findAll({
    attributes: RESPONSE_FIELDS.LIVE_VIDEO,
    include: [
      {
        association: 'channel',
        attributes: +hide_channel_desc ? RESPONSE_FIELDS.CHANNEL_SIMPLE : RESPONSE_FIELDS.CHANNEL,
        where: {
          organization: ORGANIZATIONS.HOLOLIVE,
          ...channel_id && { id: channel_id } },
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
      // eslint-disable-next-line no-param-reassign
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
    throw new GenericError('Cannot ask for more than 12 hours of lookback, try video endpoint instead',
      this.arguments);
  } else {
    const pastVideos = await db.Video.findAll({
      attributes: RESPONSE_FIELDS.LIVE_VIDEO,
      include: [
        {
          association: 'channel',
          attributes: +hide_channel_desc ? RESPONSE_FIELDS.CHANNEL_SIMPLE : RESPONSE_FIELDS.CHANNEL,
          where: {
            organization: ORGANIZATIONS.HOLOLIVE,
            ...channel_id && { id: channel_id },
          },
        },
      ],
      where: {
        live_end: { [Op.gte]: nowMoment.clone().subtract(lookback || VIDEOS_PAST_HOURS, 'hour').toISOString() },
      },
    });
    results.ended = pastVideos;
  }

  const stringResp = JSON.stringify(results);
  cacheService.saveStringToCache(cacheKey, stringResp, CACHE_TTL.LIVE);

  return stringResp;
};
