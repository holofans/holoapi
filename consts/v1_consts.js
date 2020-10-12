exports.RESPONSE_FIELDS = {
  LIVE_VIDEO: ['id', 'yt_video_key', 'bb_video_id', 'title', 'thumbnail',
    'status', 'live_schedule', 'live_start', 'live_end', 'live_viewers'],
  VIDEO: ['id', 'yt_video_key', 'bb_video_id', 'title', 'thumbnail', 'published_at',
    'status', 'live_schedule', 'live_start', 'live_end', 'is_uploaded', 'duration_secs', 'is_captioned'],
  CHANNEL: ['id', 'yt_channel_id', 'bb_space_id', 'name', 'description', 'photo',
    'published_at', 'twitter_link', 'view_count', 'subscriber_count', 'video_count'],
  CHANNEL_SIMPLE: ['id', 'yt_channel_id', 'bb_space_id', 'name', 'photo',
    'published_at', 'twitter_link', 'view_count', 'subscriber_count', 'video_count'],
  VIDEO_COMMENT: ['comment_key', 'message'],
};
