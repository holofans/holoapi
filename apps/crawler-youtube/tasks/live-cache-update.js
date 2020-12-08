const computeLive = require('../../client-api/routes/v1/util/live');

module.exports = async () => {
  (async () => {
    const channel_id = undefined;
    const max_upcoming_hours = 2190;
    const lookback_hours = undefined;
    const hide_channel_desc = 1;
    const channel_simple = undefined;

    const cacheKey = (channel_id || max_upcoming_hours || lookback_hours || hide_channel_desc || channel_simple)
      ? `live-${channel_id}-${max_upcoming_hours}-${lookback_hours}-${hide_channel_desc}-${channel_simple}` : 'live';

    await computeLive(cacheKey, channel_id, max_upcoming_hours, lookback_hours, hide_channel_desc, channel_simple);
  })();
  (async () => {
    const channel_id = undefined;
    const max_upcoming_hours = 12;
    const lookback_hours = 0;
    const hide_channel_desc = 1;
    const channel_simple = undefined;

    const cacheKey = (channel_id || max_upcoming_hours || lookback_hours || hide_channel_desc || channel_simple)
      ? `live-${channel_id}-${max_upcoming_hours}-${lookback_hours}-${hide_channel_desc}-${channel_simple}` : 'live';

    await computeLive(cacheKey, channel_id, max_upcoming_hours, lookback_hours, hide_channel_desc, channel_simple);
  })();
};
