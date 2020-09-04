const { TABLES } = require('../../consts');
const hololive = require('./json/hololive.json');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // map json to index
    const channels = hololive.channels.map((item, index) => ({
      id: index + 1,
      yt_channel_id: item.youtube,
      name: item.ytName,
      twitter_link: item.twitter,
    }));

    // bulk insert new channels
    await queryInterface.bulkInsert(TABLES.CHANNEL, channels, { 
      ignoreDuplicates: true,
    });

    // update channels
    await Promise.all(channels.map((channel) => 
      queryInterface.bulkUpdate(TABLES.CHANNEL, channel, {
        id: channel.id
    })));
  },

  down: (queryInterface) => queryInterface.bulkDelete(TABLES.CHANNEL, {
    yt_channel_id: hololive.channels.map((item) => item.youtube),
  }),
};