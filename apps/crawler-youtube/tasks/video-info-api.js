/* eslint-disable no-inline-comments */
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
const { STATUSES: { NEW, LIVE, PAST, UPCOMING, MISSING } } = require('../../../consts');

const VIDEOS_MAX_QUERY = 50;

module.exports = async () => {
  log.debug('videoInfoAPI() START');
  try {

    // Get times
    const utcDate = moment.tz('UTC');

    // Check if there are videos set as status [new]
    const newVideos = await db.Video.findAll({

      where: [

        { yt_video_key: { [Op.not]: null } },
        { status: NEW },

      ],

      limit: VIDEOS_MAX_QUERY,


    }).catch(({ message: error }) => {

      // Catch and log db error
      log.error('videoInfoAPI() Unable to fetch videos with status[new]', { error });

      // Return empty list, so the succeeding process for outdated videos wil continue
      return [];

    });


    // Find non-new videos that are most outdated
    const outdatedVideos = await db.Video.findAll({

      where: {

        [Op.and]: [

          { yt_video_key: { [Op.not]: null } },
          { status: { [Op.ne]: NEW } },
          { updated_at: { [Op.lt]: moment.tz('Asia/Tokyo').startOf('day') } }

        ]
      },

      order: [

        ['updated_at', 'ASC']

      ],

      limit: VIDEOS_MAX_QUERY - newVideos.length


    }).catch(({ message: error }) => {

      // Catch and log db error
      log.error('videoInfoAPI() Unable to fetch outdated videos', { error });

      // Return empty list, so the new videos from the preceeding process can still be updated
      return [];
    });

    // Final list of videos to be updated
    const targetVideos = newVideos.concat(outdatedVideos);


    // Check if there's any channel to be crawled
    if (!targetVideos || !targetVideos.length) {

      return log.debug('videoInfoAPI() No videos to be updated');

    }

    // Fetch data from YouTube
    const ytVideoItems = await youtube.videos.list({

      part: 'snippet,status,contentDetails,liveStreamingDetails',
      id: targetVideos.map(({ yt_video_key }) => yt_video_key),
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

      .catch(({ message: error }) => {

        // Log error information
        log.error('videoInfoAPI() YouTube fetch error', {

          error,
          videoKeys: targetVideos.map(({ yt_video_key }) => yt_video_key),

        });


        // Return so that loop will not continue, and this call has no items returned
        return null;

      });


    // Check if we have videos to be updated in database
    if (!ytVideoItems) {

      return log.warn('videoInfoAPI() No videos fetched');

    }


    // Wait for all database saves and record results
    const logResults = (await Promise.all(

      // Save using the model instances
      targetVideos.map(targetVideo => {

        // Check if this target video was returned by YouTube API + Destrucutre
        const ytInfo = ytVideoItems.find(({ id }) => id === targetVideo.yt_video_key);
        const {

          snippet: { title, description, publishedAt },
          liveStreamingDetails,
          contentDetails: { caption, licensedContent: is_licensed },
          status: { embeddable },

        } = ytInfo || { snippet: [], contentDetails: [], status: [] };

        const {

          scheduledStartTime,
          actualStartTime,
          actualEndTime,
          concurrentViewers,

        } = liveStreamingDetails || {};


        const saveInfo = !ytInfo ? {

          // Video still exists, update its information
          title,
          description,
          published_at: moment(publishedAt),
          is_captioned: String(caption) !== 'false',
          is_licensed,
          is_embeddable: embeddable || null,

          // Video livestream status
          is_uploaded: !liveStreamingDetails,

        } : {

          // Video not returned by YouTube, mark as missing
          status: MISSING,
          updated_at: utcDate,

        };

        if (liveStreamingDetails) {

          Object.assign(saveInfo, {

            // Video livestream status
            live_schedule: scheduledStartTime || null,
            live_start: actualStartTime || null,
            live_end: actualEndTime || null,
            live_viewers: concurrentViewers || null,


            /* eslint-disable */ 
            // Determine live status
            status:   !actualStartTime   ?   UPCOMING
                  :   !actualEndTime     ?   LIVE
                  :                          PAST,

          },

          // Get derived values
          actualStartTime && scheduledStartTime && {

            late_secs:

            (+new Date(actualStartTime) - +new Date(scheduledStartTime) / 1000) | 0,

          },

          actualEndTime && actualStartTime && {

            duration_secs:

            (+new Date(actualEndTime) - +new Date(actualStartTime) / 1000) | 0,

          });
        } /* eslint-enable */


        return targetVideo.update(saveInfo)

          .then(() => {

            // Add to result list
            return { [targetVideo.yt_video_key]: true };

          })

          .catch(({ message: error }) => {

            // Log error
            log.error('videoInfoAPI() Cannot save to database', {

              videoKey: targetVideo.yt_video_key,
              error

            });

            // Add to result list
            return { [targetVideo.yt_video_key]: false };

          });

      }),
    )).filter(v => v).flat();


    log.info('videoInfoAPI() Saved video list', { results: logResults });

  } catch ({ message: error }) {

    log.error('videoInfoAPI() Uncaught error', { error });

  }
};