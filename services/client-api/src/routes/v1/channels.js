const {Router} = require('express');
const {HoloChannel} = require('../../classes');
const {consts, Firestore, Memcached, log} = require('../../library');

// Initialize Router
const router = new Router();

router.get('/', (req, res) => {
  (async () => {
    // Check cache, and return if it exists
    const liveCache = await Memcached.get('channels');
    if (liveCache) {
      try {
        liveCache = JSON.parse(liveCache);
      } catch (error) {
        liveCache = null;
      }
      if (liveCache) {
        liveCache.cached = true;
        return liveCache;
      }
    }

    // Result structure
    const results = {
      channels: [],
    };

    // Look for videos that are live or upcoming
    const videoCollection = Firestore.collection('channel');
    const channels = await videoCollection.get();

    // Run through all results
    channels.forEach((video) => {
      const channelData = video.data();
      const channelObj = new HoloChannel(channelData);
      results.channels.push(channelObj.toJSON());
    });

    // Save result to cache
    Memcached.set('channels', JSON.stringify(results), consts.CACHE_TTL.CHANNELS);

    // Return results
    return results;
  })()
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.json({error: err.message});
      });
});

module.exports = router;
