/**
 * CRAWL VIDEOS
 * Gets all videos from all channels since the beginning
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log } = require('../../../modules');

// Fetch single page of videos
const fetchVideoPage = async (playlistId, nextPageToken, fetchAll) => {
  log.debug('videoListAPI() fetchVideoPage() | playlistId:%s | pageToken:%s', playlistId, nextPageToken);
  return new Promise((done, fail) => {
    youtube.playlistItems.list({
      part: 'id,snippet',
      playlistId,
      maxResults: fetchAll ? 50 : 5,
      pageToken: nextPageToken || undefined,
    }, (err, res) => {
      // Handle YouTube API Error
      if (err) {
        log.error('videoListAPI() youtube.playlistItems.list', { playlistId, err: err.message });
        fail(err);
        return;
      }
      // Return data
      done(res.data);
    });
  });
};

// Fetch all videos for specific channel
const fetchVideoList = async (playlistId, fetchAll) => {
  log.debug('videoListAPI() fetchVideoList() | playlistId:%s | fetchAll:%s', playlistId, fetchAll);
  let videoList = [];
  let lastPageToken = null;
  let nextPageToken = null;
  do {
    lastPageToken = nextPageToken;
    // eslint-disable-next-line no-await-in-loop
    const pageData = await fetchVideoPage(playlistId, nextPageToken, fetchAll)
      .catch((err) => { // eslint-disable-line
        log.error('Unable to fetch video page', { err: err.message, playlistId, nextPageToken, fetchAll });
        return null;
      });
    if (pageData) {
      videoList = videoList.concat(pageData.items);
      nextPageToken = pageData.nextPageToken;
    } else {
      nextPageToken = null;
    }
  } while (nextPageToken && lastPageToken !== nextPageToken && fetchAll);
  return videoList;
};

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
  const channelVideos = await fetchVideoList(uncrawledChannel.yt_uploads_id, true);

  // Mark channel as crawled
  uncrawledChannel.crawled_at = utcDate;
  await uncrawledChannel.save();

  // Results
  const upsertedKeys = [];

  // Upsert the videos
  for (let i = 0; i < channelVideos.length; i += 1) {
    const videoInfo = channelVideos[i];
    const videoRecord = {
      channel_id: uncrawledChannel.id,
      yt_video_key: videoInfo.snippet.resourceId.videoId,
      title: videoInfo.snippet.title,
      description: videoInfo.snippet.description,
      publishedAt: moment(videoInfo.snippet.publishedAt).tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: utcDate,
    };
    await db.Video.upsert(videoRecord); // eslint-disable-line no-await-in-loop
    upsertedKeys.push(videoInfo.snippet.resourceId.videoId);
  }

  log.info('videoListAPI() Saved video list', { keys: upsertedKeys });
  return Promise.resolve();
};
