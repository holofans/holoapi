const {Router} = require('express');
const {log} = require('../library');

const router = new Router();

// Default 404 Handler
router.use((req, res) => {
  res.status(404).send({error: 404}).end();
});

// Default 404 Handler
router.use((err, req, res, next) => {
  log.error('Error', err);
  res.status(500).send({error: err.message}).end();
});

module.exports = router;
