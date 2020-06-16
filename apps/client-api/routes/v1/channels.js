const { Op } = require('sequelize');
const { Router } = require('express');
const consts = require('../../../../consts');
const { db } = require('../../../../modules');
const { asyncMiddleware } = require('../../middleware/error');
const cacheService = require('../../services/CacheService');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, sort = 'id', order = 'asc', name } = req.query;
  const cacheKey = `channels;${offset}-${limit};${sort}-${order};${name || ''}`;

  const cache = await cacheService.getFromCache(cacheKey);
  if (cache.cached) {
    return res.json(cache);
  }

  const results = {
    channels: [],
    cached: false,
  };

  const where = {};

  if (name) {
    where.name = { [Op.iLike]: `%${name}%` };
  }

  const channels = await db.Channel.findAll({
    attributes: ['yt_channel_id', 'bb_space_id', 'name', 'description', 'photo', 'published_at', 'twitter_link'],
    where,
    order: [[sort, order]],
    limit,
    offset,
  });
  results.channels = channels;

  cacheService.saveToCache(cacheKey, JSON.stringify(results), consts.CACHE_TTL.CHANNELS);

  return res.json(results);
}));

module.exports = router;
