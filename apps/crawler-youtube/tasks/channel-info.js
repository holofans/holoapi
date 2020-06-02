/**
 * UPDATE CHANNEL INFOS
 * Update information daily
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log } = require('../../../modules');

module.exports = async () => {
  log.debug('channelInfo() START');

  // Fetch channels that needs to be updated, and get their keys
  const channelKeys = (await db.Channel.findAll({
    where: {
      [Op.and]: [
        { yt_channel_id: { [Op.not]: null } },
        {
          [Op.or]: [
            { updated_at: { [Op.is]: null } },
            { updated_at: { [Op.lt]: moment.tz('Asia/Tokyo').hour(0).minute(0).second(0) } },
          ],
        },
      ],
    },
  })).map((v) => v.yt_channel_id);

  // Check if there's any channel to be updated
  if (!channelKeys || !channelKeys.length) return Promise.resolve({ skip: true });

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
  const results = (await Promise.all(batch.map(search))).reduce((c, v) => c.concat(v), []);

  // Process each result from function
  const updateResults = await Promise.all(results.map((channelInfo) => db.Channel.upsert({
    yt_channel_id: channelInfo.id,
    yt_uploads_id: channelInfo.contentDetails.relatedPlaylists.uploads,
    name: channelInfo.snippet.title,
    description: channelInfo.snippet.description,
    thumbnail: channelInfo.snippet.thumbnails.high.url,
    published_at: moment(channelInfo.snippet.publishedAt).tz('UTC'),
    updated_at: moment.utc(),
  })));

  log.info('channelInfo() Saved channel information', { results: updateResults });
  return Promise.resolve();
};
