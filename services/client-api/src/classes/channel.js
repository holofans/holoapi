const {consts} = require('../library');

/**
 * HoloChannel
 */
class HoloChannel {
  /**
   * HoloChannel()
   * @param {Object} data video data from Firestore
   */
  constructor(data) {
    this.ytChannelId = data.ytChannelId;
    this.bbSpaceId = data.bbSpaceId;
    this.name = data.name;
    this.description = data.description;
    this.thumbnail = data.thumbnail;
    this.publishedAt = data.publishedAt;
    this.subscriberCount = data.subscriberCount;
    this.viewCount = data.viewCount;
  }

  /**
   * toJSON()
   * @return {Object} Human-readable representation of this HoloChannel
   */
  toJSON() {
    if (this.ytChannelId) return this.toYouTubeJSON();
    if (this.bbSpaceId) return this.toBiliBiliJSON();
    return null;
  }

  /**
   * @return {Object} Human-readable representation of a YouTube HoloChannel
   */
  toYouTubeJSON() {
    return {
      type: consts.VIDEO_TYPES.YOUTUBE,
      id: this.ytChannelId,
      name: this.name,
      description: this.description,
      image: this.thumbnail,
      published: this.publishedAt,
      subscriberCount: this.subscriberCount,
      viewCount: this.viewCount,
    };
  }

  /**
   * @return {Object} Human-readable representation of a BiliBili HoloChannel
   */
  toBiliBiliJSON() {
    return {
      type: consts.VIDEO_TYPES.BILIBILI,
      id: this.bbSpaceId,
      name: this.name,
      description: this.description,
      image: this.thumbnail,
      published: this.publishedAt,
      subscriberCount: this.subscriberCount,
    };
  }
}

module.exports = HoloChannel;
