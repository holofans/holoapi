const yaml = require('yaml-js');
const fs = require('fs');

const swaggerJsonV1 = yaml.load(fs.readFileSync('api-doc/swagger_v1.yaml'));

exports.TABLES = {
  CHANNEL: 'channel',
  CHANNEL_STATS: 'channel_stats',
  VIDEO: 'video',
  VIDEO_COMMENT: 'video_comment',
  CURATOR: 'curator',
  SONG: 'song',
  GAME: 'game',
};

exports.STATUSES = {
  NEW: 'new',
  LIVE: 'live',
  UPCOMING: 'upcoming',
  PAST: 'past',
  MISSING: 'missing',
};

exports.CACHE_TTL = {
  LIVE: 20,
  CHANNELS: 30 * 60, // 30 minutes
  COMMENTS: 2 * 60, // 2 minutes
};

exports.VIDEOS_PAST_HOURS = 6;
exports.MAX_PAGE_SIZE = 50;

// reference: https://swaggerstats.io/guide/conf.html#options
exports.SWAGGER_STATS_CONF = {
  name: swaggerJsonV1.info.title,
  version: swaggerJsonV1.info.version,
  hostname: new URL(swaggerJsonV1.servers[0].url).hostname,
  // 5 minutes per bucket, swagger_stats hardcodes 60 buckets, for total of 5 hours of timeline available
  timelineBucketDuration: 300000,
  durationBuckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000],
  requestSizeBuckets: [10, 100, 1000, 10000, 30000],
  responseSizeBuckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  apdexThreshold: 250,
  authentication: process.env.API_STATS_USERNAME && process.env.API_STATS_PASSWORD_BASE64,
  onAuthenticate(req, username, password) {
    return (username === process.env.API_STATS_USERNAME
      && Buffer.from(password).toString('base64') === process.env.API_STATS_PASSWORD_BASE64);
  },
};

exports.ORGANIZATIONS = {
  HOLOLIVE: 'hololive',
};

exports.SWAGGER_JSON_V1 = swaggerJsonV1;

exports.MINIMUM_DELTA_FOR_VIEWER_CHANGE = process.env.MINIMUM_DELTA_FOR_VIEWER_CHANGE || 300;
