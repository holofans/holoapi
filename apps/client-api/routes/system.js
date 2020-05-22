const Sequelize = require('sequelize');
const { Router } = require('express');
const { database } = require('../../../modules');

const router = new Router();

router.get('/', async (req, res) => {
  const channel = await database.models.Channel.findOne({ order: Sequelize.literal('RANDOM()') });

  res.json({ time: Date.now(), channel });
});

module.exports = router;
