const { Model } = require('sequelize');
const { TABLES } = require('../../consts');

class Song extends Model {
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
          references: {
            model: TABLES.VIDEO,
            key: 'id',
          },
          onDelete: 'cascade',
        },
        start: DataTypes.INTEGER,
        duration: DataTypes.INTEGER,
        name: DataTypes.STRING,
        contributor_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: TABLES.CURATOR,
            key: 'discord_id',
          },
          onDelete: 'cascade',
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: TABLES.SONG,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.contributor = this.belongsTo(models.Curator, { as: 'contributor', foreignKey: 'contributor_id' });
    this.video = this.belongsTo(models.Video, { as: 'video', foreignKey: 'video_id' });
  }
}

module.exports = Song;
