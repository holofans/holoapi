const { Model } = require('sequelize');
const { TABLES } = require('../../consts');

class Game extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        name: DataTypes.STRING,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: TABLES.GAME,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.videos = this.hasMany(models.Video, { as: 'videos', foreignKey: 'game_id' });
  }
}

module.exports = Game;
