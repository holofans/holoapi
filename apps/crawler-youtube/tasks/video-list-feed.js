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

    await crawlChannels.map((crawlChannel) => {
      crawlChannel.crawled_at = utcDate; // eslint-disable-line no-param-reassign
      return crawlChannel.save().catch((err) => {
        // Catch and log error, do not return reject to continue the rest of the module
        log.error('videoListFeed() Unable to mark channel as crawled', {
          channel: crawlChannel.yt_channel_id,
          error: err.toString(),
        });
      });
    });

    // Convert channels into promises to fetch their feed XMLs
    const xmlFetches = crawlChannels.map((crawlChannel) => (
      axios.get('https://www.youtube.com/feeds/videos.xml', {
        params: {
          channel_id: crawlChannel.yt_channel_id,
          t: Date.now(),
        },
      })
        .then((xmlResult) => (
          // Find videos from the XML and convert to object that can be upserted later on
          [...xmlResult.data.matchAll(findVideoRegex)]
            .map((match) => ({
              channel_id: crawlChannel.id,
              yt_video_key: match[1],
              title: match[2],
            }))
        ))
        .catch((fetchErr) => {
          // Catch and log error, return null to skip rest of module
          log.error('videoListFeed() Error fetching video list from XML feed', {
            channel: crawlChannel.yt_channel_id,
            err: fetchErr.toString(),
          });
          // Return an empty video list so it will not interfere succeeding processes
          return [];
        })
    ));

    // Wait for XML fetch results, and check if there's any video to save
    const videoList = (await Promise.all(xmlFetches)).flat();
    if (!videoList || !videoList.length) {
      log.debug('videoListFeed() No videos to be persisted');
      return;
    }

    // Record results for all video saves
    const logResults = {};

    // Convert video list into promises that save into database
    const dbSaves = videoList.map((videoInfo) => (
      // Update databse record, insert if any unique key does not exist yet
      db.Video.upsert(videoInfo)
        .then((dbResult) => {
          // Add to result list
          logResults[videoInfo.yt_video_key] = dbResult;
        })
        .catch((err) => {
          // Log error
          log.error('videoListFeed() Cannot save to database', {
            videoInfo,
            error: err.toString(),
          });
          // Add to result list
          logResults[videoInfo.yt_video_key] = null;
        })
    ));

    // Wait for all database saves
    await Promise.all(dbSaves);

    log.info('videoListFeed() Saved video list', { results: logResults });
  } catch (error) {
    log.error('videoListFeed() Uncaught error', { error: error.toString() });
  }
};
