/**
 * UPDATE CHANNEL INFOS
 * Update information on all channels and get today's stats
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

  // Get channels that needs to be updated
  const fetchChannels = await db.Channel.findAll({
    where: {
      [Op.and]: [
        {
          yt_channel_link: { [Op.not]: null },
        },
        {
          [Op.or]: [
            { updated_at: { [Op.is]: null } },
            { updated_at: { [Op.lt]: todayString } },
          ],
        },
      ],
    },
  });
  log.debug('Channels to be updated', { fetchChannels });

  // Check if there's any channel to be updated
  if (!fetchChannels || !fetchChannels.length) return Promise.resolve({ skip: true });

  // Get only channel keys
  const channelKeys = fetchChannels.map((v) => v.yt_channel_link);

  // Results
  const updateResults = [];

  // Get channels by page
  let batch;
  while ((batch = channelKeys.splice(0, 50)).length > 0) { // eslint-disable-line no-cond-assign
    // Fetch channel infos from YouTube API
    const ytResults = await youtube.channels.list({ // eslint-disable-line no-await-in-loop
      part: 'snippet,contentDetails',
      id: batch.join(','),
      maxResults: 50,
    }).catch((err) => {
      log.error('channels() Unable to fetch channels.list', { details: err, errMessage: err.message });
      return null;
    });

    if (!ytResults || !ytResults.data || !ytResults.data.items) continue; // eslint-disable-line no-continue

    const channelInfos = Object.values(ytResults.data.items);
    for (let i = 0; i < channelInfos.length; i += 1) {
      const channelInfo = channelInfos[i];
      const upsertResult = await db.Channel.upsert({ // eslint-disable-line no-await-in-loop
        yt_channel_link: channelInfo.id,
        yt_videos_link: channelInfo.contentDetails.relatedPlaylists.uploads,
        name: channelInfo.snippet.title,
        description: channelInfo.snippet.description.substring(0, 255),
        thumbnail: channelInfo.snippet.thumbnails.high.url,
        published_at: moment(channelInfo.snippet.publishedAt).tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
        updated_at: tokyoMoment.toDate(),
      });
      updateResults.push(upsertResult);
    }
  }

  log.info('[channels] Saved channel information', { results: updateResults });
  return Promise.resolve();
};
