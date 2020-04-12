/**
 * CRAWL COMMENTS
 * Gets comments from videos to check for timestamps
 *
 * Logic:
  - fetch videos where:
    - crawledStamps == false
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

module.exports = function() {
  (async function() {
    console.log('crawlComments() START');
    const result = {};

    // logic

    console.log('crawlComments() SUCCESS', result);
  })()
      .catch((err) => {
        console.log('crawlComments() ERROR', err);
      });
};
