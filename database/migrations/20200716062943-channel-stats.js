const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(TABLES.CHANNEL, 'view_count', {
      type: Sequelize.DataTypes.INTEGER,
      after: 'instagram_link',
    });
    await queryInterface.addColumn(TABLES.CHANNEL, 'subscriber_count', {
      type: Sequelize.DataTypes.INTEGER,
      after: 'view_count',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(TABLES.CHANNEL, 'view_count');
    await queryInterface.removeColumn(TABLES.CHANNEL, 'subscriber_count');
  },
};
