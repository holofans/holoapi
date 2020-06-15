/**
 * VIDEO INFO API
 * Fetches information of 50 most outdated videos and updates database
 * - Priority fetch status: new videos because they have empty fields
 * - Next priority are videos that have oldest updated_at
 * - Update only once per day. Watch your quota.
 * - Up to 72k videos/day if ran per minute. Make per 30sec if db has more
 */

require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { db, youtube, log, GenericError } = require('../../../modules');
const consts = require('../../../consts');

const VIDEOS_MAX_QUERY = 50;

module.exports = async () => {
  try {
    log.debug('videoInfoAPI() START');

    // Get times
    const utcDate = moment.tz('UTC');

    // Check if there are videos set as status [new]
    const newVideos = await db.Video.findAll({
      where: [
        { yt_video_key: { [Op.not]: null } },
        { status: consts.STATUSES.NEW },
      ],
      limit: VIDEOS_MAX_QUERY,
    }).catch((err) => {
      // Catch and log db error
      log.error('videoInfoAPI() Unable to fetch videos with status[new]', { error: err.toString() });
      // Return empty list, so the succeeding process for outdated videos wil continue
      return [];
    });

    // Find non-new videos that are most outdated
    // const outdatedVideos = await db.Video.findAll({
    //   where: {
    //     [Op.and]: [
    //       { yt_video_key: { [Op.not]: null } },
    //       { status: { [Op.ne]: consts.STATUSES.NEW } },
    //       { updated_at: { [Op.lt]: moment.tz('Asia/Tokyo').startOf('day') } },
    //     ],
    //   },
    //   order: [
    //     ['updated_at', 'ASC'],
    //   ],
    //   limit: VIDEOS_MAX_QUERY - newVideos.length,
    // }).catch((err) => {
    //   // Catch and log db error
    //   log.error('videoInfoAPI() Unable to fetch outdated videos', { error: err.toString() });
    //   // Return empty list, so the new videos from the preceeding process can still be updated
    //   return [];
    // });
    const outdatedVideos = [];

    // Final list of videos to be updated
    const targetVideos = newVideos.concat(outdatedVideos);

    // Check if there's any channel to be crawled
    if (!targetVideos || !targetVideos.length) {
      log.debug('videoInfoAPI() No videos to be updated');
      return;
    }

    // Fetch data from YouTube
    const ytVideoItems = await youtube.videos.list({
      part: 'snippet,status,contentDetails,liveStreamingDetails',
      id: targetVideos.map((targetVideo) => targetVideo.yt_video_key),
      hl: 'ja',
      fields: 'items(id,snippet,contentDetails,status/embeddable,liveStreamingDetails)',
      maxResults: 50, // keep at 50, not VIDEOS_MAX_QUERY
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
        log.error('videoInfoAPI() YouTube fetch error', {
          error: err.toString(),
          videoKeys: targetVideos.map((targetVideo) => targetVideo.yt_video_key),
        });
        // Return so that loop will not continue, and this call has no items returned
        return null;
      });

    // Check if we have videos to be updated in database
    if (!ytVideoItems) {
      log.warn('videoInfoAPI() No videos fetched');
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
        saveInfo = {
          title: ytInfo.snippet.title,
          description: ytInfo.snippet.description,
          published_at: moment(ytInfo.snippet.publishedAt),
          is_captioned: String(ytInfo.contentDetails.caption) !== 'false',
          is_licensed: ytInfo.contentDetails.licensedContent,
          is_embeddable: ytInfo.status.embeddable || null,
        };
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
          // Not a live stream, an uploaded video
          saveInfo.is_uploaded = true;
          saveInfo.status = consts.STATUSES.PAST;
          saveInfo.duration_secs = parseInt(moment.duration(ytInfo.contentDetails.duration).as('seconds'), 10);
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

    log.info('videoInfoAPI() Saved video list', { results: logResults });
  } catch (error) {
    log.error('videoInfoAPI() Uncaught error', { error: error.toString() });
  }
};
