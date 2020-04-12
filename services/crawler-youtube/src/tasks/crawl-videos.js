/**
 * CRAWL VIDEOS
 * Gets all videos from all channels since the beginning
 *
 * Logic:
  - get channels where:
      - fullyCrawled == false
      - for that specific channel:
        - PlaylistItems.list
          - (every minute) numChannels x numPages x 3 = ?
          - if has db.nextPageToken
            - fetch db.nextPageToken
            - db.nextPageToken = res.nextPageToken
          - if no nextPageToken
            - nextPageToken = null
            - fullyCrawled = true
            - lastCrawlTime = now()
 */

module.exports = function() {
  (async function() {
    console.log('crawlVideos() START');
    const result = {};

    // logic

    console.log('crawlVideos() SUCCESS', result);
  })()
      .catch((err) => {
        console.log('crawlVideos() ERROR', err);
      });
};
