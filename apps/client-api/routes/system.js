const Sequelize = require('sequelize');
const { Router } = require('express');
const { db } = require('../../../modules');

const router = new Router();

router.get('/', async (req, res) => {
  const channel = await db.Channel.findOne({ order: Sequelize.literal('RANDOM()') });

  res.json({ time: Date.now(), channel });
});

module.exports = router;
