/**
 * CRAWL CHANNELS
 * Update channel information and get today's stats
 * Supports newly added channel IDs on config
 */

const config = require('config');
// const moment = require('moment-timezone');
const { google } = require('googleapis');
const log = require('../modules/logger');
const db = require('../modules/database');

const googleKey = process.env.GOOGLE_API_KEY;

// Initiate YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: googleKey,
});

module.exports = () => {
  log.debug('crawlChannels() START');
  (async () => {
    // Channel Collection
    const updatedChannelInfos = [];

    // Get channels by page
    const channels = [].concat(config.channels);
    let batch = null;
    while ((batch = channels.splice(0, 50)).length > 0) { // eslint-disable-line no-cond-assign
      // Fetch channel infos from YouTube API
      const ytResults = await youtube.channels.list({ // eslint-disable-line no-await-in-loop
        part: 'snippet,contentDetails,statistics',
        id: batch.join(','),
        fields: 'nextPageToken,items(id,snippet(title,description,publishedAt,thumbnails/high/url),contentDetails/relatedPlaylists/uploads,statistics)',
        maxResults: 50,
      }).catch((err) => {
        log.error('crawlChannels() Unable to fetch channels.list', err);
        return null;
      });

      // Add the results to the final collection
      ytResults.data.items.forEach((channelItem) => {
        updatedChannelInfos.push({
          ytChannelId: channelItem.id,
          bbSpaceId: null,
          name: channelItem.snippet.title,
          description: channelItem.snippet.description,
          thumbnail: channelItem.snippet.thumbnails.high.url,
          publishedAt: channelItem.snippet.publishedAt,
          uploadsId: channelItem.contentDetails.relatedPlaylists.uploads,
          viewCount: channelItem.statistics.viewCount,
          subscriberCount: channelItem.statistics.subscriberCount,
        });
      });
    }

    // db

    // Build channel's stats for today
    // const today = moment().format('YYYYMMDD');
    // const channelStats = {
    //   ytChannelId: channelInfo.ytChannelId,
    //   bbSpaceId: null,
    //   date: today,
    //   views: channelInfo.viewCount,
    //   subscribers: channelInfo.subscriberCount,
    // };

    return {};
  })()
    .then((res) => {
      log.info('crawlChannels() SUCCESS %s', res || '');
    })
    .catch((err) => {
      log.error('crawlChannels() ERROR', err);
    });
};
