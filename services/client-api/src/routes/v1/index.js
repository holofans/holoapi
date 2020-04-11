const {Router} = require('express');

const router = new Router();

router.get('/', (req, res) => {
  res.status(200).json({v: 1});
});

router.use('/live', require('./live'));
router.use('/channels', require('./channels'));
router.use('/videos', require('./videos'));
router.use('/songs', require('./songs'));
router.use('/games', require('./games'));
router.use('/series', require('./series'));

module.exports = router;
