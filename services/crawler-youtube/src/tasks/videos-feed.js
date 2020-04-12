/**
 * VIDEOS FEED
 * Gets latest videos from each channel through YouTube XML feed
 *
 * Logic:
  - feed xml
    - first two videoIds, save to db
 * SCHEDULE: Every 2 mins
    - [YTQUOTA] none
    - Cache Approach
      - [FS:READ] none
      - [FS:WRITE] numNewVids = 50 (varies with pod count, cache ttls, etc)
    - Read Approach
      - [FS:READ] 720exec * 2vids * numChannels = 72,000
      - [FS:WRITE] numNewVids = 50
 */

const config = require('config');
const axios = require('axios');
const {Firestore} = require('@google-cloud/firestore');

const videoIdRegex = RegExp('<yt:videoId>(.*?)</yt:videoId>', 'gim');

const GCP_AUTH = JSON.parse(process.env.GCP_AUTH);

module.exports = function() {
  console.log('videosFeed() START');
  (async function() {
    // Initialize Firestore
    const firestore = new Firestore({
      credentials: {
        client_email: GCP_AUTH.client_email,
        private_key: GCP_AUTH.private_key,
      },
    });

    // To compile list of new videoIDs to be saved
    let videoIds = [];

    // Run through all channels in config
    for (channelId of config.channels) {
      // Get YouTube feed XML
      console.log('videosFeed() Fetching YT XML feed for', channelId);
      const fetchFeed = await axios.get('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId)
          .catch((err) => {
            console.warn('videosFeed() Unable to fetch channel feed XML data', err);
            return null;
          });
      if (!fetchFeed || !fetchFeed.data) continue;

      // Extract latest two video IDs
      let channelVideos = [];
      while ((match = videoIdRegex.exec(fetchFeed.data))) channelVideos.push(match[1]);
      channelVideos = channelVideos.splice(0, 2);
      videoIds = videoIds.concat(channelVideos);
    }

    // Insert all videos into database
    for (videoId of videoIds) {
      const videoKey = 'video/yt:' + videoId;
      const videoRef = firestore.doc(videoKey);
      const videoData = await videoRef.get(); /** @TODO Get from cache instead of firestore */
      if (!videoData.exists) {
        await videoRef.set({
          ytVideoId: videoId,
          bbVideoId: null,
          status: 'new',
        }, {merge: true})
            .then((res) => {
              console.log('videosFeed() Successfully added video', videoId);
            })
            .catch((err) => {
              console.error('videosFeed() Unable to add video', err);
            });
      }
    }

    return Promise.resolve('Done.');
  })()
      .then((res) => {
        console.log('videosFeed() SUCCESS %s', res || '');
      })
      .catch((err) => {
        console.error('videosFeed() ERROR', err);
      });
};
