/**
 * VIDEO LIST FEED
 * Get video list for a channel via YouTube feed XML
 * - X configured channels checked every minute
 *   - e.g. with 180 channels, configured 5 per run, each channel crawled once every 36 mins
 * - Do not be aggressive fetching data using this
 *   - Our main source of latest video list is pubsub
 *   - https://developers.google.com/youtube/v3/guides/push_notifications
 *   - This is meant as backup only in case pubsub fails to notify us
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const axios = require('axios');
const { db, log } = require('../../../modules');

const findVideoRegex = /<yt:videoId>(.*?)<\/yt:videoId>\s+\S+\s+<title>(.*?)<\/title>/gim;

const channelsPerRun = process.env.CHANNEL_FEED_PER_RUN || 5;

module.exports = async () => {
  try {
    log.debug('videoListFeed() START');

    // Get times
    const utcDate = moment.tz('UTC');


    // Get channel that isn't crawled yet
    const crawlChannels = await db.Channel.findAll({
      where: {
        crawled_at: { [Op.not]: null },
      },
      order: [
        ['crawled_at', 'ASC'],
      ],
      limit: channelsPerRun,
    });


    // Mark channel as crawled
    await crawlChannels.map((crawlChannel) =>

      (crawlChannel.crawled_at = utcDate) &&
       crawlChannel.save()

         .catch(error => {

           // Catch and log error, do not return reject to continue the rest of the module
           log.error('videoListFeed() Unable to mark channel as crawled', {

             channel: crawlChannel.yt_channel_id,
             error

           });

         })
    );


    // Convert channels into their feed XMLs and record results
    const logResults = (await Promise.all(crawlChannels.map(async (crawlChannel) => {

      // Find videos from the XML...
      const xmlResult = await axios.get('https://www.youtube.com/feeds/videos.xml', {
        params: {
          channel_id: crawlChannel.yt_channel_id,
          t: Date.now(),
        },
      })

        .catch(fetchErr => {

          // Catch and log error, return null to skip rest of module
          return log.error('videoListFeed() Error fetching video list from XML feed', {

            channel: crawlChannel.yt_channel_id,
            err: fetchErr,

          });

        });


      if (!xmlResult) return;

      // ...and convert to object that can be upserted later on
      const results = [...xmlResult.data.matchAll(findVideoRegex)]

        .map(match => ({

          channel_id: crawlChannel.id,
          yt_video_key: match[1],
          title: match[2]

        }));


      // Update database record, insert if any unique key does not exist yet
      return results.map(result => db.Video.upsert(result)

        // Add to result list
        .then(dbResult => ({ [result.yt_video_key]: dbResult }))

        // Log error
        .catch(error => {
          log.error('videoListFeed() Cannot save to database', {

            result,
            error

          });

          // Add to result list
          return ({ [result.yt_video_key]: null });

        }));

      // Filter empty elements and flatten
    }))).filter(v => v).flat();


    // Check if any videos were saved

    return !logResults.length

      ? log.debug('videoListFeed() No videos to be persisted')
      : log.info('videoListFeed() Saved video list', { results: logResults });


  } catch (error) {

    log.error('videoListFeed() Uncaught error', error);

  }
};
