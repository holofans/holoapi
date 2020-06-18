require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const _ = require('lodash');
const { db, youtube, log, GenericError } = require('../../../modules');

/*
  - fetch videos where:
    - comments_crawled_at == false
    - publishDate < now() - 48 hrs
  - ytapi commentThreads.list
    - if db.nextPageToken, use db.nextPageToken
    - part = snippet
    - fields = nextPageToken,pageInfo,items(snippet/topLevelComment/snippet/textOriginal)
    - (every 5 minutes) 1440 / 5 x 3 = 864
  - save stamps for video
    - if res.nextPageToken
      - db.nextPageToken = res.nextPageToken
    - no res.nextPageToken
      - crawledStamps = true
      - db.nextPageToken = null
      */

const twoDaysAgo = () => moment().subtract(2, 'days').tz('UTC');

const fetchYoutubeComments = async (channelId, pageNumber, nextPageToken, list = []) => {
  debugger; // lol i'm using VSCode Debugging so kepeing this here so it doesn't always reload and search...

  const ytData = await youtube.commentThreads.list(
    { allThreadsRelatedToChannelId: channelId,
      part: 'snippet',
      maxResults: 100,
      ...(nextPageToken && { pageToken: nextPageToken }),
    },
  )
    .then((ytResult) => ytResult.data).catch((err) => {
      debugger;
      log.error('comment crawler Error fetching commentThreads list error', {
        videoId,
        err: err.tostring(),
      });
      return 'e';
    });

  log.info(`${pageNumber} pg has ${ytData.items.length} comments, ${
    ytData.items[0].snippet.topLevelComment.snippet.publishedAt}`);
  if (ytData.nextPageToken) await fetchYoutubeComments(videoId, pageNumber + 1, ytData.nextPageToken);
  return ytData;
};

module.exports = async () => {
  const uncrawledVideo = await db.Video.findAll({
    where: {
      [Op.and]: [
        { yt_video_key: { [Op.not]: null } }, // must be a youtube video
        { comments_crawled_at: { [Op.is]: null } }, // hasn't been crawled yet
        { published_at: { [Op.lt]: twoDaysAgo() } },
      ],
    },
    limit: 5,
  });

  fetchYoutubeComments('huh', 1);

  // uncrawledVideo.map(async ({ yt_video_key, id }) => {
  //   // fetch all the comments.
  //   const comments = await fetchYoutubeComments(yt_video_key);
  //   log.debug(yt_video_key);
  //   log.debug(id);
  //   debugger;
  //   return 0;
  // });
};

/*
random code snippet for comment searching if we want to enable it in API:

  const ytCommentSearch = youtube.commentThreads.list({
    allThreadsRelatedToChannelId: 'UC1opHUrw8rvnsadT-iGp7Cg',
    part: 'snippet',
    searchTerms: 'Theory of Happiness',
  }).then(lts => {
    debugger;
  })
*/
