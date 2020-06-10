const consts = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'yt_channel_link', 'yt_channel_id');
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'yt_videos_link', 'yt_uploads_id');
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'bb_space_link', 'bb_space_id');
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'bb_room_link', 'bb_room_id');
    await queryInterface.changeColumn(consts.TABLE_CHANNEL, 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn(consts.TABLE_CHANNEL, 'description', { type: Sequelize.TEXT });
    await queryInterface.changeColumn(consts.TABLE_CHANNEL, 'thumbnail', { type: Sequelize.TEXT });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'yt_channel_id', 'yt_channel_link');
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'yt_uploads_id', 'yt_videos_link');
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'bb_space_id', 'bb_space_link');
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'bb_room_id', 'bb_room_link');
    await queryInterface.changeColumn(consts.TABLE_CHANNEL, 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn(consts.TABLE_CHANNEL, 'description', { type: Sequelize.STRING });
    await queryInterface.changeColumn(consts.TABLE_CHANNEL, 'thumbnail', { type: Sequelize.STRING });
  },
};
