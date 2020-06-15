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
};
