const {Router} = require('express');
const moment = require('moment-timezone');
const {HoloVideo} = require('../../classes');
const {consts, Firestore, Memcached, log} = require('../../library');

// Initialize Router
const router = new Router();

router.get('/', (req, res) => {
  (async () => {
    // Check cache, and return if it exists
    const liveCache = await Memcached.get('live');
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
      live: [],
      upcoming: [],
      ended: [],
    };

    // Look for videos that are live or upcoming
    const videoCollection = Firestore.collection('video')
        .where('status', 'in', [consts.VIDEO_STATUSES.LIVE, consts.VIDEO_STATUSES.UPCOMING]);
    const videos = await videoCollection.get();

    // Get current timestamp
    const nowMoment = moment();

    // Run through all results
    videos.forEach((video) => {
      const videoData = video.data();
      const videoObj = new HoloVideo(videoData);
      if (videoData.status === consts.VIDEO_STATUSES.LIVE || nowMoment.isSameOrAfter(moment(videoData.liveSchedule))) {
        results.live.push(videoObj.toJSON());
      } else if (videoData.status === consts.VIDEO_STATUSES.UPCOMING) {
        results.upcoming.push(videoObj.toJSON());
      }
    });

    // Look for videos that have recently ended
    const endedCollection = Firestore.collection('video')
        .where('liveEnd', '>', nowMoment.clone().subtract(consts.VIDEOS_PAST_HOURS, 'hour').toISOString());
    const pastVideos = await endedCollection.get();

    // Add past videos into results
    pastVideos.forEach((video) => {
      console.log('video', video);
      const videoData = video.data();
      const videoObj = new HoloVideo(videoData);
      results.ended.push(videoObj.toJSON());
    });

    // Save result to cache
    Memcached.set('live', JSON.stringify(results), consts.CACHE_TTL.LIVE);

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
