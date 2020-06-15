const consts = require('../../consts');
const hololive = require('./json/hololive.json');

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(consts.TABLE_CHANNEL, hololive.channels.map((item) => ({
      yt_channel_id: item.youtube,
      name: item.ytName,
      twitter_link: item.twitter,
    })));
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete(consts.TABLE_CHANNEL, {
      yt_channel_id: hololive.channels.map((item) => item.youtube),
    });
  },
};
