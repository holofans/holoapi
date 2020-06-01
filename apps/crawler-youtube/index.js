require('dotenv').config();
const moment = require('moment-timezone');
const schedule = require('node-schedule-tz');

const { log } = require('../../modules');
const channels = require('./tasks/channels');
// const videoListAPI = require('./tasks/video-list-api')
// const videoListFeed = require('./tasks/video-list-feed')
// const videoListScrape = require('./tasks/video-list-scrape')
// const videoInfoAPI = require('./tasks/video-info-api')
// const videoStatusAPI = require('./tasks/video-status-api')
// const videoStatusHeart = require('./tasks/video-status-heart')
// const comments = require('./tasks/comments')

const { env } = process;

log.info('YOUTUBE CRAWLER | %s | %s', env.NODE_ENV, moment().format('YYYY-MM-DD HH:mm:ss ZZ'));

// Update channel information and get today's stats
schedule.scheduleJob('channels', env.SCHEDULE_CHANNEL, 'Asia/Tokyo', () => {
  channels();
});

// Run only at the beginning to get all past videos
// schedule.scheduleJob('video-list-api', config.timings['video-list-api'], 'Asia/Tokyo', function(){
//   videoListAPI()
// })

// Gets latest videos from each channel through YouTube XML feed
// schedule.scheduleJob('video-list-feed', config.timings['video-list-feed'], 'Asia/Tokyo', function(){
//   videoListFeed()
// })

// Gets latest videos from each channel through web scraping
// schedule.scheduleJob('video-list-scrape', config.timings['video-list-scrape'], 'Asia/Tokyo', function(){
//   videoListScrape()
// })

// Checks the status of newly added videos if they're past, upcoming, or live
// schedule.scheduleJob('video-info-api', config.timings['video-info-api'], 'Asia/Tokyo', function(){
//   videoInfoAPI()
// })

// Checks status of known live videos using YouTube Data API
// schedule.scheduleJob('video-status-api', config.timings['video-status-api'], 'Asia/Tokyo', function(){
//   videoStatusAPI()
// })

// Checks status of known live videos using heartbeat
// schedule.scheduleJob('video-status-heart', config.timings['video-status-heart'], 'Asia/Tokyo', function(){
//   videoStatusHeart()
// })

// Gets comments from videos to check for timestamps
// schedule.scheduleJob(config.timings['crawl-comments'], function(){
//   comments()
// })
