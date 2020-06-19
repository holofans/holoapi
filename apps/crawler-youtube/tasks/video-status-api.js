/**
 * VIDEO STATUS API
 * Fetches information of up to 50 live or upcoming videos and updates database
 * - Priority fetch status: live videos
 * - Next priority are upcoming videos that have oldest updated_at
 * - Update only once per minute. Watch your quota.
 * - 1440 mins per day x 3 units per run = 4,320 units per day
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log, GenericError } = require('../../../modules');
const consts = require('../../../consts');

module.exports = async () => {
  try {
    log.debug('videoStatusAPI() START');

    // Get times
    const utcDate = moment.tz('UTC');

    // Check if there are live videos
    const targetVideos = await db.Video.findAll({
      where: [
        { yt_video_key: { [Op.not]: null } },
        { status: [consts.STATUSES.LIVE, consts.STATUSES.UPCOMING] },
      ],
      order: [
        ['status', 'ASC'],
        ['updated_at', 'ASC'],
      ],
      limit: 50,
    }).catch((err) => {
      // Catch and log db error
      log.error('videoStatusAPI() Unable to fetch videos for tracking', { error: err.toString() });
      // Return empty list, so the succeeding process for upcoming videos wil continue
      return [];
    });

    // Check if there's any channel to be crawled
    if (!targetVideos || !targetVideos.length) {
      log.debug('videoStatusAPI() No videos to be updated');
      return;
    }

    // Fetch data from YouTube
    const ytVideoItems = await youtube.videos.list({
      part: 'liveStreamingDetails',
      id: targetVideos.map((targetVideo) => targetVideo.yt_video_key).join(','),
      hl: 'ja',
      fields: 'items(id,liveStreamingDetails)',
      maxResults: 50,
    })
      .then((ytResult) => {
        // Sanity check for YouTube respons contents
        if (!ytResult.data || !ytResult.data.items) {
          return Promise.reject(new GenericError('Invalid YouTube response', ytResult));
        }
        // Return video list only
        return ytResult.data.items;
      })
      .catch((err) => {
        // Log error information
        log.error('videoStatusAPI() YouTube fetch error', {
          error: err.toString(),
          videoKeys: targetVideos.map((targetVideo) => targetVideo.yt_video_key),
        });
        // Return so that loop will not continue, and this call has no items returned
        return null;
      });

    // Check if we have videos to be updated in database
    if (!ytVideoItems) {
      log.warn('videoStatusAPI() No videos fetched');
      return;
    }

    // Record results for all video saves
    const logResults = {};

    // Save using the model instances
    const dbSaves = targetVideos.map((targetVideo) => {
      // Check if this target video was returned by YouTube API
      const ytInfo = ytVideoItems.find((ytVideoItem) => ytVideoItem.id === targetVideo.yt_video_key);
      let saveInfo;
      if (ytInfo) {
        // Video still exists, update its information
        saveInfo = {};
        // Video livestream status
        if (ytInfo.liveStreamingDetails) {
          saveInfo.is_uploaded = false;
          saveInfo.live_schedule = ytInfo.liveStreamingDetails.scheduledStartTime || null;
          saveInfo.live_start = ytInfo.liveStreamingDetails.actualStartTime || null;
          saveInfo.live_end = ytInfo.liveStreamingDetails.actualEndTime || null;
          saveInfo.live_viewers = ytInfo.liveStreamingDetails.concurrentViewers || null;
          // Get moment objects
          const scheduleMoment = moment(saveInfo.live_schedule);
          const startMoment = moment(saveInfo.live_start);
          const endMoment = moment(saveInfo.live_end);
          // Determine live status
          if (saveInfo.live_end) {
            saveInfo.status = consts.STATUSES.PAST;
          } else if (saveInfo.live_start) {
            saveInfo.status = consts.STATUSES.LIVE;
          } else if (saveInfo.live_schedule) {
            if (moment().isSameOrAfter(scheduleMoment)) {
              saveInfo.status = consts.STATUSES.LIVE;
            } else {
              saveInfo.status = consts.STATUSES.UPCOMING;
            }
          } else {
            saveInfo.status = consts.STATUSES.PAST;
          }
          // Get derived values
          if (saveInfo.live_schedule && saveInfo.live_start) {
            saveInfo.late_secs = parseInt(startMoment.diff(scheduleMoment, 'seconds'), 10);
          }
          if (saveInfo.live_end && saveInfo.live_start) {
            saveInfo.duration_secs = parseInt(endMoment.diff(startMoment, 'seconds'), 10);
          }
        } else {
          // Stream Offline
          // Do not change status. We still need actualEndTime to calculate duration
          // Keep as live or upcoming until `liveStreamingDetails` is returned again
          // If it gets annoying, use another solution like consts.STATUSES.OFFLINE
          // saveInfo.status = consts.STATUSES.PAST;
        }
      } else {
        // Video not returned by YouTube, mark as missing
        saveInfo = {
          status: consts.STATUSES.MISSING,
          updated_at: utcDate,
        };
      }
      return targetVideo.update(saveInfo)
        .then(() => {
          // Add to result list
          logResults[targetVideo.yt_video_key] = true;
        })
        .catch((err) => {
          // Log error
          log.error('videoInfoAPI() Cannot save to database', {
            videoKey: targetVideo.yt_video_key,
            error: err.toString(),
          });
          // Add to result list
          logResults[targetVideo.yt_video_key] = false;
        });
    });

    // Wait for all database saves
    await Promise.all(dbSaves);

    log.info('videoStatusAPI() Saved video list', { results: logResults });
  } catch (error) {
    log.error('videoStatusAPI() Uncaught error', { error: error.toString() });
  }
};
