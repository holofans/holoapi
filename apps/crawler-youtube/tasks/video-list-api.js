/**
 * CRAWL VIDEOS
 * Gets all videos from all channels since the beginning
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log } = require('../../../modules');

/* eslint-disable */ // Video fetcher
const fetchVideo = async (playlistId, fetchAll) => {
  log.debug(`videoListAPI() fetchVideoPage() | playlistId: ${playlistId} | fetchAll ? ${!!fetchAll}`);

  // Search function
  const search = async (nextToken) => (await youtube.playlistItems.list({
    part: 'id,snippet',
    playlistId,
    maxResults: fetchAll ? 50 : 5,
    pageToken: nextToken,
  }).catch(err => log.error('videoListAPI() youtube.playlistItems.list', { playlistId, err: err.message }))).data;

  // Get initial search
  let seed = await search();
  if (!seed) return;

  // Store results
  const results = [seed.items];
  
  // Keep searching while token exists, and store the results
  if (fetchAll) while (token = seed.nextPageToken) results.push((seed = await search(token)).items);

  return results.flat();
};
/* eslint-enable */

module.exports = async () => {
  log.debug('videoListAPI() START');

  // Get times
  const utcDate = moment.tz('UTC').toDate();

  // Get channel that isn't crawled yet
  const uncrawledChannel = await db.Channel.findOne({
    where: {
      crawled_at: { [Op.is]: null },
    },
  });

  // Fetch from youtube API
  const channelVideos = await fetchVideo(uncrawledChannel.yt_uploads_id, true);

  // Mark channel as crawled
  uncrawledChannel.crawled_at = utcDate;
  await uncrawledChannel.save();

  // Results
  const upsertedKeys = [];

  // Upsert the videos
  await Promise.all(channelVideos.map((videoInfo) => {
    upsertedKeys.push(videoInfo.snippet.resourceId.videoId);
    return db.Video.upsert({
      channel_id: uncrawledChannel.id,
      yt_video_key: videoInfo.snippet.resourceId.videoId,
      title: videoInfo.snippet.title,
      description: videoInfo.snippet.description,
      publishedAt: moment(videoInfo.snippet.publishedAt).tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: utcDate,
    });
  }));

  log.info('videoListAPI() Saved video list', { keys: upsertedKeys });
  return Promise.resolve();
};
