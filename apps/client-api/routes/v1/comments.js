const { Op } = require('sequelize');
const { Router } = require('express');
const { fixchar } = require('fixchar');
const { RESPONSE_FIELDS, CACHE_TTL } = require('../../../../consts');
const { db, GenericError } = require('../../../../modules');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');
const cacheService = require('../../services/CacheService');

const router = new Router();

const getTotalCount = async (q, channel_id) => {
  const count = await db.VideoComment.count({
    col: ['video_id'],
    distinct: true,
    where: { message: { [Op.iLike]: `%${q}%` } },
    ...channel_id && {
      include: [
        {
          association: 'video',
          attributes: [],
          where: { channel_id },
        },
      ],
    },
  });

  return count;
};

const getVideoIds = async (q, channel_id) => {
  const videoIds = await db.VideoComment.findAll({
    attributes: ['video.id'],
    include: [
      {
        association: 'video',
        attributes: [],
        ...channel_id && {
          where: { channel_id },
        },
      },
    ],
    where: { message: { [Op.iLike]: `%${q}%` } },
    group: 'video.id',
    order: [[db.VideoComment.associations.video, 'published_at', 'DESC']],
    raw: true,
  }).map(({ id }) => id);

  return videoIds;
};

router.get('/search', limitChecker, asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, channel_id, q } = req.query;

  if (!q || q.length < 1) {
    throw new GenericError('Expected ?q param');
  }
  // Sanitizing query to remove full width alphanumeric and half-width kana
  const sanitizedQuery = fixchar(q).trim();

  const cacheKey = `comments-${sanitizedQuery};offset-${offset};limit-${limit}`;
  const cache = await cacheService.getFromCache(cacheKey);
  if (cache.cached) {
    return res.json(cache);
  }

  const totalCount = getTotalCount(sanitizedQuery, channel_id);
  const videoIds = await getVideoIds(q, channel_id);
  const videoIdsInPage = videoIds.slice(+offset, +offset + +limit);

  const videos = await db.Video.findAll({
    attributes: RESPONSE_FIELDS.VIDEO,
    where: { id: videoIdsInPage },
    include: [
      {
        association: 'comments',
        attributes: RESPONSE_FIELDS.VIDEO_COMMENT,
        where: { message: { [Op.iLike]: `%${q}%` } },
      },
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
        required: true,
      }],
  });

  const results = {
    count: videos.length,
    total: await totalCount,
    query: sanitizedQuery,
    comments: videos,
    cached: false,
  };

  cacheService.saveToCache(cacheKey, results, CACHE_TTL.COMMENTS);

  return res.json(results);
}));

module.exports = router;
