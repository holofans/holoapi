/**
 * VIDEO LIST API
 * Gets all videos for a channel since the beginning, via API
 * - Each channel only crawled once using this
 * - Keep running for newly added channels
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log, GenericError } = require('../../../modules');


const fetchAllChannelVideos = async (playlistId, pageToken, list = []) => {
  log.debug('videoListAPI() fetchVideoPage()', { playlistId, pageToken });

  // Fetch data from YouTube
  const ytData = await youtube.playlistItems.list({
    part: 'id,snippet',
    playlistId,
    maxResults: 50,
    pageToken,
    hl: 'ja',
  })
    .then((ytResult) => {
      // Sanity check for YouTube respons contents
      if (!ytResult.data || !ytResult.data.items) {
        return Promise.reject(new GenericError('YouTube response error', ytResult));
      }
      // Return the full object result: video items and nextPageToken
      return ytResult.data;
    })
    .catch((err) => {
      // Log error information, playlistId, and pageToken being fetched
      log.error('videoListAPI() YouTube fetch error', {
        error: err.toString(),
        playlistId,
        pageToken,
      });
      // Return so that loop will not continue, and this call has no items returned
      return {
        nextPageToken: null,
        items: [],
      };
    });

  // Add new results to the cumulative list
  list = list.concat(ytData.items); // eslint-disable-line no-param-reassign

  // If has next page, fetch again
  if (ytData.items.length === 50 && ytData.nextPageToken && pageToken !== ytData.nextPageToken) {
    return fetchAllChannelVideos(playlistId, ytData.nextPageToken, list);
  }
  return list;
};


module.exports = async () => {
  try {
    log.debug('videoListAPI() START');

    // Get times
    const utcDate = moment.tz('UTC');

    // Get channel that isn't crawled today yet
    const uncrawledChannel = await db.Channel.findOne({
      where: {
        [Op.and]: [
          { yt_uploads_id: { [Op.not]: null } },
          { crawled_at: { [Op.is]: null } },
        ],
      },
    });

    // Check if there's any channel to be crawled
    if (!uncrawledChannel) {
      log.debug('videoListAPI() No channels to be crawled');
      return;
    }

    // Mark channel as crawled
    uncrawledChannel.crawled_at = utcDate;
    await uncrawledChannel.save()
      .catch((err) => {
        // Catch and log error, do not return reject to continue the rest of the module
        log.error('videoListAPI() Unable to mark channel as crawled', {
          channel: uncrawledChannel.yt_channel_id,
          error: err.tostring(),
        });
      });

    // Fetch video list from youtube API
    const channelVideos = await fetchAllChannelVideos(uncrawledChannel.yt_uploads_id)
      .catch((err) => {
        // Catch and log error, return null to skip rest of module
        log.error('videoListAPI() Error fetching video list', {
          channel: uncrawledChannel.yt_channel_id,
          err: err.tostring(),
        });
        return null;
      });

    // If there was an error (null), or there's just no videos to save ([]), skip the rest
    if (!channelVideos || !channelVideos.length) {
      log.debug('videoListAPI() No videos to be saved');
      return;
    }

    // Record results for all video saves
    const logResults = {};

    // Convert video list into promises that save into database
    const dbSaves = channelVideos.map((videoInfo) => (
      // Update databse record, insert if any unique key does not exist yet
      db.Video.upsert({
        channel_id: uncrawledChannel.id,
        yt_video_key: videoInfo.snippet.resourceId.videoId,
        title: videoInfo.snippet.title,
        description: videoInfo.snippet.description,
        published_at: moment(videoInfo.snippet.publishedAt).tz('UTC'),
        updated_at: utcDate,
      })
        .then((dbResult) => {
          // Add to result list
          logResults[videoInfo.snippet.resourceId.videoId] = dbResult;
        })
        .catch((err) => {
          // Log error
          log.error('videoListAPI() Cannot save to database', {
            videoInfo: { ...videoInfo, description: '' },
            error: err.toString(),
          });
          // Add to result list
          logResults[videoInfo.snippet.resourceId.videoId] = null;
        })
    ));

    // Wait for all database saves
    await Promise.all(dbSaves);

    log.info('videoListAPI() Saved video list', { results: logResults });
  } catch (error) {
    log.error('videoListAPI() Uncaught error', { error: error.toString() });
  }
};
