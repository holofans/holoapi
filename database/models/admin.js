const { Model } = require('sequelize');
const { TABLES } = require('../../consts');

class Admin extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        discord_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        discord_name: DataTypes.STRING,
        is_admin: DataTypes.STRING,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        granted_by: DataTypes.INTEGER,
      },
      {
        tableName: TABLES.ADMIN,
        sequelize,
      },
    );
  }

  static associate() {
  }
}

module.exports = Admin;
