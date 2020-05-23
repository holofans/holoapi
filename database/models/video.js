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
        yt_video_id: {
          type: DataTypes.INTEGER,
          unique: true,
        },
        bb_video_id: {
          type: DataTypes.INTEGER,
          unique: true,
        },
        title: DataTypes.STRING,
        description: DataTypes.STRING,
        thumbnail: DataTypes.STRING,
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
        duration: DataTypes.INTEGER,
        is_captioned: DataTypes.BOOLEAN,
        is_licensed: DataTypes.BOOLEAN,
        is_embeddable: DataTypes.BOOLEAN,
        crawled_at: DataTypes.DATE,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: consts.TABLE_CHANNEL_STATS,
        freezeTableName: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
        sequelize,
      },
    );
  }

  static associate(models) {
    this.channel = this.belongsTo(models.Channel);
    this.comments = this.hasMany(models.VideoComment);
  }
}

module.exports = Video;
