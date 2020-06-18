exports.TABLES = {
  CHANNEL: 'channel',
  CHANNEL_STATS: 'channel_stats',
  VIDEO: 'video',
  VIDEO_COMMENT: 'video_comment',
};

exports.STATUSES = {
  NEW: 'new',
  LIVE: 'live',
  UPCOMING: 'upcoming',
  PAST: 'past',
  MISSING: 'missing',
};

exports.CACHE_TTL = {
  LIVE: 15,
  CHANNELS: 6 * 60 * 60,
};

exports.VIDEOS_PAST_HOURS = 6;
exports.MAX_PAGE_SIZE = 50;

exports.MODEL_FIELDS = {};
