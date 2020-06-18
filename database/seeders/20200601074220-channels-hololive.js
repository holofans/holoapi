const consts = require('../../consts');
const hololive = require('./json/hololive.json');

module.exports = {
  up: (queryInterface) => queryInterface.bulkInsert(consts.TABLES.CHANNEL, hololive.channels.map((item) => ({
    yt_channel_id: item.youtube,
    name: item.ytName,
    twitter_link: item.twitter,
  }))),

  down: (queryInterface) => queryInterface.bulkDelete(consts.TABLES.CHANNEL, {
    yt_channel_id: hololive.channels.map((item) => item.youtube),
  }),
};
