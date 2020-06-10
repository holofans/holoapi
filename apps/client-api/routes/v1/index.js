/* eslint-disable */
const { Router } = require('express');

const router = new Router();
const fs = require('fs');

router.get('/', (req, res) => {
  res.status(200).json({ v: 1 });
});

// Find .js files, and map them
fs.readdir('./', (e, files) => (e ? console.error
  : files.filter((file) => file.endsWith('.js')).map((file) => {
    const name = file.split('.')[0];
    router.use(`/${name}`, require(`./${name}`));
  })));

// router.use('/live', require('./live'));
// router.use('/channels', require('./channels'));
// router.use('/videos', require('./videos'));
// router.use('/songs', require('./songs'));
// router.use('/games', require('./games'));
// router.use('/series', require('./series'));

module.exports = router;
