const { Model } = require('sequelize');
const { TABLES } = require('../../consts');

class Curator extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        discord_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
        },
        discord_name: DataTypes.STRING,
        is_admin: DataTypes.BOOLEAN, // some users are admin users
        is_editor: DataTypes.BOOLEAN, // some users are granted edit powers
        granted_by: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: TABLES.CURATOR,
            key: 'discord_id',
          },
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        tableName: TABLES.CURATOR,
        sequelize,
      },
    );
  }

  static associate(models) {
    this.granter = this.belongsTo(models.Curator,
      { as: 'granter', sourceKey: 'discord_id', foreignKey: 'granted_by' });
    this.children = this.hasMany(models.Curator,
      { as: 'children', sourceKey: 'granted_by', foreignKey: 'discord_id' });
    this.createdSongs = this.hasMany(models.Song,
      { as: 'created_songs', foreignKey: 'contributor_id', sourceKey: 'discord_id' });
  }
}

module.exports = Curator;
