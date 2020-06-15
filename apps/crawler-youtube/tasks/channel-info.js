/**
 * CHANNEL INFO
 * Update all channel information daily
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log, GenericError } = require('../../../modules');

module.exports = async () => {
  try {
    log.debug('channelInfo() START');

    // Fetch channels that needs to be updated, and get their keys
    const channelInstances = await db.Channel.findAll({
      where: [
        { yt_channel_id: { [Op.not]: null } },
        {
          [Op.or]: [
            { updated_at: { [Op.is]: null } },
            { updated_at: { [Op.lt]: moment.tz('Asia/Tokyo').startOf('day') } },
          ],
        },
      ],
    });

    // Check if there's any channel to be updated
    if (!channelInstances || !channelInstances.length) {
      log.debug('channelInfo() No channels to be updated');
      return;
    }

    // Get YouTube channel keys/ids
    const channelKeys = channelInstances.map((channelInstance) => channelInstance.yt_channel_id);

    // Get channels by page
    const batch = [];

    // For each 50 keys, split, then join into string
    while (channelKeys.length) batch.push(channelKeys.splice(0, 50).join(','));

    // Convert batch array into promises that fetch youTube data
    const ytFetches = batch.map((batchItems) => (
      // Fetch data from YouTube
      youtube.channels.list({
        part: 'snippet,contentDetails',
        id: batchItems,
        maxResults: 50,
      })
        .then((ytResult) => {
          // Sanity check for YouTube respons contents
          if (!ytResult.data || !ytResult.data.items) {
            return Promise.reject(new GenericError('YouTube response error', ytResult));
          }
          // Return the array of channel information within the response
          return ytResult.data.items;
        })
        .catch((err) => {
          // Log error information, and the channels included in the API that failed
          log.error('channelInfo() YouTube fetch error', {
            error: err.toString(),
            batchItems,
          });
          return [];
        })
    ));

    // Wait for all YouTube responses
    const channelInfos = (await Promise.all(ytFetches)).flat();

    // Check if all channels were returned
    if (channelInfos.length !== channelInstances.length) {
      // Get YouTube IDs of channels returned by the API
      const returnedKeys = channelInfos.map((channelInfo) => channelInfo.id);
      // Warn about the missing channels
      log.warn('channelInfo() Not all requested channels were returned by YouTube', {
        missing: channelInstances
          .map((channel) => channel.yt_channel_id)
          .filter((channelKey) => returnedKeys.indexOf(channelKey) === -1),
      });
      // Possibly notify admins about the "missing" / deleted channel
      // ...
    }

    // Record results for all channel saves
    const logResults = {};

    // Convert channel data into promises that save into database
    const dbSaves = channelInfos.map((channelInfo) => (
      // Update databse record, insert if any unique key does not exist yet
      db.Channel.upsert({
        yt_channel_id: channelInfo.id,
        yt_uploads_id: channelInfo.contentDetails.relatedPlaylists.uploads,
        name: channelInfo.snippet.title,
        description: channelInfo.snippet.description,
        thumbnail: channelInfo.snippet.thumbnails.high.url,
        published_at: moment(channelInfo.snippet.publishedAt).tz('UTC'),
        updated_at: moment.utc(),
      })
        .then((dbResult) => {
          // Add to result list
          logResults[channelInfo.id] = dbResult;
        })
        .catch((err) => {
          // Log error
          log.error('channelInfo() Cannot save to database', {
            channelInfo: { ...channelInfo, description: '' },
            error: err.toString(),
          });
          // Add to result list
          logResults[channelInfo.id] = null;
        })
    ));

    // Wait for all database saves
    await Promise.all(dbSaves);

    log.info('channelInfo() Saved channel information', { results: logResults });
  } catch (error) {
    log.error('channelInfo() Uncaught error', { error: error.toString() });
  }
};
