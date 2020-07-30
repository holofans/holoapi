const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(TABLES.CHANNEL, 'video_count', {
      type: Sequelize.DataTypes.INTEGER,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(TABLES.CHANNEL, 'video_count');
  },
};
