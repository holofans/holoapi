const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(TABLES.VIDEO, 'comments_crawled_at');
    await queryInterface.addColumn(TABLES.CHANNEL, 'comments_crawled_at', { type: Sequelize.DataTypes.DATE });
    await queryInterface.removeColumn(TABLES.VIDEO_COMMENT, 'timecode');
    await queryInterface.addColumn(TABLES.VIDEO_COMMENT, 'comment_key',
      { type: Sequelize.DataTypes.STRING, allowNull: false, unique: true });
    await queryInterface.changeColumn(TABLES.VIDEO_COMMENT, 'message', { type: Sequelize.DataTypes.TEXT });
    await queryInterface.removeIndex(TABLES.VIDEO_COMMENT, ['message']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(TABLES.VIDEO, 'comments_crawled_at', { type: Sequelize.DataTypes.DATE });
    await queryInterface.removeColumn(TABLES.CHANNEL, 'comments_crawled_at');
    await queryInterface.addColumn(TABLES.VIDEO_COMMENT, 'timecode', { type: Sequelize.DataTypes.INTEGER });
    await queryInterface.removeColumn(TABLES.VIDEO_COMMENT, 'comment_key');
    await queryInterface.changeColumn(TABLES.VIDEO_COMMENT, 'message', { type: Sequelize.DataTypes.STRING });
    await queryInterface.addIndex(TABLES.VIDEO_COMMENT, ['message']);
  },
};
