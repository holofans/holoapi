const consts = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(consts.TABLE_VIDEO, 'yt_video_id', 'yt_video_key');
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'yt_video_key', { type: Sequelize.STRING(11) });
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'bb_video_id', { type: Sequelize.STRING(11) });
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'description', { type: Sequelize.TEXT });
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'thumbnail', { type: Sequelize.TEXT });
    await queryInterface.renameColumn(consts.TABLE_VIDEO, 'duration', 'duration_secs');
    await queryInterface.renameColumn(consts.TABLE_VIDEO, 'crawled_at', 'comments_crawled_at');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(consts.TABLE_VIDEO, 'yt_video_key', 'yt_video_id');
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'yt_video_id', { type: Sequelize.INTEGER });
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'bb_video_id', { type: Sequelize.INTEGER });
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'description', { type: Sequelize.STRING });
    await queryInterface.changeColumn(consts.TABLE_VIDEO, 'thumbnail', { type: Sequelize.STRING });
    await queryInterface.renameColumn(consts.TABLE_VIDEO, 'duration_secs', 'duration');
    await queryInterface.renameColumn(consts.TABLE_VIDEO, 'comments_crawled_at', 'crawled_at');
  },
};
