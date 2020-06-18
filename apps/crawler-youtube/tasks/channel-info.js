/**
 * CHANNEL INFO
 * Update all channel information daily
 */

const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log, GenericError } = require('../../../modules');

module.exports = async () => {
  log.debug('channelInfo() START');
  try {

    // Fetch channels that needs to be updated, and get their keys
    const channelInstances = await db.Channel.findAll({

      where: [

        { yt_channel_id: { [Op.not]: null } },
        { [Op.or]: [

          { updated_at: { [Op.is]: null } },
          { updated_at: { [Op.lt]: moment.tz('Asia/Tokyo').startOf('day') } },

        ] }],

    });


    // Check if there's any channel to be updated
    if (!channelInstances || !channelInstances.length) {

      return log.debug('channelInfo() No channels to be updated');

    }


    // Get YouTube channel keys/ids
    const channelKeys = channelInstances.map(channelInstance => channelInstance.yt_channel_id);


    // Get channels by page
    const batch = [];

    // For each 50 keys, split, then join into string
    while (channelKeys.length) {

      batch.push(channelKeys.splice(0, 50).join(','));

    }


    // Convert batch array into promises that fetch youTube data
    const channelInfos = (await Promise.all(batch.map(batchItems => (

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

        .catch(({ message: error }) => {

          // Log error information, and the channels included in the API that failed
          log.error('channelInfo() YouTube fetch error', {

            error,
            batchItems,

          });

          return [];

        })


    )))).flat();


    // Check if all channels were returned
    if (channelInfos.length !== channelInstances.length) {

      // Warn about the missing channels
      log.warn('channelInfo() Not all requested channels were returned by YouTube', {

        // Get YouTube IDs of channels returned by the API
        missing: channelInstances.filter(({ yt_channel_id }) =>

          channelInfos.find(({ id }) => id === yt_channel_id))

      });

      // Possibly notify admins about the "missing" / deleted channel
      // ...

    }


    // Convert channel data into promises that save into database and record results
    const logResults = (await Promise.all(channelInfos.map(channelInfo => {

      const {
        snippet: { title, description, thumbnails, publishedAt },
        id, contentDetails: { relatedPlaylists }
      } = channelInfo;

      // Update databse record, insert if any unique key does not exist yet
      return db.Channel.upsert({

        yt_channel_id: id,
        yt_uploads_id: relatedPlaylists.uploads,
        name: title,
        description,
        thumbnail: thumbnails.high.url,
        published_at: moment(publishedAt).tz('UTC'),
        updated_at: moment.utc()

      })

        .then(dbResult => {

          // Add to result list
          return { [channelInfo.id]: dbResult };

        })

        .catch(({ message: error }) => {

          // Log error
          log.error('channelInfo() Cannot save to database', {

            channelInfo: { ...channelInfo, description: '' },
            error

          });


          // Add to result list
          return { [channelInfo.id]: null };

        });

    }))).filter(v => v).flat();

    log.info('channelInfo() Saved channel information', { results: logResults });


  } catch ({ message: error }) {

    log.error('channelInfo() Uncaught error', { error });

  }
};
