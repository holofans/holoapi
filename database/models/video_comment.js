const { Model } = require('sequelize');
const { TABLES } = require('../../consts');

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
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        comment_key: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
      },
      {
        tableName: TABLES.VIDEO_COMMENT,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.video = this.belongsTo(models.Video, { as: 'video', foreignKey: 'video_id' });
  }
}

module.exports = VideoComment;
