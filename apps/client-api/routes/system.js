const { Router } = require('express');
// const {settings} = require('../library');

const router = new Router();

// Root
module.exports = router.get('/', (req, res) => {
  res.json({ time: Date.now() });
});
