const config = require('config');
const schedule = require('node-schedule');

const crawlChannels = require('./tasks/crawl-channels');
const crawlVideos = require('./tasks/crawl-videos');
const videosFeed = require('./tasks/videos-feed');
const videosInfo = require('./tasks/videos-info');
const videosLive = require('./tasks/videos-live');
const crawlComments = require('./tasks/crawl-comments');

const GCP_AUTH = JSON.parse(process.env.GCP_AUTH);

console.log('RUNNING YOUTUBE CRAWLER', process.env.NODE_ENV, new Date().toString(), GCP_AUTH.type);

// Update channel information and get today's stats
schedule.scheduleJob(config.timings['crawl-channels'], function() {
  crawlChannels();
});

// Gets all videos from all channels since the beginning
// schedule.scheduleJob(config.timings['crawl-videos'], function(){
//   crawlVideos()
// })

// Gets latest videos from each channel through YouTube XML feed
schedule.scheduleJob(config.timings['videos-feed'], function() {
  videosFeed();
});

// Checks the status of newly added videos if they're past, upcoming, or live
schedule.scheduleJob(config.timings['videos-info'], function() {
  videosInfo();
});

// Checks status of known live videos using heartbeat
schedule.scheduleJob(config.timings['videos-live'], function() {
  videosLive();
});

// Gets comments from videos to check for timestamps
// schedule.scheduleJob(config.timings['crawl-comments'], function(){
//   crawlComments()
// })
