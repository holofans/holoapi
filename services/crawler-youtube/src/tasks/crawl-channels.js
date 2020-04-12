/**
 * CRAWL CHANNELS
 * Update channel information and get today's stats
 * Supports newly added channel IDs on config
 *
 * Logic:
  - get channels from config
  - break into bacthes, 50 each
  - channels.list
    - part = snippet,contentDetails,statistics
    - fields = nextPageToken,items(id,snippet(title,description,publishedAt,thumbnails/high/url),contentDetails/relatedPlaylists/uploads,statistics)
 * SCHEDULE: Every 1 day
    - [YTQUOTA] 1exec * numPages * 7cost = 7
    - [FS:READ] none
    - [FS:WRITE] 1exec * numChannels * 2docs = 100
 */

const config = require('config');
const moment = require('moment-timezone');
const {google} = require('googleapis');
const {Firestore} = require('@google-cloud/firestore');

const googleKey = process.env.GOOGLE_API_KEY;
const GCP_AUTH = JSON.parse(process.env.GCP_AUTH);

module.exports = function() {
  console.log('crawlChannels() START');
  (async function() {
    // Initiate YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: googleKey,
    });

    // Initialize Firestore
    const firestore = new Firestore({
      credentials: {
        client_email: GCP_AUTH.client_email,
        private_key: GCP_AUTH.private_key,
      },
    });

    // Channel Collection
    const updatedChannelInfos = [];

    // Get channels by page
    const channels = [].concat(config.channels);
    while ((batch = channels.splice(0, 50)).length > 0) {
      // Fetch channel infos from YouTube API
      const ytResults = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        id: batch.join(','),
        fields: 'nextPageToken,items(id,snippet(title,description,publishedAt,thumbnails/high/url),contentDetails/relatedPlaylists/uploads,statistics)',
        maxResults: 50,
      }).catch((err) => {
        console.error('crawlChannels() Unable to fetch channels.list', err);
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

    // Save to Firestore
    for (const channelInfo of updatedChannelInfos) {
      // Save channel information
      const channelKey = 'channel/yt:' + channelInfo.ytChannelId;
      const channelRef = firestore.doc(channelKey);
      await channelRef.set(channelInfo, {merge: true})
          .then((res) => {
            console.log('crawlChannels() Successfully saved channel', channelKey);
          })
          .catch((err) => {
            console.error('crawlChannels() Unable to save channel', err);
          });

      // Build channel's stats for today
      const today = moment().format('YYYYMMDD');
      const channelStats = {
        ytChannelId: channelInfo.ytChannelId,
        bbSpaceId: null,
        date: today,
        views: channelInfo.viewCount,
        subscribers: channelInfo.subscriberCount,
      };

      // Savbe channel statistics for the day
      const statsKey = 'channelstats/yt:' + channelInfo.ytChannelId + ':' + today;
      const statsRef = firestore.doc(statsKey);
      await statsRef.set(channelStats, {merge: false}) // do not update stats if exists
          .then((res) => {
            console.log('crawlChannels() Successfully saved channelstats', statsKey);
          })
          .catch((err) => {
            console.error('crawlChannels() Unable to save channelstats', err);
          });
    }

    return Promise.resolve('Done.');
  })()
      .then((res) => {
        console.log('crawlChannels() SUCCESS %s', res || '');
      })
      .catch((err) => {
        console.error('crawlChannels() ERROR', err);
      });
};
