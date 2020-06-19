const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(TABLES.TABLE_VIDEO, 'comments_crawled_at');
    await queryInterface.addColumn(TABLES.TABLE_CHANNEL, 'comments_crawled_at', { type: Sequelize.DataTypes.DATE });
    await queryInterface.removeColumn(TABLES.TABLE_VIDEO_COMMENT, 'timecode');
    await queryInterface.addColumn(TABLES.TABLE_VIDEO_COMMENT, 'comment_key',
      { type: Sequelize.DataTypes.STRING, allowNull: false, unique: true });
    await queryInterface.changeColumn(TABLES.TABLE_VIDEO_COMMENT, 'message', { type: Sequelize.DataTypes.TEXT });
    await queryInterface.removeIndex(TABLES.TABLE_VIDEO_COMMENT, ['message']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(TABLES.TABLE_VIDEO, 'comments_crawled_at', { type: Sequelize.DataTypes.DATE });
    await queryInterface.removeColumn(TABLES.TABLE_CHANNEL, 'comments_crawled_at');
    await queryInterface.addColumn(TABLES.TABLE_VIDEO_COMMENT, 'timecode', { type: Sequelize.DataTypes.INTEGER });
    await queryInterface.removeColumn(TABLES.TABLE_VIDEO_COMMENT, 'comment_key');
    await queryInterface.changeColumn(TABLES.TABLE_VIDEO_COMMENT, 'message', { type: Sequelize.DataTypes.STRING });
    await queryInterface.addIndex(TABLES.TABLE_VIDEO_COMMENT, ['message']);
  },
};
