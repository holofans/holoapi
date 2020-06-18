require('dotenv').config();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
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

function twoDaysAgo() {
  return moment().subtract(2, 'days').tz('UTC');
}

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


  uncrawledVideo.map(({ yt_video_key, id }) => {
    // fetch all the comments.
    // youtube.commentThreads.list({videoId: "videoID"})
    log.debug(yt_video_key);
    log.debug(id);
    return 0;
  });
};
