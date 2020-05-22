const { Router } = require('express');
const moment = require('moment-timezone');
const { HoloVideo } = require('../../classes');
const { consts, Firestore, Memcached, log } = require('../../library');

// Initialize Router
const router = new Router();

module.exports = router.get('/', async (req, res) => {
  // Check cache, and return if it exists
  const cache = await Memcached.get('live');
  const liveCache = cache ? JSON.parse(cache) : {};
  liveCache.cached = !!Object.keys(liveCache).length;
  if (liveCache.cached) return liveCache;

  // Result structure
  const results = {
    live: [],
    upcoming: [],
    ended: [],
  };

  // Look for videos that are live or upcoming
  const videos = Firestore.collection('video');
  const currentVideos = await videos.where('status', 'in', [consts.VIDEO_STATUSES.LIVE, consts.VIDEO_STATUSES.UPCOMING]).get();

  // Get current timestamp
  const nowMoment = moment();

  // Run through all results
  currentVideos.map(video => {
    const videoData = video.data();
    const videoObj = new HoloVideo(videoData).toJSON();
    if (videoData.status === consts.VIDEO_STATUSES.UPCOMING) return results.upcoming.push(videoObj);
    if (videoData.status === consts.VIDEO_STATUSES.LIVE || nowMoment.isSameOrAfter(moment(videoData.liveSchedule))) return results.live.push(videoObj);
  });

  // Look for videos that have recently ended
  const pastVideos = await videos.where('liveEnd', '>', nowMoment.clone().subtract(consts.VIDEOS_PAST_HOURS, 'hour').toISOString()).get();

  // Add past videos into results
  pastVideos.map(video => {
    console.log('video', video);
    const videoData = video.data();
    const videoObj = new HoloVideo(videoData).toJSON();
    results.ended.push(videoObj);
  });

  // Save result to cache
  Memcached.set('live', JSON.stringify(results), consts.CACHE_TTL.LIVE);

  // Return results
  return res.json(results);
});
