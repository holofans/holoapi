const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn(TABLES.CHANNEL, 'organization', {
      type: Sequelize.DataTypes.STRING,
    });
    await queryInterface.addColumn(TABLES.CHANNEL, 'group', {
      type: Sequelize.DataTypes.STRING,
    });

    await queryInterface.createTable(TABLES.ADMIN, {
      discord_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      discord_name: DataTypes.STRING,
      is_admin: DataTypes.BOOLEAN,
      created_at: DataTypes.DATE,
      granted_by: DataTypes.INTEGER,
    });

    await queryInterface.createTable(TABLES.SONG, {
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
      },
      start: DataTypes.INTEGER,
      duration: DataTypes.INTEGER,
      name: DataTypes.STRING,
      created_at: DataTypes.DATE,
      contributor_id: DataTypes.INTEGER,
    });

    await queryInterface.createTable(TABLES.GAME, {
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
      },
      name: DataTypes.STRING,
      created_at: DataTypes.DATE,
      contributor_id: DataTypes.INTEGER,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(TABLES.CHANNEL, 'organization');
    await queryInterface.removeColumn(TABLES.CHANNEL, 'group');
    await queryInterface.dropTable(TABLES.CHANNEL);
    await queryInterface.dropTable(TABLES.SONG);
    await queryInterface.dropTable(TABLES.GAME);
  },
};
