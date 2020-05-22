const { Model } = require('sequelize');
const consts = require('../../consts');

class VideoComment extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        video_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        timecode: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        message: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: consts.TABLE_VIDEO_COMMENT,
        freezeTableName: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
        sequelize,
      },
    );
  }
}

module.exports = VideoComment;
