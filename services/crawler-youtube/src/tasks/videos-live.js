/**
 * VIDEOS LIVE
 * Checks status of known live videos using heartbeat
 * This lets us know if the live has ended
 *
 * Logic:
  - fetch videos where:
    - status = live || status = upcoming
  - live:
    - heartbeat
    - update status
  - upcoming:
    - scheduled date >= now()
    - status = live
 * SCHEDULE: Every 1 min
    - [YTQUOTA] 1440exec * 3cost = 4320
    - [FS:READ]
    - [FS:WRITE]
 */

const config = require('config');
const moment = require('moment-timezone');
const {google} = require('googleapis');
const {Firestore} = require('@google-cloud/firestore');

const googleKey = process.env.GOOGLE_API_KEY;
const GCP_AUTH = JSON.parse(process.env.GCP_AUTH);

module.exports = function() {
  console.log('videosLive() START');
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
        .where('status', 'in', ['live', 'upcoming']);
    const videoSch = await videoCol.get();

    // Categorize videos
    const checkVideos = {}; // videos to be checked for live status
    const upcomingVideos = {}; // upcoming videos only
    videoSch.forEach((videoItem) => {
      const videoData = videoItem.data();
      if (videoData.status == 'live') {
        checkVideos[videoItem.id] = videoData;
      } else if (videoData.status == 'upcoming') {
        upcomingVideos[videoItem.id] = videoData;
      }
    });

    // To compile list of videos to be updated
    const updateVideos = {};

    // Get current time
    const nowMoment = moment();

    // Check upcoming videos for scheduled time
    for (videoKey in upcomingVideos) {
      const videoInfo = upcomingVideos[videoKey];
      const scheduleMoment = moment(videoInfo.liveSchedule);
      // Handle videos based on timings
      if (nowMoment.isSameOrAfter(scheduleMoment)) {
        // Handle late streamers, just update and mark them as live
        updateVideos[videoKey] = {status: 'live'};
      } else if (nowMoment.isSameOrAfter(scheduleMoment.subtract(10, 'minute'))) {
        // Handle early streamers, 10 minutes before scheduled time, start checking live status
        checkVideos[videoKey] = videoInfo;
      }
    }

    // Handle videos marked for checking
    if (Object.keys(checkVideos).length) {
      // Warn if more than 50 livestreams
      if (Object.keys(checkVideos).length > 50) {
        console.warn('videosLive() More than 50 livestreams at a time! Not all videos will be checked!');
      }

      // Make a video key string for YouTube request
      const videoKeys = Object.values(checkVideos).map((v) => v.ytVideoId).slice(0, 50).join(',');
      // console.log('videosLive() Checking Videos', videoKeys)

      // Fetch information of all the new videos from YouTube API
      const ytResults = await youtube.videos.list({
        part: 'liveStreamingDetails',
        id: videoKeys,
        hl: 'ja',
        fields: 'items(id,liveStreamingDetails)',
        maxResults: 50,
      }).catch((err) => {
        console.error('videosLive() Unable to fetch videos.list', err);
        return null;
      });

      // Run through all new videos
      const videoInfos = ytResults.data.items;
      for (videoInfo of videoInfos) {
        const videoId = videoInfo.id;
        const videoKey = 'yt:' + videoId;
        const oldInfo = checkVideos[videoKey];
        // Video livestream status
        if (videoInfo.liveStreamingDetails) {
          const liveSchedule = videoInfo.liveStreamingDetails.scheduledStartTime || null;
          const liveStart = videoInfo.liveStreamingDetails.actualStartTime || null;
          const liveEnd = videoInfo.liveStreamingDetails.actualEndTime || null;
          const liveViewers = videoInfo.liveStreamingDetails.concurrentViewers || null;
          // console.log('videosLive() liveStreamingDetails', videoId, oldInfo.status, '|', liveSchedule, '|', liveStart, '|', liveEnd, '|', liveViewers)
          const scheduleMoment = moment(liveSchedule);
          const startMoment = moment(liveStart);
          const endMoment = moment(liveEnd);
          // Check upcoming if it has already started
          if (oldInfo.status == 'upcoming' && liveStart) {
            if (!updateVideos[videoKey]) updateVideos[videoKey] = {};
            updateVideos[videoKey].status = 'live';
          }
          // Check live if it has already ended
          if (oldInfo.status == 'live' && liveEnd) {
            if (!updateVideos[videoKey]) updateVideos[videoKey] = {};
            updateVideos[videoKey].status = 'past';
          }
          // If live has already started, check late time
          if (!oldInfo.lateSecs && liveStart) {
            if (!updateVideos[videoKey]) updateVideos[videoKey] = {};
            updateVideos[videoKey].lateSecs = moment.duration(startMoment.diff(scheduleMoment)).as('seconds');
          }
          // If live has already ended, check duration
          if (!oldInfo.durationSecs && liveEnd) {
            if (!updateVideos[videoKey]) updateVideos[videoKey] = {};
            updateVideos[videoKey].durationSecs = moment.duration(endMoment.diff(startMoment)).as('seconds');
          }
          // If live has already ended, check duration
          if (liveViewers) {
            if (!updateVideos[videoKey]) updateVideos[videoKey] = {};
            updateVideos[videoKey].liveViewers = liveViewers;
          }
        }
      }
    }

    // Check if videos to update is within expected
    if (Object.keys(updateVideos).length > 50) {
      console.warn('videosLive() Videos to be updated more than expected');
    }

    // Update all videos that were marked
    for (videoKey in updateVideos) {
      const updateData = updateVideos[videoKey];
      const videoPath = 'video/' + videoKey;
      const videoRef = firestore.doc(videoPath);
      // console.log('SAVE', videoKey, updateData);
      await videoRef.set(updateData, {merge: true})
          .then((res) => {
            console.log('videosLive() Successfully saved video', videoKey, updateData);
          })
          .catch((err) => {
            console.error('videosLive() Unable to save video', err);
          });
    }

    return Promise.resolve('Done.');
  })()
      .then((res) => {
        console.log('videosLive() SUCCESS %s', res || '');
      })
      .catch((err) => {
        console.error('videosLive() ERROR', err);
      });
};
