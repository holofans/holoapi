require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { fixchar } = require('fixchar');
const { db, youtube, log, GenericError } = require('../../../modules');
const logger = require('../../../modules/logger');

const RegExes = [

  /* the comment must contain a timestamp of 00:00 format
   * COMMENT_TIMESTAMP_REGEX: */ /\d+:\d+/,

  /* the comment must also contain some annotation for the timestamp
   * here we ask for two or more non numerical, non space, and not ":" characters.
   * COMMENT_ANNOT_REGEX: */ /[^\d\s:]{2,}/
];


const commentFetcher = (channelId, pageToken) =>

  youtube.commentThreads.list({

    allThreadsRelatedToChannelId: channelId,
    part: 'snippet',
    maxResults: 100,
    pageToken

  })
    .then(({ data }) => data)
    .catch(({ message: error }) => {
      log.error('comment crawler Error fetching commentThreads list error', {
        channelId,
        error
      });

      // return a fake parseable object that stops the loop
      return {

        data: { items: [{ snippet: { topLevelComment: { snippet: {

          textOriginal: '00:00 error',
          updatedAt: new Date(0)

        } } } }] } };

    });


const fetchTimestampedYoutubeComments = async (channelId, stopAtDate) => {
  let commentCount = 0;
  const results = [];

  const resultsPush = ({ items }) => items

    // filter comments if they pass regex tests
    .filter(({ snippet }) => RegExes.every(regex => regex.test(snippet.topLevelComment.snippet.textOriginal)))
    .map(({ id, snippet }) => {

      const { textOriginal, publishedAt, updatedAt } = snippet.topLevelComment.snippet;

      // return null if date is old, otherwise return parsed data
      return results.push(
        +new Date(updatedAt) > stopAtDate ?
          {
            video_key: snippet.videoId,
            message: fixchar(textOriginal),
            comment_key: id,
            created_at: publishedAt,
            updated_at: updatedAt

          } : null);
    });


  let seed = await commentFetcher(channelId);
  commentCount += seed.items.length;
  resultsPush(seed);


  // search while token exists and push doesn't return a null object
  while (!results.filter(v => !v).length && seed.nextPageToken) {

    seed = await commentFetcher(channelId, seed.nextPageToken);
    commentCount += seed.items.length;
    resultsPush(seed);
  }


  // log comment count and filter empty objects
  logger.info(`${commentCount} comments were scanned for channel ${channelId}.`);
  return results.filter(v => v);
};


module.exports = async () => {
  const uncrawledChannel = await db.Channel.findOne({
    where: {
      [Op.and]: [
        { yt_channel_id: { [Op.not]: null } }] // must be a youtube video
    },
    order: [['comments_crawled_at', 'NULLS FIRST']] // in ascending order by last crawled time.
  });


  const comments = await fetchTimestampedYoutubeComments(
    uncrawledChannel.yt_channel_id,
    uncrawledChannel.comments_crawled_at && moment(uncrawledChannel.comments_crawled_at).tz('UTC')
  );


  if (comments.length) {
    // generating a map of video hash -> video id to populate our foreign key.
    const videoKeys = [...new Set(comments.map(({ video_key }) => video_key))];

    const videoIdForKeys = await db.Video.findAll({
      attributes: ['id', 'yt_video_key'],
      where: {
        yt_video_key: videoKeys
      }
    });

    const videoKeyToIdMap = Object.fromEntries(
      videoIdForKeys.map(m => [m.yt_video_key, m.id])
    );

    // populate the foreign key video_id --FK--> video.id
    const commentsToUpsert = comments.map(comment => ({
      video_id: videoKeyToIdMap[comment.video_key],
      ...comment
    }));

    const dbSaving = await db.VideoComment.bulkCreate(
      commentsToUpsert, {
        updateOnDuplicate: ['updated_at', 'message']
      });


    log.info(`Comments Crawler saved: ${commentsToUpsert.length} number of comments.`);

    // updating the last crawled time since we crawled successfully, we're updating it
    // to 2 hours ago to prevent any data availability delays from Youtube from impacting us.
    await db.Channel.update(
      { comments_crawled_at: moment().subtract(2, 'h').tz('utc') },
      { where: { id: uncrawledChannel.id }
      });

  } else {
    await db.Channel.update(
      { comments_crawled_at: moment().subtract(2, 'h').tz('utc') },
      { where: { id: uncrawledChannel.id }
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
