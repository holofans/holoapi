const TABLES = require('./tables');

module.exports = {
  ...TABLES,
  STATUSES: {
    NEW: 'new',
    LIVE: 'live',
    UPCOMING: 'upcoming',
    PAST: 'past',
    MISSING: 'missing',
  },
  CACHE_TTL: {
    LIVE: 15,
    CHANNELS: 6 * 60 * 60,
  },
  VIDEOS_PAST_HOURS: 6,
};
