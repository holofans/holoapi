const { Router } = require('express');
const { asyncMiddleware } = require('../middleware/error');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  res.redirect('/api-docs');
}));

router.get('/api-docs', asyncMiddleware(async (req, res) => {
  res.redirect('/v1/api-docs/');
}));

module.exports = router;
