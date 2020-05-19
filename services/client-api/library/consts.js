module.exports = () => {
  return {
    VIDEO_STATUSES: {
      LIVE: 'live',
      UPCOMING: 'upcoming',
      PAST: 'past',
      DEAD: 'dead',
    },
    VIDEO_TYPES: {
      YOUTUBE: 'youtube',
      BILIBILI: 'bilibili',
    },
    CACHE_TTL: {
      LIVE: 15,
      CHANNELS: 21600,
      SONG_TIMINGS: 21600,
      SONG_SEARCH: 60,
    },
    VIDEOS_PAST_HOURS: 6,
  };
};
