const { Router } = require('express');

const router = new Router();

router.use('/live', require('./live'));
router.use('/channels', require('./channels'));
router.use('/videos', require('./videos'));
router.use('/comments', require('./comments'));
router.use('/api-docs', require('./api-docs'));
// router.use('/games', require('./games'));
// router.use('/series', require('./series'));

module.exports = router;
