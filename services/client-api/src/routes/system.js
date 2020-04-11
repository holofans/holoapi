const {Router} = require('express');
const {settings} = require('../library');

const router = new Router();

// Root
router.get('/', (req, res) => {
  res.json({env: settings.env, time: Date.now()});
});

module.exports = router;


