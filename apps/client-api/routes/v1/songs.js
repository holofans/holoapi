const { Router } = require('express');
const moment = require('moment-timezone');
const { HoloVideo } = require('../../classes');
const { consts, Firestore, Memcached, log } = require('../../library');

// Initialize Router
const router = new Router();

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  const memcacheVideoId = `songs:${videoId}`;
  const cache = await Memcached.get(memcacheVideoId);
  const liveCache = cache ? JSON.parse(cache) : {};
  liveCache.cached = !!Object.keys(liveCache).length;
  if (liveCache.cached) return liveCache;

  const results = {}; // TODO define this.
  const doc = await Firestore.collection('videocomment').get();
  // TODO not finished here.

  const videoData = doc.data();

  if (!videoData) throw Error('videoId not found');
  Memcached.set(
    memcacheVideoId,
    JSON.stringify(results),
    consts.CACHE_TTL.SONG_TIMINGS
  );

  return res.set('Cache-Control', 'public, max-age=3000').json(videoData);
});

router.get('/search', async (req, res) => {
  // Get query:
  const { q } = req.query;

  if (!q) throw new Error('expected ?q param');

  // Check cache, and return if it exists
  const cache = await Memcached.get('live');
  const liveCache = cache ? JSON.parse(cache) : {};
  liveCache.cached = !!Object.keys(liveCache).length;
  if (liveCache.cached) return liveCache;

  // Result structure
  // TODO define this
  const results = {
  };

  const videoCollection = Firestore.collection('videocomment');

  // TODO not finished here.
  Memcached.set('live', JSON.stringify(results), consts.CACHE_TTL.SONG_SEARCH);

  // Return results
  return res.json(results);
});

module.exports = router;
