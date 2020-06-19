const consts = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(consts.TABLE_VIDEO, 'comments_crawled_at');
    await queryInterface.addColumn(consts.TABLE_CHANNEL, 'comments_crawled_at', { type: Sequelize.DataTypes.DATE });
    await queryInterface.removeColumn(consts.TABLE_VIDEO_COMMENT, 'timecode');
    await queryInterface.addColumn(consts.TABLE_VIDEO_COMMENT, 'comment_key', { type: Sequelize.DataTypes.STRING });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(consts.TABLE_VIDEO, 'comments_crawled_at', { type: Sequelize.DataTypes.DATE });
    await queryInterface.removeColumn(consts.TABLE_CHANNEL, 'comments_crawled_at');
    await queryInterface.addColumn(consts.TABLE_VIDEO_COMMENT, 'timecode', { type: Sequelize.DataTypes.INTEGER });
    await queryInterface.removeColumn(consts.TABLE_VIDEO_COMMENT, 'comment_key');
  },
};
