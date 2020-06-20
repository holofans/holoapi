require('dotenv').config();
const moment = require('moment-timezone');
const schedule = require('node-schedule-tz');

const { log } = require('../../modules');
const channelInfo = require('./tasks/channel-info');
const videoListAPI = require('./tasks/video-list-api');
const videoListFeed = require('./tasks/video-list-feed');
// const videoListScrape = require('./tasks/video-list-scrape')
const videoInfoAPI = require('./tasks/video-info-api');
const videoStatusAPI = require('./tasks/video-status-api');
const comments = require('./tasks/comments');

const { env } = process;

log.info('YOUTUBE CRAWLER | %s | %s', env.NODE_ENV, moment().format('YYYY-MM-DD HH:mm:ss ZZ'));

// Update channel information
schedule.scheduleJob('channelInfo', env.SCHEDULE_CHANNEL_INFO, 'Asia/Tokyo', channelInfo);

// If there's any new channel that's uncrawled yet, get all its videos and save them
schedule.scheduleJob('videoListAPI', env.SCHEDULE_VIDEO_LIST_API, 'Asia/Tokyo', videoListAPI);

// Gets latest videos from each channel through YouTube XML feed
schedule.scheduleJob('videoListFeed', env.SCHEDULE_VIDEO_LIST_FEED, 'Asia/Tokyo', videoListFeed);

// Gets latest videos from each channel through web scraping
// schedule.scheduleJob('video-list-scrape', config.timings['video-list-scrape'], 'Asia/Tokyo', function(){
//   videoListScrape()
// })

// Checks the status of newly added videos if they're past, upcoming, or live
schedule.scheduleJob('video-info-api', env.SCHEDULE_VIDEO_INFO_API, 'Asia/Tokyo', videoInfoAPI);

// Checks status of known live videos using YouTube Data API
schedule.scheduleJob('video-status-api', env.SCHEDULE_VIDEO_STAT_API, 'Asia/Tokyo', videoStatusAPI);

// Gets comments from videos to check for timestamps
schedule.scheduleJob('video-comments', env.SCHEDULE_COMMENTS, 'Asia/Tokyo', comments);
