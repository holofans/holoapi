require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
// const { ne } = require('sequelize/types/lib/operators');
const { db, youtube, log, GenericError } = require('../../../modules');
const logger = require('../../../modules/logger');

/**
 * Fetches Comments from Youtube and yields once per page.
 *
 * Async Generator described here:
 * https://dev.to/exacs/es2018-real-life-simple-usage-of-async-iteration-get-paginated-data-from-rest-apis-3i2e
 *
 * @param {string=} channelId
 */
async function* fetchPagesOfComments(channelId, stopAtDate) {
  let hasNextPage = true;
  let nextPageToken = null;
  while (hasNextPage) {
    // eslint-disable-next-line no-await-in-loop
    const ytData = await youtube.commentThreads.list(
      { allThreadsRelatedToChannelId: channelId,
        part: 'snippet',
        maxResults: 100,
        ...(nextPageToken && { pageToken: nextPageToken }),
      },
    ).then((ytResult) => ytResult.data).catch((err) => {
      debugger;
      log.error('comment crawler Error fetching commentThreads list error', {
        channelId,
        err: err.tostring(),
      });
    });

    // Check if we need to continue paginating
    const earliestDateInPage = ytData.items[ytData.items.length - 1].snippet.topLevelComment.snippet.updatedAt;

    hasNextPage = !!ytData.nextPageToken && (!stopAtDate || earliestDateInPage < stopAtDate);
    nextPageToken = ytData.nextPageToken;

    debugger;
    yield ytData.items;
  }
}

const commentThreadToComment = (ytCommentThread) => ({
  video_key: ytCommentThread.snippet.videoId,
  message: ytCommentThread.snippet.topLevelComment.snippet.textOriginal,
  comment_key: ytCommentThread.id,
  created_at: ytCommentThread.snippet.topLevelComment.snippet.publishedAt,
  updated_at: ytCommentThread.snippet.topLevelComment.snippet.updatedAt,
});

// the comment must contain a timestamp of 00:00 format
const COMMENT_TIMESTAMP_REGEX = /\d+:\d+/;
// the comment must also contain some annotation for the timestamp
// here we ask for two or more non numerical, non space, and not ":" characters.
const COMMENT_ANNOT_REGEX = /[^\d\s:]{2,}/;

const fetchTimestampedYoutubeComments = async (channelId) => {
  debugger; // lol i'm using VSCode Debugging so kepeing this here so it doesn't always reload and search...
  let comments = [];
  let commentCount = 0;
  const iterator = fetchPagesOfComments(channelId);
  // eslint-disable-next-line no-restricted-syntax
  for await (const page of iterator) {
    debugger;
    commentCount += page.length;
    comments = comments.concat(
      page
        .map(commentThreadToComment)
        .filter(
          ({ message }) => COMMENT_TIMESTAMP_REGEX.test(message) && COMMENT_ANNOT_REGEX.test(message),
        ),
    );
  }

  logger.info(`${commentCount} comments were scanned.`);
  return comments;
};

module.exports = async () => {
  const uncrawledChannel = await db.Channel.findOne({
    where: {
      [Op.and]: [
        { yt_channel_id: { [Op.not]: null } }, // must be a youtube video
      ],
    },
    order: ['comments_crawled_at'], // in ascending order by last crawled time.
  });

  const comments = fetchTimestampedYoutubeComments(uncrawledChannel.yt_channel_id);

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
