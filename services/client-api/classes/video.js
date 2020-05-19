const {consts} = require('../library');

/**
 * HoloVideo
 */
class HoloVideo {
  /**
   * HoloVideo()
   * @param {Object} data video data from Firestore
   */
  constructor(data) {
    this.ytVideoId = data.ytVideoId;
    this.ytChannelId = data.ytChannelId;
    this.bbVideoId = data.bbVideoId;
    this.bbSpaceId = data.bbSpaceId;
    this.title = data.title;
    this.description = data.description;
    this.thumbnail = data.thumbnail;
    this.status = data.status;
    this.liveSchedule = data.liveSchedule;
    this.liveViewers = data.liveViewers;
  }

  /**
   *
   */
  get ytThumbnail() {
    return this.ytVideoId ? `https://i.ytimg.com/vi/${this.ytVideoId}/hqdefault.jpg` : null
  }

  /**
   * toJSON()
   * @return {Object} Human-readable representation of this HoloVideo
   */
  toJSON() {
    if (this.ytVideoId) return this.toYouTubeJSON();
    if (this.bbVideoId) return this.toBiliBiliJSON();
    return null;
  }

  /**
   * @return {Object} Human-readable representation of a YouTube HoloVideo
   */
  toYouTubeJSON() {
    const json = {
      type: consts.VIDEO_TYPES.YOUTUBE,
      id: this.ytVideoId,
      channel: this.ytChannelId,
      title: this.title,
      description: this.description,
      image: this.ytThumbnail,
      status: this.status,
      timeScheduled: this.liveSchedule,
    };
    if (this.status == consts.VIDEO_STATUSES.LIVE && this.liveViewers) json.viewers = this.liveViewers;
    return json;
  }

  /**
   * @return {Object} Human-readable representation of a BiliBili HoloVideo
   */
  toBiliBiliJSON() {
    const json = {
      type: consts.VIDEO_TYPES.BILIBILI,
      id: this.bbVideoId,
      channel: this.bbSpaceId,
      title: this.title,
      description: this.description,
      image: this.thumbnail,
      status: this.status,
      timeStart: this.liveStart,
    };
    if (this.status == consts.VIDEO_STATUSES.LIVE && this.liveViewers) json.viewers = this.liveViewers;
    return json;
  }
}

module.exports = HoloVideo;
