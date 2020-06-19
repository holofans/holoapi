const Sequelize = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../modules');
const { asyncMiddleware } = require('../middleware/error');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const randomChannel = await db.Channel.findOne({
    include: [{
      as: 'stats',
      model: db.ChannelStats,
    }, {
      as: 'videos',
      model: db.Video,
      include: [
        {
          as: 'comments',
          model: db.VideoComment,
        },
      ],
    }],
    order: Sequelize.literal('RANDOM()'),
  });

  // Might be a good idea redirect to docs site from here
  // or serve a static page
  res.json({
    time: Date.now(),
    random_channel: randomChannel,
  });
}));

module.exports = router;
