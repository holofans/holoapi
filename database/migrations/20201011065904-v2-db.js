const { TABLES, ORGANIZATIONS } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(TABLES.CHANNEL, 'organization', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn(TABLES.CHANNEL, 'group', {
      type: Sequelize.STRING,
    });

    await queryInterface.createTable(TABLES.CURATOR, {
      discord_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      discord_name: Sequelize.STRING,
      is_admin: Sequelize.BOOLEAN,
      is_editor: Sequelize.BOOLEAN,
      granted_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: TABLES.CURATOR,
          key: 'discord_id',
        },
        onDelete: 'CASCADE',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.createTable(TABLES.SONG, {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      video_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: TABLES.VIDEO,
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      start: Sequelize.INTEGER,
      duration: Sequelize.INTEGER,
      name: Sequelize.STRING,
      contributor_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: TABLES.CURATOR,
          key: 'discord_id',
        },
        onDelete: 'CASCADE',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.createTable(TABLES.GAME, {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      name: Sequelize.STRING,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addColumn(TABLES.VIDEO, 'game_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: TABLES.GAME,
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.bulkUpdate(TABLES.CHANNEL, {
      organization: ORGANIZATIONS.HOLOLIVE,
    }, {}); // update all rows currently to contain 'Hololive' org
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(TABLES.CHANNEL, 'organization');
    await queryInterface.removeColumn(TABLES.CHANNEL, 'group');
    await queryInterface.removeColumn(TABLES.VIDEO, 'game_id');

    await queryInterface.dropTable(TABLES.SONG);
    await queryInterface.dropTable(TABLES.GAME);
    await queryInterface.dropTable(TABLES.CURATOR);
  },
};
