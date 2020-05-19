const {Router} = require('express');
// const {settings} = require('../library');

const router = new Router();

// Root
router.get('/', (req, res) => {
  res.json({ time: Date.now() });
});

module.exports = router;


