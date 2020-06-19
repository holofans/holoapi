const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(TABLES.CHANNEL, 'yt_channel_link', 'yt_channel_id');
    await queryInterface.renameColumn(TABLES.CHANNEL, 'yt_videos_link', 'yt_uploads_id');
    await queryInterface.renameColumn(TABLES.CHANNEL, 'bb_space_link', 'bb_space_id');
    await queryInterface.renameColumn(TABLES.CHANNEL, 'bb_room_link', 'bb_room_id');
    await queryInterface.changeColumn(TABLES.CHANNEL, 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn(TABLES.CHANNEL, 'description', { type: Sequelize.TEXT });
    await queryInterface.changeColumn(TABLES.CHANNEL, 'thumbnail', { type: Sequelize.TEXT });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(TABLES.CHANNEL, 'yt_channel_id', 'yt_channel_link');
    await queryInterface.renameColumn(TABLES.CHANNEL, 'yt_uploads_id', 'yt_videos_link');
    await queryInterface.renameColumn(TABLES.CHANNEL, 'bb_space_id', 'bb_space_link');
    await queryInterface.renameColumn(TABLES.CHANNEL, 'bb_room_id', 'bb_room_link');
    await queryInterface.changeColumn(TABLES.CHANNEL, 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn(TABLES.CHANNEL, 'description', { type: Sequelize.STRING });
    await queryInterface.changeColumn(TABLES.CHANNEL, 'thumbnail', { type: Sequelize.STRING });
  },
};
