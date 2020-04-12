/**
 * VIDEOS INFO
 * Gets full information on newly added videos
 *
 * Logic:
  - fetch videos where:
    - status = null
    - max 50
  - ytapi video.list
    - part = snippet,liveStreamingDetails
    - fields = items(id,snippet(channelId,title,description,publishedAt),status/embeddable,liveStreamingDetails)
  - update video records
 * SCHEDULE: Every 2 mins
    - [YTQUOTA] minsWithNewVids * 7cost = 350 (only on minutes when are new videos)
    - [FS:READ] 720exec * 1search = 720
    - [FS:WRITE] 720exec * numNewVideos = 50
 */

const config = require('config');
const moment = require('moment-timezone');
const {google} = require('googleapis');
const {Firestore} = require('@google-cloud/firestore');

const googleKey = process.env.GOOGLE_API_KEY;
const GCP_AUTH = JSON.parse(process.env.GCP_AUTH);

module.exports = function() {
  console.log('videosInfo() START');
  (async function() {
    // Initiate YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: googleKey,
    });

    // Initialize Firestore
    const firestore = new Firestore({
      credentials: {
        client_email: GCP_AUTH.client_email,
        private_key: GCP_AUTH.private_key,
      },
    });

    // Look for videos without information or status
    const videoCol = firestore.collection('video')
        .where('ytVideoId', '<', '\uf8ff')
        .where('status', '==', 'new')
        .limit(50);
    const videoSch = await videoCol.get();

    // Make list of videos iterable
    const videoResults = {};
    videoSch.forEach((videoItem) => {
      videoResults[videoItem.id] = videoItem.data();
    });

    // If no pending videos
    if (!Object.keys(videoResults).length) {
      return Promise.resolve('No new videos, skipping videos.list');
    }

    // Fetch information of all the new videos from YouTube API
    const ytResults = await youtube.videos.list({
      part: 'snippet,status,liveStreamingDetails',
      id: Object.values(videoResults).map((v) => v.ytVideoId).join(','),
      hl: 'ja',
      fields: 'items(id,snippet(channelId,title,description,publishedAt),status/embeddable,liveStreamingDetails)',
      maxResults: 50,
    }).catch((err) => {
      console.error('videosInfo() Unable to fetch videos.list', err);
      return null;
    });

    // Get current time
    const nowMoment = moment();

    // Run through all new videos
    const videoInfos = ytResults.data.items;
    for (videoInfo of videoInfos) {
      // Structure video object
      const videoObj = {
        ytVideoId: videoInfo.id,
        bbVideoId: null,
        ytChannelId: videoInfo.snippet.channelId,
        bbSpaceId: null,
        title: videoInfo.snippet.title,
        description: videoInfo.snippet.description,
        publishedAt: videoInfo.snippet.publishedAt,
        thumbnail: null,
        embeddable: videoInfo.status.embeddable,
        status: 'info',
        liveSchedule: null,
        liveStart: null,
        liveEnd: null,
        liveViewers: null,
        lateSecs: null,
        durationSecs: null,
      };

      // Video livestream status
      if (videoInfo.liveStreamingDetails) {
        // Is a livestream, check times
        videoObj.liveSchedule = videoInfo.liveStreamingDetails.scheduledStartTime || null;
        videoObj.liveStart = videoInfo.liveStreamingDetails.actualStartTime || null;
        videoObj.liveEnd = videoInfo.liveStreamingDetails.actualEndTime || null;
        videoObj.liveViewers = videoInfo.liveStreamingDetails.concurrentViewers || null;
        const scheduleMoment = moment(videoObj.liveSchedule);
        const startMoment = moment(videoObj.liveStart);
        const endMoment = moment(videoObj.liveEnd);
        // Determine video status
        if (videoObj.liveEnd) {
          videoObj.status = 'past';
        } else if (videoObj.liveStart) {
          videoObj.status = 'live';
        } else if (nowMoment.isSameOrAfter(scheduleMoment)) {
          videoObj.status = 'live'; // waiting = not yet started, but scheduled will be considered live
        } else {
          videoObj.status = 'upcoming';
        }
        // Calculate other data
        if (videoObj.liveEnd) {
          videoObj.durationSecs = moment.duration(endMoment.diff(startMoment)).as('seconds');
        }
        if (videoObj.liveStart) {
          videoObj.lateSecs = moment.duration(startMoment.diff(scheduleMoment)).as('seconds');
        }
      } else {
        // Not a live stream, uploaded video
        videoObj.status = 'uploaded';
      }

      // Save to firestore
      const videoKey = 'video/yt:' + videoInfo.id;
      const videoRef = firestore.doc(videoKey);
      await videoRef.set(videoObj, {merge: true})
          .then((res) => {
            console.log('videosInfo() Successfully saved video', videoInfo.id);
          })
          .catch((err) => {
            console.error('videosInfo() Unable to save video', err);
          });
    }

    return Promise.resolve('Done.');
  })()
      .then((res) => {
        console.log('videosInfo() SUCCESS %s', res || '');
      })
      .catch((err) => {
        console.error('videosInfo() ERROR', err);
      });
};
