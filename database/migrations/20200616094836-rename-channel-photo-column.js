const consts = require('../../consts');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'thumbnail', 'photo');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn(consts.TABLE_CHANNEL, 'photo', 'thumbnail');
  },
};
