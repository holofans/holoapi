/**
 * VIDEO LIST API
 * Gets all videos for a channel since the beginning, via API
 * - Each channel only crawled once using this
 * - Keep running for newly added channels
 */

const moment = require('moment-timezone');
const { Op, DataTypes } = require('sequelize');
const { db, youtube, log, GenericError } = require('../../../modules');
const { data } = require('../../../modules/logger');


const videoFetcher = async (playlistId, pageToken) => {
  log.debug('videolistAPI() videoFethcer()', { playlistId, pageToken });

  // fetch data from YouTube
  const { data: { nextPageToken, items } } =

    await youtube.playlistItems.list({

      part: 'id,snippet',
      playlistId,
      maxResults: 50,
      pageToken,
      hl: 'ja',

    })

      .catch(({ message: error }) => {

        // log error
        log.error('videoListAPI() YouTube fetch error', {

          error,
          playlistId,
          pageToken,

        });

        // return blank object
        return {

          nextPageToken: null,
          items: [],

        };
      });


  return {

    nextPageToken,
    items

  };
};


const fetchAllChannelVideos = async (playlistId) => {
  log.debug('videoListAPI() fetchVideoPage()', { playlistId });

  /** LOGIC:
   *
   *    videoFetcher() returns:
   *      {
   *        nextPageToken: String || null,
   *        items: Array
   *      }
   *
   *    while (videoFetcher() returns a nextPageToken) {
   *
   *      run videoFetcher() with the new token
   *      and also store the new items
   *
   *    }
   *
   *    on error:
   *
   *      logs the message and stops by return a null token,
   *      and also push an empty items field into the results
   */


  const results = [];

  // set initial conditions
  const search = async token => videoFetcher(playlistId, token);
  let seed = await search();

  results.push(seed.items);

  // while search returns a token, keep searching
  while (seed.nextPageToken) {

    seed = await search(seed.nextPageToken);
    results.push(seed.items);

  }


  return results.flat();

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
          { crawled_at: { [Op.is]: null } }

        ] }

    });

    // Check if there's any channel to be crawled
    if (!uncrawledChannel) {
      return log.debug('videoListAPI() No channels to be crawled');
    }

    // Mark channel as crawled
    uncrawledChannel.crawled_at = utcDate;
    await uncrawledChannel

      .save()
      .catch(({ message: error }) => {

        // Catch and log error, do not return reject to continue the rest of the module
        log.error('videoListAPI() Unable to mark channel as crawled', {

          channel: uncrawledChannel.yt_channel_id,
          error

        });
      });


    // Fetch video list from youtube API
    const channelVideos = await fetchAllChannelVideos(uncrawledChannel.yt_uploads_id)

      .catch(({ message: error }) => {

        // Catch and log error, return empty array to skip rest of module
        log.error('videoListAPI() Error fetching video list', {

          channel: uncrawledChannel.yt_channel_id,
          error

        });

        return [];

      });


    // If there was an error ([]), or there's just no videos to save ([]), skip the rest
    if (!channelVideos.length) {

      return log.debug('videoListAPI() No videos to be saved');

    }


    // Convert video list into promises that save into database and record results
    const logResults = (await Promise.all(channelVideos.map((videoInfo) => {

      const { snippet: { resourceId, title, description, publishedAt } } = videoInfo;

      // Update databse record, insert if any unique key does not exist yet
      return db.Video.upsert({

        channel_id: uncrawledChannel.id,
        yt_video_key: resourceId.videoId,
        title,
        description,
        published_at: moment(publishedAt).tz('UTC'),
        updated_at: utcDate,


      })

        .then((dbResult) =>

          // Add to result list
          ({ [resourceId.videoId]: dbResult })

        )

        .catch(({ message: error }) => {

          // Log error
          log.error('videoListAPI() Cannot save to database', {

            videoInfo: { ...videoInfo, description: '' },
            error

          });


          // Add to result list
          return { [resourceId.videoId]: null };

        });


      // Filter empty objects and flatten
    }))).filter(v => v).flat();


    log.info('videoListAPI() Saved video list', { results: logResults });


  } catch ({ message: error }) {

    log.error('videoListAPI() Uncaught error', { error });

  }
};
