const { Model } = require('sequelize');
const consts = require('../../consts');

class ChannelStats extends Model {
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
        yt_views: DataTypes.INTEGER,
        yt_subscribers: DataTypes.INTEGER,
        bb_followers: DataTypes.INTEGER,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: consts.TABLE_CHANNEL_STATS,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.channel = this.belongsTo(models.Channel, { as: 'channel', foreignKey: 'channel_id' });
  }
}

module.exports = ChannelStats;
