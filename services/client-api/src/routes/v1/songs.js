const {Router} = require('express');
const moment = require('moment-timezone');
const {HoloVideo} = require('../../classes');
const {consts, Firestore, Memcached, log} = require('../../library');

// Initialize Router
const router = new Router();

router.get('/:videoId', (req, res) => {
  (async () => {
    const {videoId} = req.params;

    const memcacheVideoId = `songs:${videoId}`;
    const liveCache = await Memcached.get(memcacheVideoId);
    if (liveCache) {
      try {
        liveCache = JSON.parse(liveCache);
        liveCache.cached = true;
        return liveCache;
      } catch (error) {
        liveCache = null;
      }
    }

    const results = {}; // TODO define this.
    const doc = await Firestore.collection('videocomment').get();
    // TODO not finished here.

    const videoData = doc.data();

    if (!videoData) throw Error('videoId not found');
    Memcached.set(
        memcacheVideoId,
        JSON.stringify(results),
        consts.CACHE_TTL.SONG_TIMINGS);
    return videoData;
  })()
      .then((result) => {
        res
            .set('Cache-Control', `public, max-age=3000`)
            .json(result);
      })
      .catch((err) => {
        res.json({error: err.message});
      });
});

router.get('/search', (req, res) => {
  (async () => {
    // Get query:
    const {q} = req.query;

    if (!q) throw new Error('expected ?q param');

    // Check cache, and return if it exists
    const liveCache = await Memcached.get('live');
    if (liveCache) {
      try {
        liveCache = JSON.parse(liveCache);
        liveCache.cached = true;
        return liveCache;
      } catch (error) {
        liveCache = null;
      }
    }

    // Result structure
    // TODO define this
    const results = {
    };

    const videoCollection = Firestore.collection('videocomment');

    // TODO not finished here.
    Memcached.set('live', JSON.stringify(results), consts.CACHE_TTL.SONG_SEARCH);

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
