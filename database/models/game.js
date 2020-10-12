const { Model } = require('sequelize');
const { TABLES } = require('../../consts');

class Game extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
        },
        video_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        name: DataTypes.STRING,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        contributor_id: DataTypes.INTEGER,
      },
      {
        tableName: TABLES.GAME,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.contributor = this.belongsTo(models.Admin, { as: 'contributor', foreignKey: 'contributor_id' });
    this.video = this.belongsTo(models.Video, { as: 'video', foreignKey: 'video_id' });
  }
}

module.exports = Game;
