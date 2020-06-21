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
  CHANNELS: 6 * 60 * 60, // 1 hour
  COMMENTS: 2 * 60, // 2 minutes
};

exports.VIDEOS_PAST_HOURS = 6;
exports.MAX_PAGE_SIZE = 50;

// TODO: Not a fan of this name, needs some brainstorming
exports.RESPONSE_FIELDS = {
  LIVE_VIDEO: ['id', 'yt_video_key', 'bb_video_id', 'title', 'thumbnail',
    'status', 'live_schedule', 'live_start', 'live_end', 'live_viewers'],
  VIDEO: ['id', 'yt_video_key', 'bb_video_id', 'title', 'thumbnail', 'published_at',
    'status', 'live_schedule', 'live_start', 'live_end', 'is_uploaded', 'duration_secs', 'is_captioned'],
  CHANNEL: ['id', 'yt_channel_id', 'bb_space_id', 'name', 'description', 'photo', 'published_at', 'twitter_link'],
  VIDEO_COMMENT: ['comment_key', 'message', 'video_id'],
  VIDEO_COMMENT_SIMPLE: ['comment_key', 'message'],
};
