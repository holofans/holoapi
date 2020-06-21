const sequelize = require('sequelize');
const { Router } = require('express');
const { fixchar } = require('fixchar');
const { db } = require('../../../../modules');
const { RESPONSE_FIELDS, CACHE_TTL } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');
const cacheService = require('../../services/CacheService');

const { Op } = sequelize;
const router = new Router();

router.get('/search', limitChecker, asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, channel_id = null, q } = req.query;

  if (!q || q.length < 1) throw new Error('expected ?q param');

  // sanitizing query to remove full width alphanumeric and half-width kana.
  const sanitizedQuery = fixchar(q).trim();

  const cacheKey = `com?q=${sanitizedQuery},cid=${channel_id},l=${limit},o=${offset}`;
  const cache = await cacheService.getFromCache(cacheKey);
  if (cache.cached) {
    return res.json(cache);
  }

  const dbQuery = {
    include: [
      {
        association: 'comments',
        attributes: RESPONSE_FIELDS.VIDEO_COMMENT_SIMPLE,
        where: {
          message: {
            [Op.iLike]: `%${sanitizedQuery}%`,
          },
        },
      },
      {
        association: 'channel',
        attributes: RESPONSE_FIELDS.CHANNEL,
      },
    ],
    order: [['published_at', 'desc']],
    // rejectOnEmpty: true,
    ...channel_id && { where: { channel_id } },
  };

  // const count = db.Video.count(dbQuery);
  const { count, rows } = await db.Video.findAndCountAll({
    subQuery: false,
    attributes: RESPONSE_FIELDS.VIDEO,
    limit,
    offset,
    ...dbQuery,
  });

  const results = {
    data: rows,
    count,
    cached: false,
    query: sanitizedQuery,
  };

  cacheService.saveToCache(cacheKey, results, CACHE_TTL.COMMENTS);

  return res.json(results);
}));

module.exports = router;
