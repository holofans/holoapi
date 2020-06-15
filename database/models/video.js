const { Model } = require('sequelize');
const consts = require('../../consts');

class Video extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        channel_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        yt_video_key: {
          type: DataTypes.STRING(11),
          unique: true,
        },
        bb_video_id: {
          type: DataTypes.INTEGER,
          unique: true,
        },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        thumbnail: DataTypes.TEXT,
        published_at: DataTypes.DATE,
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: consts.STATUSES.NEW,
        },
        live_schedule: DataTypes.DATE,
        live_start: DataTypes.DATE,
        live_end: DataTypes.DATE,
        live_viewers: DataTypes.INTEGER,
        is_uploaded: DataTypes.BOOLEAN,
        late_secs: DataTypes.INTEGER,
        duration_secs: DataTypes.INTEGER,
        is_captioned: DataTypes.BOOLEAN,
        is_licensed: DataTypes.BOOLEAN,
        is_embeddable: DataTypes.BOOLEAN,
        comments_crawled_at: DataTypes.DATE,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: consts.TABLE_VIDEO,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.channel = this.belongsTo(models.Channel, { as: 'channel', foreignKey: 'channel_id' });
    this.comments = this.hasMany(models.VideoComment, { as: 'comments', foreignKey: 'video_id' });
  }
}

module.exports = Video;
