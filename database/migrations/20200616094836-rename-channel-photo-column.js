const consts = require('../../consts');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn(consts.TABLES.CHANNEL, 'thumbnail', 'photo');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn(consts.TABLES.CHANNEL, 'photo', 'thumbnail');
  },
};
