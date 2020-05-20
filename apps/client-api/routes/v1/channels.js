const { Router } = require('express');
const { HoloChannel } = require('../../classes');
const { consts, Firestore, Memcached, log } = require('../../library');

// Initialize Router
const router = new Router();

module.exports = router.get('/', async (req, res) => {
  // Check cache, and return if it exists
  const cache = await Memcached.get('channels');
  const liveCache = cache ? JSON.parse(cache) : {};
  liveCache.cached = !!Object.keys(liveCache).length;
  if (liveCache.cached) return liveCache;

  // Result structure
  const results = {
    channels: [],
  };

  // Look for videos that are live or upcoming
  const videoCollection = Firestore.collection('channel');
  const channels = await videoCollection.get();

  // Run through all results
  channels.map(video => {
    const channelData = video.data();
    const channelObj = new HoloChannel(channelData);
    return results.channels.push(channelObj.toJSON());
  });

  // Save result to cache
  Memcached.set('channels', JSON.stringify(results), consts.CACHE_TTL.CHANNELS);

  // Return results
  return res.json(results);
});
