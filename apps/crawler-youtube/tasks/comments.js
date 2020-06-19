require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { fixchar } = require('fixchar');
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
      log.error('comment crawler Error fetching commentThreads list error', {
        channelId,
        err: err.tostring(),
      });
    });

    // Check if we need to continue paginating
    if (ytData.items.length > 0) {
      const earliestDateInPage = ytData.items[ytData.items.length - 1].snippet.topLevelComment.snippet.updatedAt;
      yield ytData.items;

      hasNextPage = !!ytData.nextPageToken && (!stopAtDate || moment(earliestDateInPage) > stopAtDate);
      nextPageToken = ytData.nextPageToken;

      log.info(`new page: ${earliestDateInPage} ... going until ${stopAtDate}`);
    } else {
      // for some reason it's possible to have a fully empty page but not have it be the last page ?!
      hasNextPage = !!ytData.nextPageToken;
      nextPageToken = ytData.nextPageToken;
    }
  }
}

const commentThreadToComment = (ytCommentThread) => ({
  video_key: ytCommentThread.snippet.videoId,
  message: fixchar(ytCommentThread.snippet.topLevelComment.snippet.textOriginal),
  comment_key: ytCommentThread.id,
  created_at: ytCommentThread.snippet.topLevelComment.snippet.publishedAt,
  updated_at: ytCommentThread.snippet.topLevelComment.snippet.updatedAt,
});

// the comment must contain a timestamp of 00:00 format
const COMMENT_TIMESTAMP_REGEX = /\d+:\d+/;
// the comment must also contain some annotation for the timestamp
// here we ask for two or more non numerical, non space, and not ":" characters.
const COMMENT_ANNOT_REGEX = /[^\d\s:]{2,}/;

const fetchTimestampedYoutubeComments = async (channelId, lastCrawlTime) => {
  let comments = [];
  let commentCount = 0;
  const iterator = fetchPagesOfComments(channelId, lastCrawlTime);
  // eslint-disable-next-line no-restricted-syntax
  for await (const page of iterator) {
    commentCount += page.length;
    comments = comments.concat(
      page
        .filter(
          (ytCommentThread) => (
            COMMENT_TIMESTAMP_REGEX.test(ytCommentThread.snippet.topLevelComment.snippet.textOriginal)
          && COMMENT_ANNOT_REGEX.test(ytCommentThread.snippet.topLevelComment.snippet.textOriginal)
          && !!ytCommentThread.snippet.videoId),
        )
        .map(commentThreadToComment),
    );
  }

  logger.info(`${commentCount} comments were scanned for channel ${channelId}.`);
  return comments;
};

module.exports = async () => {
  const uncrawledChannel = await db.Channel.findOne({
    where: {
      [Op.and]: [
        { yt_channel_id: { [Op.not]: null } }, // must be a youtube video
      ],
    },
    order: [['comments_crawled_at', 'NULLS FIRST']], // in ascending order by last crawled time.
  });

  const comments = await fetchTimestampedYoutubeComments(
    uncrawledChannel.yt_channel_id,
    uncrawledChannel.comments_crawled_at && moment(uncrawledChannel.comments_crawled_at).tz('UTC'),
  );

  if (comments.length > 0) {
    // generating a map of video hash -> video id to populate our foreign key.
    const videoKeys = [...new Set(comments.map(({ video_key }) => video_key))];

    const videoIdForKeys = await db.Video.findAll({
      attributes: ['id', 'yt_video_key'],
      where: {
        yt_video_key: videoKeys,
      },
    });

    const videoKeyToIdMap = Object.fromEntries(
      videoIdForKeys.map((m) => [m.yt_video_key, m.id]),
    );

    // populate the foreign key video_id --FK--> video.id
    const commentsToUpsert = comments.map((comment) => ({
      video_id: videoKeyToIdMap[comment.video_key],
      ...comment,
    }));

    const dbSaving = await db.VideoComment.bulkCreate(commentsToUpsert, {
      updateOnDuplicate: ['updated_at', 'message'],
    });

    log.info(`Comments Crawler saved: ${commentsToUpsert.length} number of comments.`);

    // updating the last crawled time since we crawled successfully, we're updating it
    // to 2 hours ago to prevent any data availability delays from Youtube from impacting us.
    await db.Channel.update({ comments_crawled_at: moment().subtract(2, 'h').tz('utc') },
      {
        where: { id: uncrawledChannel.id },
      });
  } else {
    await db.Channel.update({ comments_crawled_at: moment().subtract(2, 'h').tz('utc') },
      {
        where: { id: uncrawledChannel.id },
      });
  }
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
