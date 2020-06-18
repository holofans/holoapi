const { TABLES } = require('../../consts');
const hololive = require('./json/hololive.json');

module.exports = {
  up: (queryInterface) => queryInterface.bulkInsert(TABLES.CHANNEL, hololive.channels.map((item) => ({
    yt_channel_id: item.youtube,
    name: item.ytName,
    twitter_link: item.twitter,
  }))),

  down: (queryInterface) => queryInterface.bulkDelete(TABLES.CHANNEL, {
    yt_channel_id: hololive.channels.map((item) => item.youtube),
  }),
};
