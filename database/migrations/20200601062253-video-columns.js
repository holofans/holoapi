const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(TABLES.VIDEO, 'yt_video_id', 'yt_video_key');
    await queryInterface.changeColumn(TABLES.VIDEO, 'yt_video_key', { type: Sequelize.STRING(11) });
    await queryInterface.changeColumn(TABLES.VIDEO, 'bb_video_id', { type: Sequelize.STRING(11) });
    await queryInterface.changeColumn(TABLES.VIDEO, 'description', { type: Sequelize.TEXT });
    await queryInterface.changeColumn(TABLES.VIDEO, 'thumbnail', { type: Sequelize.TEXT });
    await queryInterface.renameColumn(TABLES.VIDEO, 'duration', 'duration_secs');
    await queryInterface.renameColumn(TABLES.VIDEO, 'crawled_at', 'comments_crawled_at');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(TABLES.VIDEO, 'yt_video_key', 'yt_video_id');
    await queryInterface.changeColumn(TABLES.VIDEO, 'yt_video_id', { type: Sequelize.INTEGER });
    await queryInterface.changeColumn(TABLES.VIDEO, 'bb_video_id', { type: Sequelize.INTEGER });
    await queryInterface.changeColumn(TABLES.VIDEO, 'description', { type: Sequelize.STRING });
    await queryInterface.changeColumn(TABLES.VIDEO, 'thumbnail', { type: Sequelize.STRING });
    await queryInterface.renameColumn(TABLES.VIDEO, 'duration_secs', 'duration');
    await queryInterface.renameColumn(TABLES.VIDEO, 'comments_crawled_at', 'crawled_at');
  },
};
