const { Router } = require('express');
const computeLive = require('./util/live.js');
const { asyncMiddleware } = require('../../middleware/error');
const { GenericError } = require('../../../../modules');
const cacheService = require('../../services/CacheService');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const { channel_id, max_upcoming_hours, lookback_hours, hide_channel_desc, channel_simple } = req.query;
  if (channel_simple && hide_channel_desc) {
    throw new GenericError(
      'Cannot have both "channel_simple" and "hide_channel_desc". Choose one or the other.',
      req.query,
    );
  }

  const cacheKey = (channel_id || max_upcoming_hours || lookback_hours || hide_channel_desc || channel_simple)
    ? `live-${channel_id}-${max_upcoming_hours}-${lookback_hours}-${hide_channel_desc}-${channel_simple}` : 'live';

  const cache = await cacheService.getStringFromCache(cacheKey); // nonnull indicates cached.
  res.setHeader('Content-Type', 'application/json');

  if (cache) {
    return res.end(cache);
  }
  return res.end(
    await computeLive(cacheKey, channel_id, max_upcoming_hours, lookback_hours, hide_channel_desc, channel_simple),
  );
}));

module.exports = router;
