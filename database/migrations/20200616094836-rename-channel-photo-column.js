const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn(TABLES.CHANNEL, 'thumbnail', 'photo');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn(TABLES.CHANNEL, 'photo', 'thumbnail');
  },
};
