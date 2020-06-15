const Sequelize = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../modules');
const { asyncMiddleware } = require('../middleware/error');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  const channel = await db.Channel.findOne({
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


  res.json({
    time: Date.now(),
    channel,
  });
}));

module.exports = router;
