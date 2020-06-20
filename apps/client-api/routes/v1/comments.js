const sequelize = require('sequelize');
const { Router } = require('express');
const { fixchar } = require('fixchar');
const { db } = require('../../../../modules');
const { RESPONSE_FIELDS, CACHE_TTL, TABLES } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');
const cacheService = require('../../services/CacheService');

const { Op } = sequelize;
// Initialize Router
const router = new Router();

/**
 * Gets a video object with all its comments.
 * @param {object} whereCondition Parameters for where clause.
 */
const getVideoWithComments = (whereCondition) => db.Video.findOne({
  attributes: RESPONSE_FIELDS.VIDEO,
  include: [
    {
      association: TABLES.VIDEO_COMMENT,
      attributes: RESPONSE_FIELDS.VIDEO_COMMENT_SIMPLE,
    },
    {
      association: TABLES.CHANNEL,
      attributes: RESPONSE_FIELDS.CHANNEL,
    },
  ],
  where: whereCondition,
  rejectOnEmpty: true,
});

router.get('/youtube/:yt_video_key', asyncMiddleware(async (req, res) => {
  const { yt_video_key } = req.params;

  const video = await getVideoWithComments({ yt_video_key });

  return res.set('Cache-Control', 'public, max-age=3000').json(video);
}));

router.get('/video/:id', async (req, res) => {
  const { id } = req.params;

  const video = await getVideoWithComments({ id });

  return res.set('Cache-Control', 'public, max-age=3000').json(video);
});

const getCacheKey = (q, channelId) => `com?q=${q},cid=${channelId}`;

/**
 *
 * @param {string} q a sanitized query string.
 * @param {Integer} channelId the primary key that identifies the channel
 */
const searchFromDBOrCache = async (q, channelId = null) => {
  const cacheKey = getCacheKey(q, channelId);
  const cache = await cacheService.getFromCache(cacheKey);
  if (cache.cached) {
    return cache;
  }

  const results = {
    data: await db.Video.findAll({
      attributes: RESPONSE_FIELDS.VIDEO,
      include: [
        {
          association: TABLES.VIDEO_COMMENT,
          attributes: RESPONSE_FIELDS.VIDEO_COMMENT_SIMPLE,
          where: sequelize.where(
            sequelize.fn('lower', sequelize.col('message')),
            {
              [Op.like]: `%${q}%`,
            },
          ),
        },
        {
          association: TABLES.CHANNEL,
          attributes: RESPONSE_FIELDS.CHANNEL,
        },
      ],
      order: [['published_at', 'desc']],
      rejectOnEmpty: true,
      ...channelId && { where: { channel_id: channelId } },
    }),
    cached: false,
  };

  await cacheService.saveToCache(cacheKey, (results), CACHE_TTL.LIVE);
  return results;
};

router.get('/search', limitChecker, asyncMiddleware(async (req, res) => {
  // Get query:
  const { limit = 25, offset = 0, channel_id = null, q } = req.query;

  const nLimit = +limit;
  const nOffset = +offset;

  if (!q || q.length < 1) throw new Error('expected ?q param');

  // sanitizing channel id parameter to Integer
  const sanitizedChannelId = (channel_id && parseInt(channel_id, 10)) ? parseInt(channel_id, 10) : null;
  // sanitizing query to remove full width alphanumeric and half-width kana.
  const sanitizedQuery = fixchar(q).trim().toLowerCase();

  const { data, cached } = searchFromDBOrCache(sanitizedQuery, sanitizedChannelId);

  // Check cache, and return if it exists
  const subslice = data.slice(nOffset, nOffset + nLimit);
  const resp = {
    query: sanitizedQuery, // bounce back the sanitized query in case the client is interested.
    nextOffset: nOffset + subslice.length,
    count: subslice.length,
    total: data.length,
    data: subslice,
    cached,
  };

  // Return results
  return res.json(resp);
}));

module.exports = router;
