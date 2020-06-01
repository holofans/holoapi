/**
 * UPDATE CHANNEL INFOS
 * Update information daily
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log } = require('../../../modules');

module.exports = async () => {
  log.debug('channels() START');

  // Get times
  const tokyoMoment = moment.tz('Asia/Tokyo');
  const tokyoToday = tokyoMoment.clone().hour(0).minute(0).second(0);
  const todayString = tokyoToday.tz('UTC').format('YYYY-MM-DD HH:mm:ss');

  // Fetch channels that needs to be updated, and get their keys
  const channelKeys = (await db.Channel.findAll({
    where: {
      [Op.and]: [
        { yt_channel_id: { [Op.not]: null } },
        {
          [Op.or]: [
            { updated_at: { [Op.is]: null } },
            { updated_at: { [Op.lt]: todayString } },
          ],
        },
      ],
    },
  })).map((v) => v.yt_channel_id);

  // Check if there's any channel to be updated
  if (!channelKeys || !channelKeys.length) return Promise.resolve({ skip: true });

  // Results
  const updateResults = [];

  // Get channels by page
  const batch = [];

  // For each 50 keys, split, then join into string
  while (channelKeys.length) batch.push(channelKeys.splice(0, 50).join(','));

  // Function to transform each keys into youtube results
  const search = async (items) => (await youtube.channels.list({
    part: 'snippet,contentDetails',
    id: items,
    maxResults: 50,
  })).data.items;

  // Apply function
  batch.map(search);

  // Process each result from function
  batch.map(async (channelInfo) => updateResults.push(
    await db.Channel.upsert({
      yt_channel_id: channelInfo.id,
      yt_uploads_id: channelInfo.contentDetails.relatedPlaylists.uploads,
      name: channelInfo.snippet.title,
      description: channelInfo.snippet.description,
      thumbnail: channelInfo.snippet.thumbnails.high.url,
      published_at: moment(channelInfo.snippet.publishedAt).tz('UTC').toDate(),
      updated_at: tokyoMoment.toDate(),
    }),
  ));

  log.info('[channels] Saved channel information', { results: updateResults });
  return Promise.resolve();
};
